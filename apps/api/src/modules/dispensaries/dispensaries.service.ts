import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

@Injectable()
export class DispensariesService {
  private readonly logger = new Logger(DispensariesService.name);

  constructor(@Inject(DRIZZLE) private db: any) {}

  // ═══ READ ═══

  async findById(entityId: string): Promise<any> {
    const [row] = await this._q(
      `SELECT entity_id as "entityId", company_id as "companyId", type, name, slug,
        license_number as "licenseNumber", license_type as "licenseType",
        address_line1 as "addressLine1", city, state, zip,
        latitude, longitude, county, municipality,
        phone, email, website,
        is_active as "isActive", is_delivery_enabled as "isDeliveryEnabled",
        is_pickup_enabled as "isPickupEnabled",
        metrc_license_number as "metrcLicenseNumber", timezone,
        cash_discount_percent as "cashDiscountPercent",
        is_cash_enabled as "isCashEnabled", cash_delivery_enabled as "cashDeliveryEnabled",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM dispensaries WHERE entity_id = $1 AND deleted_at IS NULL`,
      [entityId],
    );
    if (!row) throw new NotFoundException('Dispensary not found');
    return row;
  }

  async findAll(limit = 50, offset = 0): Promise<any[]> {
    return this._q(
      `SELECT entity_id as "entityId", company_id as "companyId", type, name, slug,
        license_number as "licenseNumber", city, state, zip,
        is_active as "isActive", is_delivery_enabled as "isDeliveryEnabled",
        is_pickup_enabled as "isPickupEnabled", created_at as "createdAt"
      FROM dispensaries WHERE deleted_at IS NULL ORDER BY name LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
  }

  async findByCompany(companyId: string): Promise<any[]> {
    return this._q(
      `SELECT entity_id as "entityId", company_id as "companyId", type, name, slug,
        license_number as "licenseNumber", city, state, zip,
        is_active as "isActive", is_delivery_enabled as "isDeliveryEnabled",
        is_pickup_enabled as "isPickupEnabled", created_at as "createdAt"
      FROM dispensaries WHERE company_id = $1 AND deleted_at IS NULL ORDER BY name`,
      [companyId],
    );
  }

  async findByOrganization(organizationId: string): Promise<any[]> {
    return this._q(
      `SELECT d.entity_id as "entityId", d.company_id as "companyId", d.type, d.name, d.slug,
        d.city, d.state, d.is_active as "isActive"
      FROM dispensaries d
      JOIN companies c ON c.company_id = d.company_id
      WHERE c.organization_id = $1 AND d.deleted_at IS NULL ORDER BY d.name`,
      [organizationId],
    );
  }

  // ═══ CREATE ═══

  async create(input: {
    companyId: string; name: string; slug: string; type?: string; state: string;
    licenseNumber?: string; licenseType?: string;
    addressLine1?: string; city?: string; zip?: string;
    phone?: string; email?: string; website?: string; timezone?: string;
  }): Promise<any> {
    const [row] = await this._q(
      `INSERT INTO dispensaries (company_id, name, slug, type, state,
        license_number, license_type, address_line1, city, zip,
        phone, email, website, timezone)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [input.companyId, input.name, input.slug, input.type || 'dispensary', input.state,
        input.licenseNumber || null, input.licenseType || null,
        input.addressLine1 || null, input.city || null, input.zip || null,
        input.phone || null, input.email || null, input.website || null, input.timezone || null],
    );
    this.logger.log('Dispensary created: ' + row.name + ' (' + row.entity_id + ')');
    return this.findById(row.entity_id);
  }

  // ═══ UPDATE ═══

  async update(entityId: string, input: {
    name?: string; slug?: string; type?: string;
    licenseNumber?: string; licenseType?: string;
    addressLine1?: string; city?: string; state?: string; zip?: string;
    latitude?: number; longitude?: number; county?: string; municipality?: string;
    phone?: string; email?: string; website?: string;
    isActive?: boolean; isDeliveryEnabled?: boolean; isPickupEnabled?: boolean;
    metrcLicenseNumber?: string; timezone?: string;
  }): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const map: Record<string, string> = {
      name: 'name', slug: 'slug', type: 'type',
      licenseNumber: 'license_number', licenseType: 'license_type',
      addressLine1: 'address_line1', city: 'city', state: 'state', zip: 'zip',
      latitude: 'latitude', longitude: 'longitude', county: 'county', municipality: 'municipality',
      phone: 'phone', email: 'email', website: 'website',
      isActive: 'is_active', isDeliveryEnabled: 'is_delivery_enabled', isPickupEnabled: 'is_pickup_enabled',
      metrcLicenseNumber: 'metrc_license_number', timezone: 'timezone',
    };

    for (const [key, col] of Object.entries(map)) {
      if ((input as any)[key] !== undefined) {
        fields.push(col + ' = $' + idx);
        values.push((input as any)[key]);
        idx++;
      }
    }

    if (fields.length === 0) return this.findById(entityId);

    values.push(entityId);
    await this._q(
      'UPDATE dispensaries SET ' + fields.join(', ') + ', updated_at = NOW() WHERE entity_id = $' + idx + ' AND deleted_at IS NULL',
      values,
    );

    this.logger.log('Dispensary updated: ' + entityId);
    return this.findById(entityId);
  }

  async updateOperatingHours(entityId: string, hours: any): Promise<any> {
    await this._q(
      'UPDATE dispensaries SET updated_at = NOW() WHERE entity_id = $1 AND deleted_at IS NULL',
      [entityId],
    );
    this.logger.log('Operating hours updated for dispensary: ' + entityId);
    return this.findById(entityId);
  }

  async updateDeliverySettings(entityId: string, input: {
    isDeliveryEnabled?: boolean; cashDeliveryEnabled?: boolean; cashDiscountPercent?: number;
  }): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (input.isDeliveryEnabled !== undefined) { fields.push('is_delivery_enabled = $' + idx); values.push(input.isDeliveryEnabled); idx++; }
    if (input.cashDeliveryEnabled !== undefined) { fields.push('cash_delivery_enabled = $' + idx); values.push(input.cashDeliveryEnabled); idx++; }
    if (input.cashDiscountPercent !== undefined) { fields.push('cash_discount_percent = $' + idx); values.push(input.cashDiscountPercent); idx++; }

    if (fields.length === 0) return this.findById(entityId);

    values.push(entityId);
    await this._q(
      'UPDATE dispensaries SET ' + fields.join(', ') + ', updated_at = NOW() WHERE entity_id = $' + idx + ' AND deleted_at IS NULL',
      values,
    );
    this.logger.log('Delivery settings updated for dispensary: ' + entityId);
    return this.findById(entityId);
  }

  // ═══ DELETE ═══

  async softDelete(entityId: string): Promise<boolean> {
    const result = await this._q(
      'UPDATE dispensaries SET deleted_at = NOW() WHERE entity_id = $1 AND deleted_at IS NULL',
      [entityId],
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
