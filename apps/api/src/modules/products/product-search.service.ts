import { Injectable, Inject, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql, SQL } from 'drizzle-orm';
import * as schema from '../../database/schema';
import { ProductSearchInput } from './dto/product-search.input';

export const DRIZZLE = Symbol.for('DRIZZLE');
type DB = NodePgDatabase<typeof schema>;

@Injectable()
export class ProductSearchService {
  private readonly logger = new Logger(ProductSearchService.name);

  constructor(@Inject(DRIZZLE) private db: DB) {}

  async search(input: ProductSearchInput): Promise<any> {
    const limitVal = input.limit ?? 20;
    const offsetVal = input.offset ?? 0;

    // ── Build WHERE conditions as SQL fragments ───────────────────────────
    const conditions: SQL[] = [
      sql`p.dispensary_id = ${input.dispensaryId}`,
      sql`p.is_active = true`,
    ];

    if (input.search) {
      conditions.push(sql`p.search_vector @@ plainto_tsquery('english', ${input.search})`);
    }

    if (input.productTypeId) {
      conditions.push(sql`p.product_type_id = ${input.productTypeId}`);
    }

    if (input.categoryId) {
      conditions.push(sql`p.primary_category_id = ${input.categoryId}`);
    }

    if (input.strainType) {
      conditions.push(sql`p.strain_type = ${input.strainType}`);
    }

    if (input.effects?.length) {
      conditions.push(sql`p.effects ?| ${input.effects}`);
    }

    if (input.flavors?.length) {
      conditions.push(sql`p.flavors ?| ${input.flavors}`);
    }

    if (input.minThc !== undefined) {
      conditions.push(sql`p.thc_percent >= ${input.minThc}`);
    }

    if (input.maxThc !== undefined) {
      conditions.push(sql`p.thc_percent <= ${input.maxThc}`);
    }

    const whereClause = sql.join(conditions, sql` AND `);

    // ── Price filter (requires join) ─────────────────────────────────────
    let priceJoinSql = sql.raw('');
    const priceConditions: SQL[] = [];

    if (input.minPrice !== undefined || input.maxPrice !== undefined) {
      priceJoinSql = sql.raw(`
        JOIN product_variants pv_price ON pv_price.product_id = p.id AND pv_price.is_active = true
        JOIN product_pricing pp_price ON pp_price.variant_id = pv_price.variant_id
          AND pp_price.price_type = 'retail'
          AND pp_price.effective_from <= NOW()
          AND (pp_price.effective_until IS NULL OR pp_price.effective_until > NOW())`);

      if (input.minPrice !== undefined) {
        priceConditions.push(sql`pp_price.price >= ${input.minPrice}`);
      }
      if (input.maxPrice !== undefined) {
        priceConditions.push(sql`pp_price.price <= ${input.maxPrice}`);
      }
    }

    const priceConditionSql = priceConditions.length > 0
      ? sql` AND ${sql.join(priceConditions, sql` AND `)}`
      : sql.raw('');

    // ── Sort ─────────────────────────────────────────────────────────────
    let orderBySql: SQL;
    switch (input.sortBy) {
      case 'relevance':
        orderBySql = input.search
          ? sql`ts_rank(p.search_vector, plainto_tsquery('english', ${input.search})) DESC`
          : sql.raw('p.name ASC');
        break;
      case 'price_asc':
        orderBySql = sql.raw('min_price ASC NULLS LAST');
        break;
      case 'price_desc':
        orderBySql = sql.raw('min_price DESC NULLS LAST');
        break;
      case 'thc_desc':
        orderBySql = sql.raw('p.thc_percent DESC NULLS LAST');
        break;
      case 'newest':
        orderBySql = sql.raw('p.created_at DESC');
        break;
      default:
        orderBySql = input.search
          ? sql`ts_rank(p.search_vector, plainto_tsquery('english', ${input.search})) DESC`
          : sql.raw('p.name ASC');
    }

    // ── Count query ──────────────────────────────────────────────────────
    const countResult = await this.db.execute(sql`
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      ${priceJoinSql}
      WHERE ${whereClause} ${priceConditionSql}
    `);
    const total = parseInt((countResult.rows[0] as any)?.total ?? '0', 10);

    // ── Main query ───────────────────────────────────────────────────────
    const needsPriceSort = input.sortBy === 'price_asc' || input.sortBy === 'price_desc';
    const priceSelectSql = (needsPriceSort || priceConditions.length > 0)
      ? sql.raw(`, MIN(pp_main.price) as min_price`)
      : sql.raw('');
    const priceMainJoinSql = needsPriceSort
      ? sql.raw(`LEFT JOIN product_variants pv_main ON pv_main.product_id = p.id AND pv_main.is_active = true
         LEFT JOIN product_pricing pp_main ON pp_main.variant_id = pv_main.variant_id
           AND pp_main.price_type = 'retail'
           AND pp_main.effective_from <= NOW()
           AND (pp_main.effective_until IS NULL OR pp_main.effective_until > NOW())`)
      : sql.raw('');

    const mainResult = await this.db.execute(sql`
      SELECT p.*${priceSelectSql}
      FROM products p
      ${priceJoinSql}
      ${priceMainJoinSql}
      WHERE ${whereClause} ${priceConditionSql}
      GROUP BY p.id
      ORDER BY ${orderBySql}
      LIMIT ${limitVal} OFFSET ${offsetVal}
    `);
    const products = mainResult.rows;

    // ── Facets ───────────────────────────────────────────────────────────
    const facets = await this.buildFacets(input.dispensaryId);

    return {
      products,
      total,
      limit: limitVal,
      offset: offsetVal,
      facets,
    };
  }

