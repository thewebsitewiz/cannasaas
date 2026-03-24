import { Inject, Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

const CONDITION_EFFECT_MAP: Record<string, string[]> = {
  anxiety: ['relaxing', 'calming', 'stress-relief'],
  insomnia: ['sleepy', 'relaxing', 'sedating'],
  pain: ['pain-relief', 'anti-inflammatory', 'analgesic'],
  appetite: ['hungry', 'appetite-stimulating'],
  depression: ['uplifting', 'euphoric', 'energizing'],
  nausea: ['anti-nausea', 'calming', 'relaxing'],
  inflammation: ['anti-inflammatory', 'pain-relief'],
  fatigue: ['energizing', 'uplifting', 'focused'],
  muscle_spasms: ['relaxing', 'pain-relief', 'anti-inflammatory'],
  headache: ['pain-relief', 'relaxing', 'calming'],
};

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(@Inject(DRIZZLE) private db: any) {}

  async searchByEffect(effect: string, dispensaryId: string): Promise<any[]> {
    const rows = await this._q(
      `SELECT p.id as "productId", p.name as "productName", p.strain_type as "strainType",
        p.effects, p.terpenes, p.thc_content as "thcContent", p.cbd_content as "cbdContent",
        p.description
       FROM products p
       WHERE p.dispensary_id = $1 AND p.is_active = true
         AND p.effects @> $2::jsonb
       ORDER BY p.name ASC`,
      [dispensaryId, JSON.stringify([effect])],
    );

    return rows.map((r: any) => ({
      productId: r.productId,
      productName: r.productName,
      strainType: r.strainType,
      effects: r.effects,
      terpenes: r.terpenes,
      thcContent: r.thcContent ? parseFloat(r.thcContent) : null,
      cbdContent: r.cbdContent ? parseFloat(r.cbdContent) : null,
      description: r.description,
    }));
  }

  async searchByCondition(condition: string, dispensaryId: string): Promise<any[]> {
    const effects = CONDITION_EFFECT_MAP[condition.toLowerCase()] || [condition.toLowerCase()];

    // Build a query that matches any of the mapped effects
    const placeholders = effects.map((_, i) => `p.effects @> $${i + 2}::jsonb`).join(' OR ');
    const params: any[] = [dispensaryId, ...effects.map(e => JSON.stringify([e]))];

    const rows = await this._q(
      `SELECT p.id as "productId", p.name as "productName", p.strain_type as "strainType",
        p.effects, p.terpenes, p.thc_content as "thcContent", p.cbd_content as "cbdContent",
        p.description
       FROM products p
       WHERE p.dispensary_id = $1 AND p.is_active = true
         AND (${placeholders})
       ORDER BY p.name ASC`,
      params,
    );

    return rows.map((r: any) => ({
      productId: r.productId,
      productName: r.productName,
      strainType: r.strainType,
      effects: r.effects,
      terpenes: r.terpenes,
      thcContent: r.thcContent ? parseFloat(r.thcContent) : null,
      cbdContent: r.cbdContent ? parseFloat(r.cbdContent) : null,
      description: r.description,
      matchedCondition: condition,
      matchedEffects: effects,
    }));
  }

  async getProductComparison(productIds: string[]): Promise<any[]> {
    if (productIds.length === 0) return [];

    const placeholders = productIds.map((_, i) => `$${i + 1}`).join(',');

    const rows = await this._q(
      `SELECT p.id as "productId", p.name as "productName", p.strain_type as "strainType",
        p.effects, p.terpenes, p.thc_content as "thcContent", p.cbd_content as "cbdContent",
        p.description,
        lpt.name as "categoryName"
       FROM products p
       LEFT JOIN lkp_product_types lpt ON lpt.product_type_id = p.product_type_id
       WHERE p.id IN (${placeholders})
       ORDER BY p.name ASC`,
      productIds,
    );

    return rows.map((r: any) => ({
      productId: r.productId,
      productName: r.productName,
      strainType: r.strainType,
      categoryName: r.categoryName,
      effects: r.effects,
      terpenes: r.terpenes,
      thcContent: r.thcContent ? parseFloat(r.thcContent) : null,
      cbdContent: r.cbdContent ? parseFloat(r.cbdContent) : null,
      description: r.description,
    }));
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
