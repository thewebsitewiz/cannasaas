import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface CompanyDto {
  companyId: string;
  organizationId: string;
  legalName: string;
  dbaName?: string | null;
  ein?: string | null;
  stateOfIncorporation?: string | null;
  licenseNumber?: string | null;
  licenseType?: string | null;
  licenseState?: string | null;
  licenseExpiryDate?: string | Date | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  metrcFacilityLicense?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CompanyListItemDto {
  companyId: string;
  organizationId: string;
  legalName: string;
  dbaName?: string | null;
  licenseNumber?: string | null;
  licenseState?: string | null;
  contactEmail?: string | null;
  city?: string | null;
  state?: string | null;
  createdAt: Date | string;
}

interface CreatedCompanyRow {
  company_id: string;
  legal_name: string;
}

export interface CreateCompanyInput {
  organizationId: string;
  legalName: string;
  dbaName?: string;
  ein?: string;
  stateOfIncorporation?: string;
  licenseNumber?: string;
  licenseType?: string;
  licenseState?: string;
  licenseExpiryDate?: string;
  contactEmail?: string;
  contactPhone?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface UpdateCompanyInput {
  legalName?: string;
  dbaName?: string;
  ein?: string;
  stateOfIncorporation?: string;
  licenseNumber?: string;
  licenseType?: string;
  licenseState?: string;
  licenseExpiryDate?: string;
  contactEmail?: string;
  contactPhone?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  zip?: string;
  metrcFacilityLicense?: string;
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
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(@InjectDataSource() private ds: DataSource) {}

  // ═══ READ ═══

  async findById(companyId: string): Promise<CompanyDto> {
    const rows = await rawQuery<CompanyDto>(
      this.ds,
      `SELECT company_id as "companyId", organization_id as "organizationId",
        legal_name as "legalName", dba_name as "dbaName", ein,
        state_of_incorporation as "stateOfIncorporation",
        license_number as "licenseNumber", license_type as "licenseType",
        license_state as "licenseState", license_expiry_date as "licenseExpiryDate",
        contact_email as "contactEmail", contact_phone as "contactPhone",
        address_line1 as "addressLine1", city, state, zip,
        metrc_facility_license as "metrcFacilityLicense",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM companies WHERE company_id = $1 AND deleted_at IS NULL`,
      [companyId],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException('Company not found');
    return row;
  }

  async findAll(limit = 50, offset = 0): Promise<CompanyListItemDto[]> {
    return rawQuery<CompanyListItemDto>(
      this.ds,
      `SELECT company_id as "companyId", organization_id as "organizationId",
        legal_name as "legalName", dba_name as "dbaName",
        license_number as "licenseNumber", license_state as "licenseState",
        contact_email as "contactEmail", city, state,
        created_at as "createdAt"
      FROM companies WHERE deleted_at IS NULL ORDER BY legal_name LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
  }

  async findByOrganization(
    organizationId: string,
  ): Promise<CompanyListItemDto[]> {
    return rawQuery<CompanyListItemDto>(
      this.ds,
      `SELECT company_id as "companyId", organization_id as "organizationId",
        legal_name as "legalName", dba_name as "dbaName",
        license_number as "licenseNumber", license_state as "licenseState",
        contact_email as "contactEmail", city, state,
        created_at as "createdAt"
      FROM companies WHERE organization_id = $1 AND deleted_at IS NULL ORDER BY legal_name`,
      [organizationId],
    );
  }

  // ═══ CREATE ═══

  async create(input: CreateCompanyInput): Promise<CompanyDto> {
    const rows = await rawQuery<CreatedCompanyRow>(
      this.ds,
      `INSERT INTO companies (organization_id, legal_name, dba_name, ein,
        state_of_incorporation, license_number, license_type, license_state, license_expiry_date,
        contact_email, contact_phone, address_line1, city, state, zip)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING company_id, legal_name`,
      [
        input.organizationId,
        input.legalName,
        input.dbaName ?? null,
        input.ein ?? null,
        input.stateOfIncorporation ?? null,
        input.licenseNumber ?? null,
        input.licenseType ?? null,
        input.licenseState ?? null,
        input.licenseExpiryDate ?? null,
        input.contactEmail ?? null,
        input.contactPhone ?? null,
        input.addressLine1 ?? null,
        input.city ?? null,
        input.state ?? null,
        input.zip ?? null,
      ],
    );
    const row = rows[0];
    this.logger.log(
      'Company created: ' + row.legal_name + ' (' + row.company_id + ')',
    );
    return this.findById(row.company_id);
  }

  // ═══ UPDATE ═══

  async update(
    companyId: string,
    input: UpdateCompanyInput,
  ): Promise<CompanyDto> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const map: Array<[keyof UpdateCompanyInput, string]> = [
      ['legalName', 'legal_name'],
      ['dbaName', 'dba_name'],
      ['ein', 'ein'],
      ['stateOfIncorporation', 'state_of_incorporation'],
      ['licenseNumber', 'license_number'],
      ['licenseType', 'license_type'],
      ['licenseState', 'license_state'],
      ['licenseExpiryDate', 'license_expiry_date'],
      ['contactEmail', 'contact_email'],
      ['contactPhone', 'contact_phone'],
      ['addressLine1', 'address_line1'],
      ['city', 'city'],
      ['state', 'state'],
      ['zip', 'zip'],
      ['metrcFacilityLicense', 'metrc_facility_license'],
    ];

    for (const [key, col] of map) {
      const value = input[key];
      if (value !== undefined) {
        fields.push(col + ' = $' + String(idx));
        values.push(value);
        idx++;
      }
    }

    if (fields.length === 0) return this.findById(companyId);

    values.push(companyId);
    await this.ds.query(
      'UPDATE companies SET ' +
        fields.join(', ') +
        ', updated_at = NOW() WHERE company_id = $' +
        String(idx) +
        ' AND deleted_at IS NULL',
      values,
    );

    this.logger.log('Company updated: ' + companyId);
    return this.findById(companyId);
  }

  // ═══ DELETE ═══

  async softDelete(companyId: string): Promise<boolean> {
    const result = (await this.ds.query(
      'UPDATE companies SET deleted_at = NOW() WHERE company_id = $1 AND deleted_at IS NULL',
      [companyId],
    )) as unknown;
    if (Array.isArray(result) && typeof result[1] === 'number') {
      return result[1] > 0;
    }
    return false;
  }
}
