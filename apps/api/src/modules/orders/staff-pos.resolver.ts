import { Resolver, Query, Mutation, Args, ID, Int, InputType, ObjectType } from '@nestjs/graphql';
import { Field } from '@nestjs/graphql';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
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
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 }) rawLimit = 10,
  ): Promise<CustomerSearchResult[]> {
    const q = query.trim();
    if (q.length < 2) return [];

    const limit = Math.min(rawLimit, 50);
    const pattern = `%${q}%`;

    const rows = await this.ds.query(
      `SELECT
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
      [pattern, limit],
    );

    return rows;
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
    if (!input.firstName?.trim()) {
      throw new BadRequestException('First name is required');
    }

    // Generate placeholder email from dispensary domain if none provided
    let email = input.email?.trim() || '';
    if (!email) {
      const [disp] = await this.ds.query(
        `SELECT email, website FROM dispensaries WHERE entity_id = $1`,
        [input.dispensaryId],
      );
      let domain = 'pos.local';
      if (disp?.email) {
        domain = disp.email.split('@')[1] || domain;
      } else if (disp?.website) {
        domain = disp.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '') || domain;
      }
      const digits = String(Math.floor(100000 + Math.random() * 900000));
      email = `walkin-${digits}@pos.${domain}`;
    }

    // Check for existing user with this email (if real email provided)
    if (input.email?.trim()) {
      const [existing] = await this.ds.query(
        `SELECT id FROM users WHERE email = $1`,
        [email],
      );
      if (existing) {
        throw new BadRequestException(
          `A customer with email ${email} already exists. Use the search to find them.`,
        );
      }
    }

    const qr = this.ds.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // Random password — walk-in customers can reset later if they want online access
      const passwordHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);

      const [user] = await qr.query(
        `INSERT INTO users (id, email, "passwordHash", role, "firstName", "lastName", "isActive", "emailVerified", "dispensaryId")
         VALUES (gen_random_uuid(), $1, $2, 'customer', $3, $4, true, false, $5)
         RETURNING id, email, "firstName", "lastName"`,
        [email, passwordHash, input.firstName.trim(), input.lastName?.trim() || null, input.dispensaryId],
      );

      // Create customer profile
      await qr.query(
        `INSERT INTO customer_profiles (profile_id, user_id, phone, preferred_dispensary_id, marketing_opt_in, sms_opt_in)
         VALUES (gen_random_uuid(), $1, $2, $3, false, false)`,
        [user.id, input.phone?.trim() || null, input.dispensaryId],
      );

      await qr.commitTransaction();

      return {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
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
