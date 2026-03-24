import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class ManufacturersService {
  private readonly logger = new Logger(ManufacturersService.name);

  constructor(@InjectDataSource() private ds: DataSource) {}

  // ═══ READ ═══

  async findById(manufacturerId: string): Promise<any> {
    const [row] = await this.ds.query(
      `SELECT manufacturer_id as "manufacturerId", brand_id as "brandId",
        legal_name as "legalName", dba_name as "dbaName",
        license_number as "licenseNumber", license_type as "licenseType",
        license_state as "licenseState", license_expiry_date as "licenseExpiryDate",
        address_line1 as "addressLine1", city, state, zip,
        contact_email as "contactEmail", contact_phone as "contactPhone",
        is_active as "isActive",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM manufacturers WHERE manufacturer_id = $1 AND deleted_at IS NULL`,
      [manufacturerId],
    );
    if (!row) throw new NotFoundException('Manufacturer not found');
    return row;
  }

  async findAll(limit = 50, offset = 0): Promise<any[]> {
    return this.ds.query(
      `SELECT manufacturer_id as "manufacturerId", brand_id as "brandId",
        legal_name as "legalName", dba_name as "dbaName",
        license_number as "licenseNumber", license_state as "licenseState",
        contact_email as "contactEmail", city, state,
        is_active as "isActive", created_at as "createdAt"
      FROM manufacturers WHERE deleted_at IS NULL ORDER BY legal_name LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
  }

  async findByBrand(brandId: string): Promise<any[]> {
    return this.ds.query(
      `SELECT manufacturer_id as "manufacturerId", brand_id as "brandId",
        legal_name as "legalName", dba_name as "dbaName",
        license_number as "licenseNumber", license_state as "licenseState",
        contact_email as "contactEmail", city, state,
        is_active as "isActive", created_at as "createdAt"
      FROM manufacturers WHERE brand_id = $1 AND deleted_at IS NULL ORDER BY legal_name`,
      [brandId],
    );
  }

  // ═══ CREATE ═══

  async create(input: {
    brandId?: string; legalName: string; dbaName?: string;
    licenseNumber?: string; licenseType?: string; licenseState?: string; licenseExpiryDate?: string;
    addressLine1?: string; city?: string; state?: string; zip?: string;
    contactEmail?: string; contactPhone?: string;
  }): Promise<any> {
    const [row] = await this.ds.query(
      `INSERT INTO manufacturers (brand_id, legal_name, dba_name,
        license_number, license_type, license_state, license_expiry_date,
        address_line1, city, state, zip, contact_email, contact_phone)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [input.brandId || null, input.legalName, input.dbaName || null,
        input.licenseNumber || null, input.licenseType || null,
        input.licenseState || null, input.licenseExpiryDate || null,
        input.addressLine1 || null, input.city || null, input.state || null, input.zip || null,
        input.contactEmail || null, input.contactPhone || null],
    );
    this.logger.log('Manufacturer created: ' + row.legal_name + ' (' + row.manufacturer_id + ')');
    return this.findById(row.manufacturer_id);
  }

  // ═══ UPDATE ═══

  async update(manufacturerId: string, input: {
    brandId?: string; legalName?: string; dbaName?: string;
    licenseNumber?: string; licenseType?: string; licenseState?: string; licenseExpiryDate?: string;
    addressLine1?: string; city?: string; state?: string; zip?: string;
    contactEmail?: string; contactPhone?: string; isActive?: boolean;
  }): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const map: Record<string, string> = {
      brandId: 'brand_id', legalName: 'legal_name', dbaName: 'dba_name',
      licenseNumber: 'license_number', licenseType: 'license_type',
      licenseState: 'license_state', licenseExpiryDate: 'license_expiry_date',
      addressLine1: 'address_line1', city: 'city', state: 'state', zip: 'zip',
      contactEmail: 'contact_email', contactPhone: 'contact_phone', isActive: 'is_active',
    };

    for (const [key, col] of Object.entries(map)) {
      if ((input as any)[key] !== undefined) {
        fields.push(col + ' = $' + idx);
        values.push((input as any)[key]);
        idx++;
      }
    }

    if (fields.length === 0) return this.findById(manufacturerId);

    values.push(manufacturerId);
    await this.ds.query(
      'UPDATE manufacturers SET ' + fields.join(', ') + ', updated_at = NOW() WHERE manufacturer_id = $' + idx + ' AND deleted_at IS NULL',
      values,
    );

    this.logger.log('Manufacturer updated: ' + manufacturerId);
    return this.findById(manufacturerId);
  }

  // ═══ DELETE ═══

  async softDelete(manufacturerId: string): Promise<boolean> {
    const result = await this.ds.query(
      'UPDATE manufacturers SET deleted_at = NOW() WHERE manufacturer_id = $1 AND deleted_at IS NULL',
      [manufacturerId],
    );
    return result[1] > 0;
  }
}
