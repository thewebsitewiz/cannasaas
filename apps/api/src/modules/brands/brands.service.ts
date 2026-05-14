import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface BrandDto {
  brandId: string;
  organizationId: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

interface CreatedBrandRow {
  brand_id: string;
  name: string;
}

export interface CreateBrandInput {
  organizationId: string;
  name: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
}

export interface UpdateBrandInput {
  name?: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
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
export class BrandsService {
  private readonly logger = new Logger(BrandsService.name);

  constructor(@InjectDataSource() private ds: DataSource) {}

  async findById(brandId: string): Promise<BrandDto> {
    const rows = await rawQuery<BrandDto>(
      this.ds,
      `SELECT brand_id as "brandId", organization_id as "organizationId",
        name, slug, description, logo_url as "logoUrl", website_url as "websiteUrl",
        is_active as "isActive",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM brands WHERE brand_id = $1 AND deleted_at IS NULL`,
      [brandId],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException('Brand not found');
    return row;
  }

  async findAll(limit = 50, offset = 0): Promise<BrandDto[]> {
    return rawQuery<BrandDto>(
      this.ds,
      `SELECT brand_id as "brandId", organization_id as "organizationId",
        name, slug, logo_url as "logoUrl", is_active as "isActive",
        created_at as "createdAt"
      FROM brands WHERE deleted_at IS NULL ORDER BY name LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
  }

  async findByOrganization(organizationId: string): Promise<BrandDto[]> {
    return rawQuery<BrandDto>(
      this.ds,
      `SELECT brand_id as "brandId", organization_id as "organizationId",
        name, slug, logo_url as "logoUrl", is_active as "isActive",
        created_at as "createdAt"
      FROM brands WHERE organization_id = $1 AND deleted_at IS NULL ORDER BY name`,
      [organizationId],
    );
  }

  async create(input: CreateBrandInput): Promise<BrandDto> {
    const rows = await rawQuery<CreatedBrandRow>(
      this.ds,
      `INSERT INTO brands (organization_id, name, slug, description, logo_url, website_url)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING brand_id, name`,
      [
        input.organizationId,
        input.name,
        input.slug ?? null,
        input.description ?? null,
        input.logoUrl ?? null,
        input.websiteUrl ?? null,
      ],
    );
    const row = rows[0];
    this.logger.log('Brand created: ' + row.name + ' (' + row.brand_id + ')');
    return this.findById(row.brand_id);
  }

  async update(brandId: string, input: UpdateBrandInput): Promise<BrandDto> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const map: Array<[keyof UpdateBrandInput, string]> = [
      ['name', 'name'],
      ['slug', 'slug'],
      ['description', 'description'],
      ['logoUrl', 'logo_url'],
      ['websiteUrl', 'website_url'],
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

    if (fields.length === 0) return this.findById(brandId);

    values.push(brandId);
    await this.ds.query(
      'UPDATE brands SET ' +
        fields.join(', ') +
        ', updated_at = NOW() WHERE brand_id = $' +
        String(idx) +
        ' AND deleted_at IS NULL',
      values,
    );

    this.logger.log('Brand updated: ' + brandId);
    return this.findById(brandId);
  }

  async softDelete(brandId: string): Promise<boolean> {
    const result = (await this.ds.query(
      'UPDATE brands SET deleted_at = NOW() WHERE brand_id = $1 AND deleted_at IS NULL',
      [brandId],
    )) as unknown;
    if (Array.isArray(result) && typeof result[1] === 'number') {
      return result[1] > 0;
    }
    return false;
  }
}
