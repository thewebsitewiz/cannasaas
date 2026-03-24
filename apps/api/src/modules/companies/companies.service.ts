import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(@Inject(DRIZZLE) private db: any) {}

  // ═══ READ ═══

  async findById(companyId: string): Promise<any> {
    const [row] = await this._q(
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
    if (!row) throw new NotFoundException('Company not found');
    return row;
  }

  async findAll(limit = 50, offset = 0): Promise<any[]> {
    return this._q(
      `SELECT company_id as "companyId", organization_id as "organizationId",
        legal_name as "legalName", dba_name as "dbaName",
        license_number as "licenseNumber", license_state as "licenseState",
        contact_email as "contactEmail", city, state,
        created_at as "createdAt"
      FROM companies WHERE deleted_at IS NULL ORDER BY legal_name LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
  }

  async findByOrganization(organizationId: string): Promise<any[]> {
    return this._q(
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

  async create(input: {
    organizationId: string; legalName: string; dbaName?: string; ein?: string;
    stateOfIncorporation?: string; licenseNumber?: string; licenseType?: string;
    licenseState?: string; licenseExpiryDate?: string;
    contactEmail?: string; contactPhone?: string;
    addressLine1?: string; city?: string; state?: string; zip?: string;
  }): Promise<any> {
    const [row] = await this._q(
      `INSERT INTO companies (organization_id, legal_name, dba_name, ein,
        state_of_incorporation, license_number, license_type, license_state, license_expiry_date,
        contact_email, contact_phone, address_line1, city, state, zip)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [input.organizationId, input.legalName, input.dbaName || null, input.ein || null,
        input.stateOfIncorporation || null, input.licenseNumber || null, input.licenseType || null,
        input.licenseState || null, input.licenseExpiryDate || null,
        input.contactEmail || null, input.contactPhone || null,
        input.addressLine1 || null, input.city || null, input.state || null, input.zip || null],
    );
    this.logger.log('Company created: ' + row.legal_name + ' (' + row.company_id + ')');
    return this.findById(row.company_id);
  }

  // ═══ UPDATE ═══

  async update(companyId: string, input: {
    legalName?: string; dbaName?: string; ein?: string;
    stateOfIncorporation?: string; licenseNumber?: string; licenseType?: string;
    licenseState?: string; licenseExpiryDate?: string;
    contactEmail?: string; contactPhone?: string;
    addressLine1?: string; city?: string; state?: string; zip?: string;
    metrcFacilityLicense?: string;
  }): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const map: Record<string, string> = {
      legalName: 'legal_name', dbaName: 'dba_name', ein: 'ein',
      stateOfIncorporation: 'state_of_incorporation',
      licenseNumber: 'license_number', licenseType: 'license_type',
      licenseState: 'license_state', licenseExpiryDate: 'license_expiry_date',
      contactEmail: 'contact_email', contactPhone: 'contact_phone',
      addressLine1: 'address_line1', city: 'city', state: 'state', zip: 'zip',
      metrcFacilityLicense: 'metrc_facility_license',
    };

    for (const [key, col] of Object.entries(map)) {
      if ((input as any)[key] !== undefined) {
        fields.push(col + ' = $' + idx);
        values.push((input as any)[key]);
        idx++;
      }
    }

    if (fields.length === 0) return this.findById(companyId);

    values.push(companyId);
    await this._q(
      'UPDATE companies SET ' + fields.join(', ') + ', updated_at = NOW() WHERE company_id = $' + idx + ' AND deleted_at IS NULL',
      values,
    );

    this.logger.log('Company updated: ' + companyId);
    return this.findById(companyId);
  }

  // ═══ DELETE ═══

  async softDelete(companyId: string): Promise<boolean> {
    const result = await this._q(
      'UPDATE companies SET deleted_at = NOW() WHERE company_id = $1 AND deleted_at IS NULL',
      [companyId],
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