  // ── Autocomplete ─────────────────────────────────────────────────────────

  async autocomplete(dispensaryId: string, query: string, limit = 8): Promise<any[]> {
    const result = await this.db.execute(sql`
      SELECT id, name, strain_type,
        similarity(name, ${query}) as sim,
        ts_rank(search_vector, plainto_tsquery('english', ${query})) as rank
      FROM products
      WHERE dispensary_id = ${dispensaryId} AND is_active = true
        AND (
          name % ${query}
          OR search_vector @@ plainto_tsquery('english', ${query})
          OR name ILIKE ${'%' + query + '%'}
        )
      ORDER BY sim DESC, rank DESC
      LIMIT ${limit}
    `);

    return (result.rows as any[]).map((r: any) => ({
      id: r.id,
      name: r.name,
      strainType: r.strain_type,
      similarity: parseFloat(r.sim),
    }));
  }

  // ── Facet Builder ──────────────────────────────────────────────────────

  private async buildFacets(dispensaryId: string): Promise<any> {
    const [strainTypesRes, productTypesRes, effectsRes, flavorsRes, priceRangeRes, thcRangeRes] = await Promise.all([
      this.db.execute(sql`
        SELECT strain_type as value, COUNT(*) as count FROM products
        WHERE dispensary_id = ${dispensaryId} AND is_active = true AND strain_type IS NOT NULL
        GROUP BY strain_type ORDER BY count DESC
      `),
      this.db.execute(sql`
        SELECT lpt.code as value, lpt.name as label, COUNT(p.id) as count
        FROM products p
        JOIN lkp_product_types lpt ON lpt.product_type_id = p.product_type_id
        WHERE p.dispensary_id = ${dispensaryId} AND p.is_active = true
        GROUP BY lpt.code, lpt.name ORDER BY count DESC
      `),
      this.db.execute(sql`
        SELECT e as value, COUNT(*) as count
        FROM products, jsonb_array_elements_text(effects) as e
        WHERE dispensary_id = ${dispensaryId} AND is_active = true
        GROUP BY e ORDER BY count DESC LIMIT 20
      `),
      this.db.execute(sql`
        SELECT f as value, COUNT(*) as count
        FROM products, jsonb_array_elements_text(flavors) as f
        WHERE dispensary_id = ${dispensaryId} AND is_active = true
        GROUP BY f ORDER BY count DESC LIMIT 20
      `),
      this.db.execute(sql`
        SELECT COALESCE(MIN(pp.price), 0) as min, COALESCE(MAX(pp.price), 0) as max
        FROM product_pricing pp
        JOIN product_variants pv ON pv.variant_id = pp.variant_id
        JOIN products p ON p.id = pv.product_id
        WHERE p.dispensary_id = ${dispensaryId} AND p.is_active = true AND pp.price_type = 'retail'
          AND pp.effective_from <= NOW() AND (pp.effective_until IS NULL OR pp.effective_until > NOW())
      `),
      this.db.execute(sql`
        SELECT COALESCE(MIN(thc_percent), 0) as min, COALESCE(MAX(thc_percent), 0) as max
        FROM products WHERE dispensary_id = ${dispensaryId} AND is_active = true AND thc_percent IS NOT NULL
      `),
    ]);

    const strainTypes = strainTypesRes.rows as any[];
    const productTypes = productTypesRes.rows as any[];
    const effectsList = effectsRes.rows as any[];
    const flavorsList = flavorsRes.rows as any[];
    const priceRange = priceRangeRes.rows as any[];
    const thcRange = thcRangeRes.rows as any[];

    return {
      strainTypes: strainTypes.map((r: any) => ({ label: r.value, value: r.value, count: parseInt(r.count, 10) })),
      productTypes: productTypes.map((r: any) => ({ label: r.label, value: r.value, count: parseInt(r.count, 10) })),
      effects: effectsList.map((r: any) => ({ label: r.value, value: r.value, count: parseInt(r.count, 10) })),
      flavors: flavorsList.map((r: any) => ({ label: r.value, value: r.value, count: parseInt(r.count, 10) })),
      minPrice: parseFloat(priceRange[0]?.min ?? 0),
      maxPrice: parseFloat(priceRange[0]?.max ?? 0),
      minThc: parseFloat(thcRange[0]?.min ?? 0),
      maxThc: parseFloat(thcRange[0]?.max ?? 0),
    };
  }
}
