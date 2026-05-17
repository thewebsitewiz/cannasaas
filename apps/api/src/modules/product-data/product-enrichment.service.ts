import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { OtreebaService } from './otreeba.service';
import { StrainData } from './entities/strain-data.entity';

export interface EnrichmentResult {
  productId: string;
  strainMatched: boolean;
  strainName?: string;
  fieldsUpdated: string[];
}

interface ProductLookupRow {
  id: string;
  name: string;
  strain_name: string | null;
  strain_id: string | null;
  otreeba_ocpc: string | null;
}

interface ProductIdRow {
  id: string;
}

async function runnerQuery<T>(
  qr: QueryRunner,
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const rows = (await qr.query(sql, params)) as unknown;
  return rows as T[];
}

async function rawQuery<T>(
  ds: DataSource,
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const rows = (await ds.query(sql, params)) as unknown;
  return rows as T[];
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function hasContent(val: unknown): boolean {
  if (val == null) return false;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === 'object') return Object.keys(val).length > 0;
  return true;
}

@Injectable()
export class ProductEnrichmentService {
  private readonly logger = new Logger(ProductEnrichmentService.name);

  constructor(
    private readonly otreeba: OtreebaService,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  // ── Enrich Single Product ─────────────────────────────────────────────────

  async enrichProduct(
    productId: string,
    dispensaryId: string,
  ): Promise<EnrichmentResult> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();

    try {
      const productRows = await runnerQuery<ProductLookupRow>(
        qr,
        `SELECT id, name, strain_name, strain_id, otreeba_ocpc FROM products WHERE id = $1 AND dispensary_id = $2`,
        [productId, dispensaryId],
      );
      const product = productRows[0];
      if (!product)
        return { productId, strainMatched: false, fieldsUpdated: [] };

      let strains: StrainData[] = [];
      if (product.otreeba_ocpc) {
        const single = await this.otreeba.getStrainByOcpc(product.otreeba_ocpc);
        if (single) strains.push(single);
      }

      if (strains.length === 0) {
        const searchName =
          product.strain_name ?? this.extractStrainName(product.name);
        if (searchName) {
          strains = await this.otreeba.searchStrains(searchName);
        }
      }

      if (strains.length === 0) {
        return { productId, strainMatched: false, fieldsUpdated: [] };
      }

      const strain = strains[0];
      const updates: string[] = [];
      const params: unknown[] = [];
      const fieldsUpdated: string[] = [];
      let paramIndex = 1;

      const addField = (col: string, value: unknown, label: string): void => {
        if (value !== null && value !== undefined) {
          updates.push(`${col} = $${String(paramIndex++)}`);
          params.push(
            typeof value === 'object' ? JSON.stringify(value) : value,
          );
          fieldsUpdated.push(label);
        }
      };

      addField('strain_id', strain.strainDataId, 'strainId');
      addField('strain_name', strain.name, 'strainName');
      addField('strain_type', strain.type, 'strainType');
      addField('otreeba_ocpc', strain.ocpc, 'ocpc');

      if (hasContent(strain.effects)) {
        addField('effects', strain.effects, 'effects');
      }
      if (hasContent(strain.flavors)) {
        addField('flavors', strain.flavors, 'flavors');
      }
      if (hasContent(strain.terpenes)) {
        addField('terpenes', strain.terpenes, 'terpenes');
      }
      if (hasContent(strain.lineage)) {
        addField('lineage', strain.lineage, 'lineage');
      }

      updates.push(`enriched_at = NOW()`);
      updates.push(`updated_at = NOW()`);

      if (updates.length > 2) {
        params.push(productId, dispensaryId);
        await qr.query(
          `UPDATE products SET ${updates.join(', ')} WHERE id = $${String(paramIndex++)} AND dispensary_id = $${String(paramIndex)}`,
          params,
        );
        this.logger.log(
          `Enriched product ${productId}: ${fieldsUpdated.join(', ')}`,
        );
      }

      return {
        productId,
        strainMatched: true,
        strainName: strain.name,
        fieldsUpdated,
      };
    } finally {
      await qr.release();
    }
  }

  // ── Bulk Enrich All Products for Dispensary ───────────────────────────────

  async enrichDispensary(
    dispensaryId: string,
  ): Promise<{ total: number; enriched: number; failed: number }> {
    const products = await rawQuery<ProductIdRow>(
      this.dataSource,
      `SELECT id FROM products WHERE dispensary_id = $1 AND is_active = true AND enriched_at IS NULL`,
      [dispensaryId],
    );

    let enriched = 0;
    let failed = 0;

    for (const p of products) {
      try {
        const result = await this.enrichProduct(p.id, dispensaryId);
        if (result.strainMatched) enriched++;
        else failed++;
      } catch (err: unknown) {
        this.logger.error(
          `Enrichment failed for ${p.id}: ${errorMessage(err)}`,
        );
        failed++;
      }
    }

    return { total: products.length, enriched, failed };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private extractStrainName(productName: string): string | null {
    // Strip common suffixes: "Blue Dream 3.5g", "OG Kush Pre-Roll", "Mango Gummies 100mg"
    const cleaned = productName
      .replace(/\d+(\.\d+)?\s*(g|mg|oz|ml|pk|pack)\b/gi, '')
      .replace(
        /\b(pre-?roll|vape|cartridge|cart|gummies|gummy|edible|tincture|topical|flower|concentrate|wax|shatter|rosin|live resin)\b/gi,
        '',
      )
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned.length > 2 ? cleaned : null;
  }
}
