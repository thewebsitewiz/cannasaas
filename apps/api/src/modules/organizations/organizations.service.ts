import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface OrganizationDto {
  organizationId: string;
  name: string;
  slug: string;
  billingEmail?: string | null;
  billingAddress?: string | null;
  subscriptionTier: string;
  subscriptionStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationListItemDto {
  organizationId: string;
  name: string;
  slug: string;
  billingEmail?: string | null;
  subscriptionTier: string;
  subscriptionStatus: string;
  createdAt: Date;
}

interface CreatedRow {
  organization_id: string;
  name: string;
}

async function rawQuery<T>(
  ds: DataSource,
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const rows = (await ds.query(sql, params)) as unknown;
  return rows as T[];
}

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(@InjectDataSource() private ds: DataSource) {}

  // ═══ READ ═══

  async findById(organizationId: string): Promise<OrganizationDto> {
    const rows = await rawQuery<OrganizationDto>(
      this.ds,
      `SELECT organization_id as "organizationId", name, slug,
        billing_email as "billingEmail", billing_address as "billingAddress",
        subscription_tier as "subscriptionTier", subscription_status as "subscriptionStatus",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM organizations WHERE organization_id = $1 AND deleted_at IS NULL`,
      [organizationId],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException('Organization not found');
    return row;
  }

  async findAll(limit = 50, offset = 0): Promise<OrganizationListItemDto[]> {
    return rawQuery<OrganizationListItemDto>(
      this.ds,
      `SELECT organization_id as "organizationId", name, slug,
        billing_email as "billingEmail",
        subscription_tier as "subscriptionTier", subscription_status as "subscriptionStatus",
        created_at as "createdAt"
      FROM organizations WHERE deleted_at IS NULL ORDER BY name LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
  }

  async findBySlug(slug: string): Promise<OrganizationDto> {
    const rows = await rawQuery<OrganizationDto>(
      this.ds,
      `SELECT organization_id as "organizationId", name, slug,
        billing_email as "billingEmail", billing_address as "billingAddress",
        subscription_tier as "subscriptionTier", subscription_status as "subscriptionStatus",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM organizations WHERE slug = $1 AND deleted_at IS NULL`,
      [slug],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException('Organization not found');
    return row;
  }

  // ═══ CREATE ═══

  async create(input: {
    name: string;
    slug: string;
    billingEmail?: string;
    billingAddress?: string;
    subscriptionTier?: string;
  }): Promise<OrganizationDto> {
    const rows = await rawQuery<CreatedRow>(
      this.ds,
      `INSERT INTO organizations (name, slug, billing_email, billing_address, subscription_tier)
      VALUES ($1,$2,$3,$4,$5) RETURNING organization_id, name`,
      [
        input.name,
        input.slug,
        input.billingEmail || null,
        input.billingAddress || null,
        input.subscriptionTier || 'starter',
      ],
    );
    const row = rows[0];
    this.logger.log(
      'Organization created: ' + row.name + ' (' + row.organization_id + ')',
    );
    return this.findById(row.organization_id);
  }

  // ═══ UPDATE ═══

  async update(
    organizationId: string,
    input: {
      name?: string;
      slug?: string;
      billingEmail?: string;
      billingAddress?: string;
    },
  ): Promise<OrganizationDto> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const map: Array<[keyof typeof input, string]> = [
      ['name', 'name'],
      ['slug', 'slug'],
      ['billingEmail', 'billing_email'],
      ['billingAddress', 'billing_address'],
    ];

    for (const [key, col] of map) {
      const value = input[key];
      if (value !== undefined) {
        fields.push(col + ' = $' + idx);
        values.push(value);
        idx++;
      }
    }

    if (fields.length === 0) return this.findById(organizationId);

    values.push(organizationId);
    await this.ds.query(
      'UPDATE organizations SET ' +
        fields.join(', ') +
        ', updated_at = NOW() WHERE organization_id = $' +
        idx +
        ' AND deleted_at IS NULL',
      values,
    );

    this.logger.log('Organization updated: ' + organizationId);
    return this.findById(organizationId);
  }

  // ═══ SUBSCRIPTION MANAGEMENT ═══

  async updateSubscription(
    organizationId: string,
    input: { subscriptionTier?: string; subscriptionStatus?: string },
  ): Promise<OrganizationDto> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (input.subscriptionTier !== undefined) {
      fields.push('subscription_tier = $' + idx);
      values.push(input.subscriptionTier);
      idx++;
    }
    if (input.subscriptionStatus !== undefined) {
      fields.push('subscription_status = $' + idx);
      values.push(input.subscriptionStatus);
      idx++;
    }

    if (fields.length === 0) return this.findById(organizationId);

    values.push(organizationId);
    await this.ds.query(
      'UPDATE organizations SET ' +
        fields.join(', ') +
        ', updated_at = NOW() WHERE organization_id = $' +
        idx +
        ' AND deleted_at IS NULL',
      values,
    );

    this.logger.log(
      'Subscription updated for org: ' +
        organizationId +
        ' tier=' +
        (input.subscriptionTier || 'unchanged'),
    );
    return this.findById(organizationId);
  }

  // ═══ DELETE ═══

  async softDelete(organizationId: string): Promise<boolean> {
    const result = (await this.ds.query(
      'UPDATE organizations SET deleted_at = NOW() WHERE organization_id = $1 AND deleted_at IS NULL',
      [organizationId],
    )) as unknown;
    if (Array.isArray(result) && typeof result[1] === 'number') {
      return result[1] > 0;
    }
    return false;
  }
}
