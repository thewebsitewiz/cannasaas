import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

const CSV_HEADERS = ['name', 'sku', 'strain_type', 'thc_percent', 'cbd_percent', 'category', 'price', 'description'];

@Injectable()
export class ProductImportService {
  private readonly logger = new Logger(ProductImportService.name);
  constructor(@InjectDataSource() private ds: DataSource) {}

  getImportTemplate(): string {
    return CSV_HEADERS.join(',') + '\n';
  }

  async exportProducts(dispensaryId: string): Promise<string> {
    const rows = await this.ds.query(
      `SELECT p.name, pv.sku, p.strain_type, p.thc_percent, p.cbd_percent,
              lc.name as category, pp.price, p.description
       FROM products p
       LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = true
       LEFT JOIN lkp_product_categories lc ON lc.category_id = p.primary_category_id
       LEFT JOIN product_pricing pp ON pp.variant_id = pv.variant_id AND pp.price_type = 'retail'
         AND pp.effective_from <= NOW() AND (pp.effective_until IS NULL OR pp.effective_until > NOW())
       WHERE p.dispensary_id = $1 AND p.is_active = true
       ORDER BY p.name`,
      [dispensaryId],
    );

    let csv = CSV_HEADERS.join(',') + '\n';
    for (const row of rows) {
      csv += CSV_HEADERS.map(h => this.escapeCsvField(row[h])).join(',') + '\n';
    }
    return csv;
  }

  async importProducts(dispensaryId: string, csvContent: string): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const lines = csvContent.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return { imported: 0, skipped: 0, errors: ['CSV must have a header row and at least one data row'] };

    const headers = this.parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
    const nameIdx = headers.indexOf('name');
    if (nameIdx < 0) return { imported: 0, skipped: 0, errors: ['Missing required "name" column'] };

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const fields = this.parseCsvLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = fields[idx]?.trim() ?? ''; });

      if (!row.name) {
        errors.push(`Row ${i + 1}: Missing product name — skipped`);
        skipped++;
        continue;
      }

      try {
        const thc = row.thc_percent ? parseFloat(row.thc_percent) : null;
        const cbd = row.cbd_percent ? parseFloat(row.cbd_percent) : null;
        const price = row.price ? parseFloat(row.price) : null;

        if (thc !== null && isNaN(thc)) { errors.push(`Row ${i + 1}: Invalid THC percent`); skipped++; continue; }
        if (cbd !== null && isNaN(cbd)) { errors.push(`Row ${i + 1}: Invalid CBD percent`); skipped++; continue; }
        if (price !== null && isNaN(price)) { errors.push(`Row ${i + 1}: Invalid price`); skipped++; continue; }

        // Upsert product by name + dispensary
        const [product] = await this.ds.query(
          `INSERT INTO products (dispensary_id, name, strain_type, thc_percent, cbd_percent, description, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, true)
           ON CONFLICT (dispensary_id, name) DO UPDATE SET
             strain_type = COALESCE(EXCLUDED.strain_type, products.strain_type),
             thc_percent = COALESCE(EXCLUDED.thc_percent, products.thc_percent),
             cbd_percent = COALESCE(EXCLUDED.cbd_percent, products.cbd_percent),
             description = COALESCE(EXCLUDED.description, products.description),
             updated_at = NOW()
           RETURNING id`,
          [dispensaryId, row.name, row.strain_type || null, thc, cbd, row.description || null],
        );

        // Upsert variant with SKU if provided
        if (row.sku) {
          const [variant] = await this.ds.query(
            `INSERT INTO product_variants (product_id, dispensary_id, sku, is_active, sort_order)
             VALUES ($1, $2, $3, true, 0)
             ON CONFLICT (dispensary_id, sku) DO UPDATE SET product_id = $1
             RETURNING variant_id`,
            [product.id, dispensaryId, row.sku],
          );

          // Set price if provided
          if (price !== null && variant) {
            await this.ds.query(
              `INSERT INTO product_pricing (variant_id, price_type, price, effective_from)
               VALUES ($1, 'retail', $2, NOW())
               ON CONFLICT DO NOTHING`,
              [variant.variant_id, price],
            );
          }
        }

        imported++;
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message}`);
        skipped++;
      }
    }

    this.logger.log(`Import complete for dispensary ${dispensaryId}: ${imported} imported, ${skipped} skipped`);
    return { imported, skipped, errors };
  }

  private escapeCsvField(value: any): string {
    if (value == null) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  private parseCsvLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
        else if (ch === '"') { inQuotes = false; }
        else { current += ch; }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ',') { fields.push(current); current = ''; }
        else { current += ch; }
      }
    }
    fields.push(current);
    return fields;
  }
}
