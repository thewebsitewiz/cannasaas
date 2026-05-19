import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Int,
  InputType,
  ObjectType,
} from '@nestjs/graphql';
import { Field } from '@nestjs/graphql';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

// ── Types ────────────────────────────────────────────────────

@ObjectType()
export class CustomerSearchResult {
  @Field(() => ID) userId!: string;
  @Field() email!: string;
  @Field({ nullable: true }) firstName?: string;
  @Field({ nullable: true }) lastName?: string;
  @Field({ nullable: true }) phone?: string;
  @Field() ageVerified!: boolean;
  @Field(() => Int) totalOrders!: number;
}

@InputType()
export class CreateWalkInCustomerInput {
  @Field() firstName!: string;
  @Field() lastName!: string;
  @Field({ nullable: true }) email?: string;
  @Field({ nullable: true }) phone?: string;
  @Field(() => ID) dispensaryId!: string;
}

interface CustomerSearchRow {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  ageVerified: boolean;
  totalOrders: number;
}

interface DispensaryDomainRow {
  email: string | null;
  website: string | null;
}

interface UserExistsRow {
  id: string;
}

interface NewUserRow {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

async function rawQuery<T>(
  ds: DataSource,
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const rows = (await ds.query(sql, params)) as unknown;
  return rows as T[];
}

async function runnerQuery<T>(
  qr: QueryRunner,
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const rows = (await qr.query(sql, params)) as unknown;
  return rows as T[];
}

// ── Resolver ─────────────────────────────────────────────────

@Resolver()
export class StaffPosResolver {
  constructor(@InjectDataSource() private ds: DataSource) {}

  /**
   * Search customers by phone, email, or name.
   * Accessible to budtenders and above.
   */
  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [CustomerSearchResult], { name: 'searchCustomers' })
  async searchCustomers(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('query') query: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 })
    rawLimit = 10,
    @CurrentUser() user?: JwtPayload,
  ): Promise<CustomerSearchResult[]> {
    if (user && user.role !== 'super_admin' && user.dispensaryId !== dispensaryId) {
      throw new ForbiddenException('Cross-dispensary search not allowed');
    }
    const q = query.trim();
    if (q.length < 2) return [];

    const limit = Math.min(rawLimit, 50);
    const pattern = `%${q}%`;

    // Scope results to customers tied to this dispensary: either by
    // preferred_dispensary_id OR by having placed an order at this
    // dispensary at some point. Pre-sc-609 this query returned
    // customers across ALL tenants — a budtender at tenant A could
    // enumerate every customer in the system.
    const rows = await rawQuery<CustomerSearchRow>(
      this.ds,
      `SELECT DISTINCT
         u.id AS "userId",
         u.email,
         u."firstName",
         u."lastName",
         cp.phone,
         COALESCE(u."ageVerified", false) AS "ageVerified",
         COALESCE(cp.total_orders, 0)::int AS "totalOrders"
       FROM users u
       LEFT JOIN customer_profiles cp ON cp.user_id = u.id
       WHERE u.role = 'customer'
         AND u."isActive" = true
         AND (
           cp.preferred_dispensary_id = $3
           OR EXISTS (
             SELECT 1 FROM orders o
             WHERE o."customerUserId" = u.id AND o.dispensary_id = $3
           )
         )
         AND (
           u.email ILIKE $1
           OR u."firstName" ILIKE $1
           OR u."lastName" ILIKE $1
           OR cp.phone ILIKE $1
           OR CONCAT(u."firstName", ' ', u."lastName") ILIKE $1
         )
       ORDER BY
         CASE WHEN u.email ILIKE $1 THEN 0 WHEN cp.phone ILIKE $1 THEN 1 ELSE 2 END,
         u."lastName" ASC
       LIMIT $2`,
      [pattern, limit, dispensaryId],
    );

    return rows.map((r) => ({
      userId: r.userId,
      email: r.email,
      firstName: r.firstName ?? undefined,
      lastName: r.lastName ?? undefined,
      phone: r.phone ?? undefined,
      ageVerified: r.ageVerified,
      totalOrders: r.totalOrders,
    }));
  }

  /**
   * Create a walk-in customer for in-store purchases.
   * Generates a placeholder email if none provided.
   * Auto-creates user + customer_profile in one transaction.
   */
  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => CustomerSearchResult, { name: 'createWalkInCustomer' })
  async createWalkInCustomer(
    @Args('input') input: CreateWalkInCustomerInput,
  ): Promise<CustomerSearchResult> {
    if (!input.firstName.trim()) {
      throw new BadRequestException('First name is required');
    }

    let email = input.email?.trim() ?? '';
    if (!email) {
      const dispRows = await rawQuery<DispensaryDomainRow>(
        this.ds,
        `SELECT email, website FROM dispensaries WHERE entity_id = $1`,
        [input.dispensaryId],
      );
      const disp = dispRows[0];
      let domain = 'pos.local';
      if (disp?.email) {
        domain = disp.email.split('@')[1] ?? domain;
      } else if (disp?.website) {
        domain =
          disp.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '') ||
          domain;
      }
      const digits = String(Math.floor(100000 + Math.random() * 900000));
      email = `walkin-${digits}@pos.${domain}`;
    }

    if (input.email?.trim()) {
      const existing = await rawQuery<UserExistsRow>(
        this.ds,
        `SELECT id FROM users WHERE email = $1`,
        [email],
      );
      if (existing[0]) {
        throw new BadRequestException(
          `A customer with email ${email} already exists. Use the search to find them.`,
        );
      }
    }

    const qr = this.ds.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const passwordHash = await bcrypt.hash(
        crypto.randomBytes(16).toString('hex'),
        12,
      );

      const userRows = await runnerQuery<NewUserRow>(
        qr,
        `INSERT INTO users (id, email, "passwordHash", role, "firstName", "lastName", "isActive", "emailVerified", "dispensaryId")
         VALUES (gen_random_uuid(), $1, $2, 'customer', $3, $4, true, false, $5)
         RETURNING id, email, "firstName", "lastName"`,
        [
          email,
          passwordHash,
          input.firstName.trim(),
          input.lastName.trim() || null,
          input.dispensaryId,
        ],
      );
      const user = userRows[0];

      await qr.query(
        `INSERT INTO customer_profiles (profile_id, user_id, phone, preferred_dispensary_id, marketing_opt_in, sms_opt_in)
         VALUES (gen_random_uuid(), $1, $2, $3, false, false)`,
        [user.id, input.phone?.trim() ?? null, input.dispensaryId],
      );

      await qr.commitTransaction();

      return {
        userId: user.id,
        email: user.email,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        phone: input.phone?.trim() || undefined,
        ageVerified: false,
        totalOrders: 0,
      };
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }
}
