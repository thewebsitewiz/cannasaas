import { Inject, Injectable, Logger } from '@nestjs/common';
import { OtreebaService } from './otreeba.service';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

export interface EnrichmentResult {
  productId: string;
  strainMatched: boolean;
  strainName?: string;
  fieldsUpdated: string[];
}

@Injectable()
export class ProductEnrichmentService {
  private readonly logger = new Logger(ProductEnrichmentService.name);

  constructor(
    private readonly otreeba: OtreebaService,
    @Inject(DRIZZLE) private db: any
  ) {}

  // ── Enrich Single Product ─────────────────────────────────────────────────

  async enrichProduct(productId: string, dispensaryId: string): Promise<EnrichmentResult> {
    const qr = this.db.createQueryRunner();
    await qr.connect();

    try {
      const [product] = await qr.query(
        `SELECT id, name, strain_name, strain_id, otreeba_ocpc FROM products WHERE id = $1 AND dispensary_id = $2`,
        [productId, dispensaryId],
      );
      if (!product) return { productId, strainMatched: false, fieldsUpdated: [] };

      // Try by OCPC first, then by name
      let strains = product.otreeba_ocpc
        ? [await this.otreeba.getStrainByOcpc(product.otreeba_ocpc)].filter(Boolean)
        : [];

      if (strains.length === 0) {
        const searchName = product.strain_name || this.extractStrainName(product.name);
        if (searchName) {
          strains = await this.otreeba.searchStrains(searchName);
        }
      }

      if (strains.length === 0) {
        return { productId, strainMatched: false, fieldsUpdated: [] };
      }

      const strain = strains[0]!;
      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      // Build dynamic UPDATE
      const addField = (col: string, value: any, label: string) => {
        if (value !== null && value !== undefined) {
          updates.push(`${col} = $${paramIndex++}`);
          params.push(typeof value === 'object' ? JSON.stringify(value) : value);
          fieldsUpdated.push(label);
        }
      };

      const fieldsUpdated: string[] = [];
      addField('strain_id', strain.strainDataId, 'strainId');
      addField('strain_name', strain.name, 'strainName');
      addField('strain_type', strain.type, 'strainType');
      addField('otreeba_ocpc', strain.ocpc, 'ocpc');

      if (strain.effects && (Array.isArray(strain.effects) ? strain.effects.length > 0 : Object.keys(strain.effects).length > 0)) {
        addField('effects', strain.effects, 'effects');
      }
      if (strain.flavors && (Array.isArray(strain.flavors) ? strain.flavors.length > 0 : Object.keys(strain.flavors).length > 0)) {
        addField('flavors', strain.flavors, 'flavors');
      }
      if (strain.terpenes && (Array.isArray(strain.terpenes) ? strain.terpenes.length > 0 : Object.keys(strain.terpenes).length > 0)) {
        addField('terpenes', strain.terpenes, 'terpenes');
      }
      if (strain.lineage && Object.keys(strain.lineage).length > 0) {
        addField('lineage', strain.lineage, 'lineage');
      }

      updates.push(`enriched_at = NOW()`);
      updates.push(`updated_at = NOW()`);

      if (updates.length > 2) {
        params.push(productId, dispensaryId);
        await qr.query(
          `UPDATE products SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND dispensary_id = $${paramIndex}`,
          params,
        );
        this.logger.log(`Enriched product ${productId}: ${fieldsUpdated.join(', ')}`);
      }

      return { productId, strainMatched: true, strainName: strain.name, fieldsUpdated };
    } finally {
      await qr.release();
    }
  }

  // ── Bulk Enrich All Products for Dispensary ───────────────────────────────

  async enrichDispensary(dispensaryId: string): Promise<{ total: number; enriched: number; failed: number }> {
    const products = await this._q(
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
      } catch (err: any) {
        this.logger.error(`Enrichment failed for ${p.id}: ${err.message}`);
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
      .replace(/\b(pre-?roll|vape|cartridge|cart|gummies|gummy|edible|tincture|topical|flower|concentrate|wax|shatter|rosin|live resin)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned.length > 2 ? cleaned : null;
  }

  /** Raw SQL helper – bridges TypeORM .query() to Drizzle */
  private async _q(text: string, params?: any[]): Promise<any[]> {
    const client = (this.db as any).session?.client ?? (this.db as any).$client ?? (this.db as any);
    if (client?.query) {
      const r = await client.query(text, params);
      return r.rows ?? r;
    }
    const result = await this.db.execute(sql.raw(text));
    return Array.isArray(result) ? result : (result as any).rows ?? [];
  }

}
