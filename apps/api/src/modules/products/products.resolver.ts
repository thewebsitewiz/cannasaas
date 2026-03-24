import { Resolver, Query, Args, ID, Int, Float, ResolveField, Parent } from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';
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
}

@Resolver(() => ProductVariant)
export class ProductVariantResolver {
  constructor(private readonly products: ProductsService) {}

  @ResolveField(() => Float, { name: 'retailPrice', nullable: true })
  async retailPrice(@Parent() variant: ProductVariant): Promise<number | null> {
    const pricing = await this.products.findCurrentPricing(variant.variant_id);
    return pricing ? Number(pricing.price) : null;
  }
}
