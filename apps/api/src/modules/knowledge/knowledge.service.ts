import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

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

interface KnowledgeProductRow {
  productId: string;
  productName: string;
  strainType: string | null;
  effects: unknown;
  terpenes: unknown;
  thcContent: string | number | null;
  cbdContent: string | number | null;
  description: string | null;
  categoryName?: string | null;
}

export interface KnowledgeProductDto {
  productId: string;
  productName: string;
  strainType?: string;
  categoryName?: string;
  effects?: string[];
  terpenes?: string[];
  thcContent?: number;
  cbdContent?: number;
  description?: string;
  matchedCondition?: string;
  matchedEffects?: string[];
}

async function rawQuery<T>(
  ds: DataSource,
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const rows = (await ds.query(sql, params)) as unknown;
  return rows as T[];
}

function toNumber(val: string | number | null | undefined): number | undefined {
  if (val == null) return undefined;
  const n = typeof val === 'number' ? val : parseFloat(val);
  return Number.isFinite(n) ? n : undefined;
}

function toStringArray(val: unknown): string[] | undefined {
  if (!Array.isArray(val)) return undefined;
  return val.map((v) => String(v));
}

function mapProduct(r: KnowledgeProductRow): KnowledgeProductDto {
  return {
    productId: r.productId,
    productName: r.productName,
    strainType: r.strainType ?? undefined,
    categoryName: r.categoryName ?? undefined,
    effects: toStringArray(r.effects),
    terpenes: toStringArray(r.terpenes),
    thcContent: toNumber(r.thcContent),
    cbdContent: toNumber(r.cbdContent),
    description: r.description ?? undefined,
  };
}

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(@InjectDataSource() private ds: DataSource) {}

  async searchByEffect(
    effect: string,
    dispensaryId: string,
  ): Promise<KnowledgeProductDto[]> {
    const rows = await rawQuery<KnowledgeProductRow>(
      this.ds,
      `SELECT p.id as "productId", p.name as "productName", p.strain_type as "strainType",
        p.effects, p.terpenes, p.thc_content as "thcContent", p.cbd_content as "cbdContent",
        p.description
       FROM products p
       WHERE p.dispensary_id = $1 AND p.is_active = true
         AND p.effects @> $2::jsonb
       ORDER BY p.name ASC`,
      [dispensaryId, JSON.stringify([effect])],
    );

    return rows.map(mapProduct);
  }

  async searchByCondition(
    condition: string,
    dispensaryId: string,
  ): Promise<KnowledgeProductDto[]> {
    const effects = CONDITION_EFFECT_MAP[condition.toLowerCase()] ?? [
      condition.toLowerCase(),
    ];

    const placeholders = effects
      .map((_, i) => `p.effects @> $${String(i + 2)}::jsonb`)
      .join(' OR ');
    const params: unknown[] = [
      dispensaryId,
      ...effects.map((e) => JSON.stringify([e])),
    ];

    const rows = await rawQuery<KnowledgeProductRow>(
      this.ds,
      `SELECT p.id as "productId", p.name as "productName", p.strain_type as "strainType",
        p.effects, p.terpenes, p.thc_content as "thcContent", p.cbd_content as "cbdContent",
        p.description
       FROM products p
       WHERE p.dispensary_id = $1 AND p.is_active = true
         AND (${placeholders})
       ORDER BY p.name ASC`,
      params,
    );

    return rows.map((r) => ({
      ...mapProduct(r),
      matchedCondition: condition,
      matchedEffects: effects,
    }));
  }

  async getProductComparison(
    productIds: string[],
  ): Promise<KnowledgeProductDto[]> {
    if (productIds.length === 0) return [];

    const placeholders = productIds
      .map((_, i) => `$${String(i + 1)}`)
      .join(',');

    const rows = await rawQuery<KnowledgeProductRow>(
      this.ds,
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

    return rows.map(mapProduct);
  }
}
