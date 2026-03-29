import { Resolver, Query, Mutation, Args, ID, Int, Float, ResolveField, Parent } from '@nestjs/graphql';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ForbiddenException } from '@nestjs/common';
import { CreateProductInput, UpdateProductInput, UpdateVariantPriceInput } from "./dto/product-crud.input";
import { ProductsService } from './products.service';
import { ProductSearchService } from './product-search.service';
import { ProductSearchInput } from './dto/product-search.input';
import { ProductSearchResult, AutocompleteResult } from './dto/product-search-result.type';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductPricing } from './entities/product-pricing.entity';
import { LkpProductType } from './entities/lookups/lookups.entity';
import { LkpProductCategory } from './entities/lookups/lookups.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Resolver(() => Product)
export class ProductsResolver {
  constructor(
    private readonly products: ProductsService,
    private readonly search: ProductSearchService,
  ) {}

  // Public storefront — scoped to tenant dispensary
  @Public()
  @Query(() => [Product], { name: 'products' })
  async findAll(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('productTypeId', { type: () => Int, nullable: true }) productTypeId?: number,
    @Args('categoryId', { type: () => Int, nullable: true }) categoryId?: number,
    @Args('search', { nullable: true }) search?: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 }) rawLimit = 50,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<Product[]> {
    const limit = Math.min(rawLimit, 100);
    return this.products.findAll({
      dispensaryId,
      productTypeId,
      categoryId,
      search,
      isActive: true,
      limit,
      offset,
    });
  }

  // Public storefront — single product
  @Public()
  @Query(() => Product, { name: 'product', nullable: true })
  async findOne(
    @Args('id', { type: () => ID }) id: string,
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
  ): Promise<Product> {
    return this.products.findById(id, dispensaryId);
  }

  // Admin — all products including inactive
  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [Product], { name: 'adminProducts' })
  async findAllAdmin(
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID, nullable: true }) dispensaryId?: string,
    @Args('productTypeId', { type: () => Int, nullable: true }) productTypeId?: number,
    @Args('categoryId', { type: () => Int, nullable: true }) categoryId?: number,
    @Args('search', { nullable: true }) search?: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 }) rawLimit = 50,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<Product[]> {
    const limit = Math.min(rawLimit, 100);
    const targetDispensaryId = dispensaryId ?? user.dispensaryId;
    if (!targetDispensaryId) throw new ForbiddenException('dispensaryId required');

    if (user.role === 'dispensary_admin' && targetDispensaryId !== user.dispensaryId) {
      throw new ForbiddenException('Access denied');
    }

    return this.products.findAll({
      dispensaryId: targetDispensaryId,
      productTypeId,
      categoryId,
      search,
      limit,
      offset,
    });
  }

  // Product count for dashboard
  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => Int, { name: 'productCount' })
  async count(
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID, nullable: true }) dispensaryId?: string,
  ): Promise<number> {
    const targetId = dispensaryId ?? user.dispensaryId;
    if (!targetId) throw new ForbiddenException('dispensaryId required');
    return this.products.countByDispensary(targetId);
  }

  // Lookup tables — public
  @Public()
  @Query(() => [LkpProductType], { name: 'productTypes' })
  findProductTypes(): Promise<LkpProductType[]> {
    return this.products.findProductTypes();
  }

  @Public()
  @Query(() => [LkpProductCategory], { name: 'productCategories' })
  findCategories(): Promise<LkpProductCategory[]> {
    return this.products.findCategories();
  }

  // Field resolvers
  @ResolveField(() => [ProductVariant], { name: 'variants' })
  async variants(
    @Parent() product: Product,
  ): Promise<ProductVariant[]> {
    return this.products.findVariants(product.id, product.dispensary_id);
  }

  // ── Full-text search with faceted filtering ─────────────────────────────

  @Public()
  @Query(() => ProductSearchResult, { name: 'searchProducts' })
  async searchProducts(
    @Args('input') input: ProductSearchInput,
  ): Promise<ProductSearchResult> {
    return this.search.search(input);
  }

  @Public()
  @Query(() => [AutocompleteResult], { name: 'autocompleteProducts' })
  async autocomplete(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('query') query: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 }) rawLimit = 50,
  ): Promise<AutocompleteResult[]> {
    const limit = Math.min(rawLimit, 100);
    return this.search.autocomplete(dispensaryId, query, limit);
  }

  // ═══ CRUD Mutations ═══

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => Product, { name: 'createProduct' })
  async createProduct(@Args('input') input: CreateProductInput): Promise<Product> {
    return this.products.createProduct(input);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => Product, { name: 'updateProduct' })
  async updateProduct(@Args('input') input: UpdateProductInput): Promise<Product> {
    return this.products.updateProduct(input);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => Boolean, { name: 'updateVariantPrice' })
  async updateVariantPrice(@Args('input') input: UpdateVariantPriceInput): Promise<boolean> {
    await this.products.updateVariantPrice(input.variantId, input.dispensaryId, input.price);
    return true;
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => Boolean, { name: 'deleteProduct' })
  async deleteProduct(
    @Args('productId', { type: () => ID }) productId: string,
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
  ): Promise<boolean> {
    return this.products.deleteProduct(productId, dispensaryId);
  }
}
@Resolver(() => ProductVariant)
export class ProductVariantResolver {
  constructor(
    private readonly products: ProductsService,
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  @ResolveField(() => Float, { name: 'retailPrice', nullable: true })
  async retailPrice(@Parent() variant: ProductVariant): Promise<number | null> {
    const pricing = await this.products.findCurrentPricing(variant.variant_id);
    return pricing ? Number(pricing.price) : null;
  }

  @ResolveField(() => Float, { name: 'stockQuantity', nullable: true })
  async stockQuantity(@Parent() variant: ProductVariant): Promise<number> {
    const [row] = await this.ds.query(
      'SELECT quantity_available FROM inventory WHERE variant_id = $1 AND dispensary_id = $2',
      [variant.variant_id, variant.dispensary_id],
    );
    // Return 0 when no inventory row exists — NOT null.
    // null tells the frontend "no limit" which lets customers add unlimited qty.
    return row ? Number(row.quantity_available) : 0;
  }

  @ResolveField(() => String, { name: 'stockStatus', nullable: true })
  async stockStatus(@Parent() variant: ProductVariant): Promise<string> {
    const [row] = await this.ds.query(
      'SELECT quantity_available, reorder_threshold FROM inventory WHERE variant_id = $1 AND dispensary_id = $2',
      [variant.variant_id, variant.dispensary_id],
    );
    // No inventory row = out of stock, not unknown
    if (!row) return 'out_of_stock';
    const qty = Number(row.quantity_available);
    const threshold = Number(row.reorder_threshold ?? 10);
    if (qty <= 0) return 'out_of_stock';
    if (qty <= threshold) return 'low_stock';
    return 'in_stock';
  }
}
