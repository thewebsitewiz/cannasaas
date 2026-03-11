import { Resolver, Query, Args, ID, Int, ResolveField, Parent } from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';
import { ProductsService } from './products.service';
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
  constructor(private readonly products: ProductsService) {}

  // Public storefront — scoped to tenant dispensary
  @Public()
  @Query(() => [Product], { name: 'products' })
  async findAll(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('productTypeId', { type: () => Int, nullable: true }) productTypeId?: number,
    @Args('categoryId', { type: () => Int, nullable: true }) categoryId?: number,
    @Args('search', { nullable: true }) search?: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<Product[]> {
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
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<Product[]> {
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
}
