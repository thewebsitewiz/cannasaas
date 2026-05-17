import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface ManufacturerDto {
  manufacturerId: string;
  brandId?: string | null;
  legalName: string;
  dbaName?: string | null;
  licenseNumber?: string | null;
  licenseType?: string | null;
  licenseState?: string | null;
  licenseExpiryDate?: string | Date | null;
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

interface CreatedRow {
  manufacturer_id: string;
  legal_name: string;
}

export interface CreateManufacturerInput {
  brandId?: string;
  legalName: string;
  dbaName?: string;
  licenseNumber?: string;
  licenseType?: string;
  licenseState?: string;
  licenseExpiryDate?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  zip?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface UpdateManufacturerInput {
  brandId?: string;
  legalName?: string;
  dbaName?: string;
  licenseNumber?: string;
  licenseType?: string;
  licenseState?: string;
  licenseExpiryDate?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  zip?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive?: boolean;
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
export class ManufacturersService {
  private readonly logger = new Logger(ManufacturersService.name);

  constructor(@InjectDataSource() private ds: DataSource) {}

  async findById(manufacturerId: string): Promise<ManufacturerDto> {
    const rows = await rawQuery<ManufacturerDto>(
      this.ds,
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
    const row = rows[0];
    if (!row) throw new NotFoundException('Manufacturer not found');
    return row;
  }

  async findAll(limit = 50, offset = 0): Promise<ManufacturerDto[]> {
    return rawQuery<ManufacturerDto>(
      this.ds,
      `SELECT manufacturer_id as "manufacturerId", brand_id as "brandId",
        legal_name as "legalName", dba_name as "dbaName",
        license_number as "licenseNumber", license_state as "licenseState",
        contact_email as "contactEmail", city, state,
        is_active as "isActive", created_at as "createdAt"
      FROM manufacturers WHERE deleted_at IS NULL ORDER BY legal_name LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
  }

  async findByBrand(brandId: string): Promise<ManufacturerDto[]> {
    return rawQuery<ManufacturerDto>(
      this.ds,
      `SELECT manufacturer_id as "manufacturerId", brand_id as "brandId",
        legal_name as "legalName", dba_name as "dbaName",
        license_number as "licenseNumber", license_state as "licenseState",
        contact_email as "contactEmail", city, state,
        is_active as "isActive", created_at as "createdAt"
      FROM manufacturers WHERE brand_id = $1 AND deleted_at IS NULL ORDER BY legal_name`,
      [brandId],
    );
  }

  async create(input: CreateManufacturerInput): Promise<ManufacturerDto> {
    const rows = await rawQuery<CreatedRow>(
      this.ds,
      `INSERT INTO manufacturers (brand_id, legal_name, dba_name,
        license_number, license_type, license_state, license_expiry_date,
        address_line1, city, state, zip, contact_email, contact_phone)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING manufacturer_id, legal_name`,
      [
        input.brandId ?? null,
        input.legalName,
        input.dbaName ?? null,
        input.licenseNumber ?? null,
        input.licenseType ?? null,
        input.licenseState ?? null,
        input.licenseExpiryDate ?? null,
        input.addressLine1 ?? null,
        input.city ?? null,
        input.state ?? null,
        input.zip ?? null,
        input.contactEmail ?? null,
        input.contactPhone ?? null,
      ],
    );
    const row = rows[0];
    this.logger.log(
      'Manufacturer created: ' +
        row.legal_name +
        ' (' +
        row.manufacturer_id +
        ')',
    );
    return this.findById(row.manufacturer_id);
  }

  async update(
    manufacturerId: string,
    input: UpdateManufacturerInput,
  ): Promise<ManufacturerDto> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const map: Array<[keyof UpdateManufacturerInput, string]> = [
      ['brandId', 'brand_id'],
      ['legalName', 'legal_name'],
      ['dbaName', 'dba_name'],
      ['licenseNumber', 'license_number'],
      ['licenseType', 'license_type'],
      ['licenseState', 'license_state'],
      ['licenseExpiryDate', 'license_expiry_date'],
      ['addressLine1', 'address_line1'],
      ['city', 'city'],
      ['state', 'state'],
      ['zip', 'zip'],
      ['contactEmail', 'contact_email'],
      ['contactPhone', 'contact_phone'],
      ['isActive', 'is_active'],
    ];

    for (const [key, col] of map) {
      const value = input[key];
      if (value !== undefined) {
        fields.push(col + ' = $' + String(idx));
        values.push(value);
        idx++;
      }
    }

    if (fields.length === 0) return this.findById(manufacturerId);

    values.push(manufacturerId);
    await this.ds.query(
      'UPDATE manufacturers SET ' +
        fields.join(', ') +
        ', updated_at = NOW() WHERE manufacturer_id = $' +
        String(idx) +
        ' AND deleted_at IS NULL',
      values,
    );

    this.logger.log('Manufacturer updated: ' + manufacturerId);
    return this.findById(manufacturerId);
  }

  async softDelete(manufacturerId: string): Promise<boolean> {
    const result = (await this.ds.query(
      'UPDATE manufacturers SET deleted_at = NOW() WHERE manufacturer_id = $1 AND deleted_at IS NULL',
      [manufacturerId],
    )) as unknown;
    if (Array.isArray(result) && typeof result[1] === 'number') {
      return result[1] > 0;
    }
    return false;
  }
}
