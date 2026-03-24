import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(@InjectDataSource() private ds: DataSource) {}

  // ═══ READ ═══

  async findById(organizationId: string): Promise<any> {
    const [row] = await this.ds.query(
      `SELECT organization_id as "organizationId", name, slug,
        billing_email as "billingEmail", billing_address as "billingAddress",
        subscription_tier as "subscriptionTier", subscription_status as "subscriptionStatus",
        stripe_customer_id as "stripeCustomerId",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM organizations WHERE organization_id = $1 AND deleted_at IS NULL`,
      [organizationId],
    );
    if (!row) throw new NotFoundException('Organization not found');
    return row;
  }

  async findAll(limit = 50, offset = 0): Promise<any[]> {
    return this.ds.query(
      `SELECT organization_id as "organizationId", name, slug,
        billing_email as "billingEmail",
        subscription_tier as "subscriptionTier", subscription_status as "subscriptionStatus",
        created_at as "createdAt"
      FROM organizations WHERE deleted_at IS NULL ORDER BY name LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
  }

  async findBySlug(slug: string): Promise<any> {
    const [row] = await this.ds.query(
      `SELECT organization_id as "organizationId", name, slug,
        billing_email as "billingEmail", billing_address as "billingAddress",
        subscription_tier as "subscriptionTier", subscription_status as "subscriptionStatus",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM organizations WHERE slug = $1 AND deleted_at IS NULL`,
      [slug],
    );
    if (!row) throw new NotFoundException('Organization not found');
    return row;
  }

  // ═══ CREATE ═══

  async create(input: {
    name: string; slug: string;
    billingEmail?: string; billingAddress?: string;
    subscriptionTier?: string;
  }): Promise<any> {
    const [row] = await this.ds.query(
      `INSERT INTO organizations (name, slug, billing_email, billing_address, subscription_tier)
      VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [input.name, input.slug, input.billingEmail || null, input.billingAddress || null, input.subscriptionTier || 'starter'],
    );
    this.logger.log('Organization created: ' + row.name + ' (' + row.organization_id + ')');
    return this.findById(row.organization_id);
  }

  // ═══ UPDATE ═══

  async update(organizationId: string, input: {
    name?: string; slug?: string;
    billingEmail?: string; billingAddress?: string;
  }): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const map: Record<string, string> = {
      name: 'name', slug: 'slug',
      billingEmail: 'billing_email', billingAddress: 'billing_address',
    };

    for (const [key, col] of Object.entries(map)) {
      if ((input as any)[key] !== undefined) {
        fields.push(col + ' = $' + idx);
        values.push((input as any)[key]);
        idx++;
      }
    }

    if (fields.length === 0) return this.findById(organizationId);

    values.push(organizationId);
    await this.ds.query(
      'UPDATE organizations SET ' + fields.join(', ') + ', updated_at = NOW() WHERE organization_id = $' + idx + ' AND deleted_at IS NULL',
      values,
    );

    this.logger.log('Organization updated: ' + organizationId);
    return this.findById(organizationId);
  }

  // ═══ SUBSCRIPTION MANAGEMENT ═══

  async updateSubscription(organizationId: string, input: {
    subscriptionTier?: string; subscriptionStatus?: string; stripeCustomerId?: string;
  }): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (input.subscriptionTier !== undefined) { fields.push('subscription_tier = $' + idx); values.push(input.subscriptionTier); idx++; }
    if (input.subscriptionStatus !== undefined) { fields.push('subscription_status = $' + idx); values.push(input.subscriptionStatus); idx++; }
    if (input.stripeCustomerId !== undefined) { fields.push('stripe_customer_id = $' + idx); values.push(input.stripeCustomerId); idx++; }

    if (fields.length === 0) return this.findById(organizationId);

    values.push(organizationId);
    await this.ds.query(
      'UPDATE organizations SET ' + fields.join(', ') + ', updated_at = NOW() WHERE organization_id = $' + idx + ' AND deleted_at IS NULL',
      values,
    );

    this.logger.log('Subscription updated for org: ' + organizationId + ' tier=' + (input.subscriptionTier || 'unchanged'));
    return this.findById(organizationId);
  }

  // ═══ DELETE ═══

  async softDelete(organizationId: string): Promise<boolean> {
    const result = await this.ds.query(
      'UPDATE organizations SET deleted_at = NOW() WHERE organization_id = $1 AND deleted_at IS NULL',
      [organizationId],
    );
    return result[1] > 0;
  }
}
