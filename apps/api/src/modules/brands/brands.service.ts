import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

@Injectable()
export class BrandsService {
  private readonly logger = new Logger(BrandsService.name);

  constructor(@Inject(DRIZZLE) private db: any) {}

  // ═══ READ ═══

  async findById(brandId: string): Promise<any> {
    const [row] = await this._q(
      `SELECT brand_id as "brandId", organization_id as "organizationId",
        name, slug, description, logo_url as "logoUrl", website_url as "websiteUrl",
        is_active as "isActive",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM brands WHERE brand_id = $1 AND deleted_at IS NULL`,
      [brandId],
    );
    if (!row) throw new NotFoundException('Brand not found');
    return row;
  }

  async findAll(limit = 50, offset = 0): Promise<any[]> {
    return this._q(
      `SELECT brand_id as "brandId", organization_id as "organizationId",
        name, slug, logo_url as "logoUrl", is_active as "isActive",
        created_at as "createdAt"
      FROM brands WHERE deleted_at IS NULL ORDER BY name LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
  }

  async findByOrganization(organizationId: string): Promise<any[]> {
    return this._q(
      `SELECT brand_id as "brandId", organization_id as "organizationId",
        name, slug, logo_url as "logoUrl", is_active as "isActive",
        created_at as "createdAt"
      FROM brands WHERE organization_id = $1 AND deleted_at IS NULL ORDER BY name`,
      [organizationId],
    );
  }

  // ═══ CREATE ═══

  async create(input: {
    organizationId: string; name: string; slug?: string;
    description?: string; logoUrl?: string; websiteUrl?: string;
  }): Promise<any> {
    const [row] = await this._q(
      `INSERT INTO brands (organization_id, name, slug, description, logo_url, website_url)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [input.organizationId, input.name, input.slug || null,
        input.description || null, input.logoUrl || null, input.websiteUrl || null],
    );
    this.logger.log('Brand created: ' + row.name + ' (' + row.brand_id + ')');
    return this.findById(row.brand_id);
  }

  // ═══ UPDATE ═══

  async update(brandId: string, input: {
    name?: string; slug?: string; description?: string;
    logoUrl?: string; websiteUrl?: string; isActive?: boolean;
  }): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const map: Record<string, string> = {
      name: 'name', slug: 'slug', description: 'description',
      logoUrl: 'logo_url', websiteUrl: 'website_url', isActive: 'is_active',
    };

    for (const [key, col] of Object.entries(map)) {
      if ((input as any)[key] !== undefined) {
        fields.push(col + ' = $' + idx);
        values.push((input as any)[key]);
        idx++;
      }
    }

    if (fields.length === 0) return this.findById(brandId);

    values.push(brandId);
    await this._q(
      'UPDATE brands SET ' + fields.join(', ') + ', updated_at = NOW() WHERE brand_id = $' + idx + ' AND deleted_at IS NULL',
      values,
    );

    this.logger.log('Brand updated: ' + brandId);
    return this.findById(brandId);
  }

  // ═══ DELETE ═══

  async softDelete(brandId: string): Promise<boolean> {
    const result = await this._q(
      'UPDATE brands SET deleted_at = NOW() WHERE brand_id = $1 AND deleted_at IS NULL',
      [brandId],
    );
    return result[1] > 0;
  }

  private async _q(text: string, params?: any[]): Promise<any[]> {
    const client = (this.db as any).session?.client ?? (this.db as any).$client ?? (this.db as any);
    if (client?.query) { const r = await client.query(text, params); return r.rows ?? r; }
    const result = await this.db.execute(sql.raw(text));
    return Array.isArray(result) ? result : (result as any).rows ?? [];
  }
}
