import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ProductSearchInput } from './dto/product-search.input';

@Injectable()
export class ProductSearchService {
  private readonly logger = new Logger(ProductSearchService.name);

  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async search(input: ProductSearchInput): Promise<any> {
    const limit = input.limit ?? 20;
    const offset = input.offset ?? 0;
    const params: any[] = [input.dispensaryId];
    let paramIndex = 2;

    // ── Build WHERE clauses ──────────────────────────────────────────────
    const conditions: string[] = ['p.dispensary_id = $1', 'p.is_active = true'];

    if (input.search) {
      conditions.push(`p.search_vector @@ plainto_tsquery('english', $${paramIndex})`);
      params.push(input.search);
      paramIndex++;
    }

    if (input.productTypeId) {
      conditions.push(`p.product_type_id = $${paramIndex}`);
      params.push(input.productTypeId);
      paramIndex++;
    }

    if (input.categoryId) {
      conditions.push(`p.primary_category_id = $${paramIndex}`);
      params.push(input.categoryId);
      paramIndex++;
    }

    if (input.strainType) {
      conditions.push(`p.strain_type = $${paramIndex}`);
      params.push(input.strainType);
      paramIndex++;
    }

    if (input.effects?.length) {
      conditions.push(`p.effects ?| $${paramIndex}`);
      params.push(input.effects);
      paramIndex++;
    }

    if (input.flavors?.length) {
      conditions.push(`p.flavors ?| $${paramIndex}`);
      params.push(input.flavors);
      paramIndex++;
    }

    if (input.minThc !== undefined) {
      conditions.push(`p.thc_percent >= $${paramIndex}`);
      params.push(input.minThc);
      paramIndex++;
    }

    if (input.maxThc !== undefined) {
      conditions.push(`p.thc_percent <= $${paramIndex}`);
      params.push(input.maxThc);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // ── Price filter (requires join) ─────────────────────────────────────
    let priceJoin = '';
    let priceConditions = '';
    if (input.minPrice !== undefined || input.maxPrice !== undefined) {
      priceJoin = `
        JOIN product_variants pv_price ON pv_price.product_id = p.id AND pv_price.is_active = true
        JOIN product_pricing pp_price ON pp_price.variant_id = pv_price.variant_id
          AND pp_price.price_type = 'retail'
          AND pp_price.effective_from <= NOW()
          AND (pp_price.effective_until IS NULL OR pp_price.effective_until > NOW())`;

      if (input.minPrice !== undefined) {
        priceConditions += ` AND pp_price.price >= $${paramIndex}`;
        params.push(input.minPrice);
        paramIndex++;
      }
      if (input.maxPrice !== undefined) {
        priceConditions += ` AND pp_price.price <= $${paramIndex}`;
        params.push(input.maxPrice);
        paramIndex++;
      }
    }

    // ── Sort ─────────────────────────────────────────────────────────────
    let orderBy: string;
    switch (input.sortBy) {
      case 'relevance':
        orderBy = input.search
          ? `ts_rank(p.search_vector, plainto_tsquery('english', $2)) DESC`
          : 'p.name ASC';
        break;
      case 'price_asc':
        orderBy = 'min_price ASC NULLS LAST';
        break;
      case 'price_desc':
        orderBy = 'min_price DESC NULLS LAST';
        break;
      case 'thc_desc':
        orderBy = 'p.thc_percent DESC NULLS LAST';
        break;
      case 'newest':
        orderBy = 'p.created_at DESC';
        break;
      default:
        orderBy = input.search
          ? `ts_rank(p.search_vector, plainto_tsquery('english', $2)) DESC`
          : 'p.name ASC';
    }

    // ── Count query ──────────────────────────────────────────────────────
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      ${priceJoin}
      WHERE ${whereClause} ${priceConditions}`;

    const [{ total }] = await this.dataSource.query(countQuery, params);

    // ── Main query ───────────────────────────────────────────────────────
    const needsPriceSort = input.sortBy === 'price_asc' || input.sortBy === 'price_desc';
    const priceSelect = needsPriceSort || priceJoin
      ? `, MIN(pp_main.price) as min_price`
      : '';
    const priceMainJoin = needsPriceSort
      ? `LEFT JOIN product_variants pv_main ON pv_main.product_id = p.id AND pv_main.is_active = true
         LEFT JOIN product_pricing pp_main ON pp_main.variant_id = pv_main.variant_id
           AND pp_main.price_type = 'retail'
           AND pp_main.effective_from <= NOW()
           AND (pp_main.effective_until IS NULL OR pp_main.effective_until > NOW())`
      : '';

    params.push(limit, offset);
    const mainQuery = `
      SELECT p.*${priceSelect}
      FROM products p
      ${priceJoin}
      ${priceMainJoin}
      WHERE ${whereClause} ${priceConditions}
      GROUP BY p.id
      ORDER BY ${orderBy}
      LIMIT $${paramIndex++} OFFSET $${paramIndex}`;

    const products = await this.dataSource.query(mainQuery, params);

    // ── Facets ───────────────────────────────────────────────────────────
    const facets = await this.buildFacets(input.dispensaryId);

    return {
      products,
      total: parseInt(total, 10),
      limit,
      offset,
      facets,
    };
  }

  // ── Autocomplete ─────────────────────────────────────────────────────────

  async autocomplete(dispensaryId: string, query: string, limit = 8): Promise<any[]> {
    const results = await this.dataSource.query(
      `SELECT id, name, strain_type,
        similarity(name, $2) as sim,
        ts_rank(search_vector, plainto_tsquery('english', $2)) as rank
       FROM products
       WHERE dispensary_id = $1 AND is_active = true
         AND (
           name % $2
           OR search_vector @@ plainto_tsquery('english', $2)
           OR name ILIKE $3
         )
       ORDER BY sim DESC, rank DESC
       LIMIT $4`,
      [dispensaryId, query, `%${query}%`, limit],
    );

    return results.map((r: any) => ({
      id: r.id,
      name: r.name,
      strainType: r.strain_type,
      similarity: parseFloat(r.sim),
    }));
  }

  // ── Facet Builder ──────────────────────────────────────────────────────

  private async buildFacets(dispensaryId: string): Promise<any> {
    const [strainTypes, productTypes, effectsList, flavorsList, priceRange, thcRange] = await Promise.all([
      this.dataSource.query(
        `SELECT strain_type as value, COUNT(*) as count FROM products
         WHERE dispensary_id = $1 AND is_active = true AND strain_type IS NOT NULL
         GROUP BY strain_type ORDER BY count DESC`,
        [dispensaryId],
      ),
      this.dataSource.query(
        `SELECT lpt.code as value, lpt.name as label, COUNT(p.id) as count
         FROM products p
         JOIN lkp_product_types lpt ON lpt.product_type_id = p.product_type_id
         WHERE p.dispensary_id = $1 AND p.is_active = true
         GROUP BY lpt.code, lpt.name ORDER BY count DESC`,
        [dispensaryId],
      ),
      this.dataSource.query(
        `SELECT e as value, COUNT(*) as count
         FROM products, jsonb_array_elements_text(effects) as e
         WHERE dispensary_id = $1 AND is_active = true
         GROUP BY e ORDER BY count DESC LIMIT 20`,
        [dispensaryId],
      ),
      this.dataSource.query(
        `SELECT f as value, COUNT(*) as count
         FROM products, jsonb_array_elements_text(flavors) as f
         WHERE dispensary_id = $1 AND is_active = true
         GROUP BY f ORDER BY count DESC LIMIT 20`,
        [dispensaryId],
      ),
      this.dataSource.query(
        `SELECT COALESCE(MIN(pp.price), 0) as min, COALESCE(MAX(pp.price), 0) as max
         FROM product_pricing pp
         JOIN product_variants pv ON pv.variant_id = pp.variant_id
         JOIN products p ON p.id = pv.product_id
         WHERE p.dispensary_id = $1 AND p.is_active = true AND pp.price_type = 'retail'
           AND pp.effective_from <= NOW() AND (pp.effective_until IS NULL OR pp.effective_until > NOW())`,
        [dispensaryId],
      ),
      this.dataSource.query(
        `SELECT COALESCE(MIN(thc_percent), 0) as min, COALESCE(MAX(thc_percent), 0) as max
         FROM products WHERE dispensary_id = $1 AND is_active = true AND thc_percent IS NOT NULL`,
        [dispensaryId],
      ),
    ]);

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
