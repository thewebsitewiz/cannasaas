import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, asc, desc, ilike, or, sql, count } from 'drizzle-orm';
import * as schema from '../../database/schema';
import { CacheService } from '../../common/services/cache.service';

export const DRIZZLE = Symbol.for('DRIZZLE');
type DB = NodePgDatabase<typeof schema>;

export interface ProductsFilter {
  dispensaryId: string;
  productTypeId?: number;
  categoryId?: number;
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

@Injectable()
export class ProductsService {
  constructor(
    @Inject(DRIZZLE) private db: DB,
    private readonly cache: CacheService,
  ) {}

  async findAll(filter: ProductsFilter): Promise<any[]> {
    if (!filter.search) {
      const cacheKey = `products:${filter.dispensaryId}:${filter.productTypeId ?? ''}:${filter.categoryId ?? ''}:${filter.isActive ?? ''}:${filter.limit ?? 20}:${filter.offset ?? 0}`;
      const cached = await this.cache.get<any[]>(cacheKey);
      if (cached) return cached;

      const results = await this._queryProducts(filter);
      await this.cache.set(cacheKey, results, 60);
      return results;
    }

    return this._queryProducts(filter);
  }

  private async _queryProducts(filter: ProductsFilter): Promise<any[]> {
    const conditions: any[] = [eq(schema.products.dispensaryId, filter.dispensaryId)];

    if (filter.isActive !== undefined) {
      conditions.push(eq(schema.products.isActive, filter.isActive));
    }
    if (filter.productTypeId) {
      conditions.push(eq(schema.products.productTypeId, filter.productTypeId));
    }
    if (filter.categoryId) {
      conditions.push(eq(schema.products.primaryCategoryId, filter.categoryId));
    }

    if (filter.search) {
      conditions.push(
        or(
          ilike(schema.products.name, `%${filter.search}%`),
          ilike(schema.products.description, `%${filter.search}%`),
        ),
      );
    }

    return this.db
      .select()
      .from(schema.products)
      .where(and(...conditions))
      .orderBy(asc(schema.products.name))
      .limit(filter.limit ?? 20)
      .offset(filter.offset ?? 0);
  }

  async findById(id: string, dispensaryId?: string): Promise<any> {
    const conditions: any[] = [eq(schema.products.id, id)];
    if (dispensaryId) {
      conditions.push(eq(schema.products.dispensaryId, dispensaryId));
    }

    const [product] = await this.db
      .select()
      .from(schema.products)
      .where(and(...conditions));
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async findVariants(productId: string, dispensaryId: string): Promise<any[]> {
    return this.db
      .select()
      .from(schema.productVariants)
      .where(
        and(
          eq(schema.productVariants.productId, productId),
          eq(schema.productVariants.dispensaryId, dispensaryId),
          eq(schema.productVariants.isActive, true),
        ),
      )
      .orderBy(asc(schema.productVariants.sortOrder));
  }

  async findCurrentPricing(variantId: string): Promise<any | null> {
    const now = new Date();
    const result = await this.db.execute(sql`
      SELECT * FROM product_pricing
      WHERE variant_id = ${variantId}
        AND price_type = 'retail'
        AND effective_from <= ${now}
        AND (effective_until IS NULL OR effective_until > ${now})
      ORDER BY effective_from DESC
      LIMIT 1
    `);
    return (result.rows[0] as any) ?? null;
  }

  async findProductTypes(): Promise<any[]> {
    return this.db
      .select()
      .from(schema.lkpProductTypes)
      .where(eq(schema.lkpProductTypes.isActive, true))
      .orderBy(asc(schema.lkpProductTypes.sortOrder));
  }

  async findCategories(): Promise<any[]> {
    return this.db
      .select()
      .from(schema.lkpProductCategories)
      .where(eq(schema.lkpProductCategories.isActive, true))
      .orderBy(asc(schema.lkpProductCategories.sortOrder));
  }

  async countByDispensary(dispensaryId: string): Promise<number> {
    const [result] = await this.db
      .select({ count: count() })
      .from(schema.products)
      .where(
        and(
          eq(schema.products.dispensaryId, dispensaryId),
          eq(schema.products.isActive, true),
        ),
      );
    return result.count;
  }
}
