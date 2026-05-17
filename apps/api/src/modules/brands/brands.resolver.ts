import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Int,
  InputType,
} from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { BrandsService, BrandDto } from './brands.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ObjectType()
class BrandResult {
  @Field(() => ID) brandId!: string;
  @Field(() => ID) organizationId!: string;
  @Field() name!: string;
  @Field({ nullable: true }) slug?: string;
  @Field({ nullable: true }) description?: string;
  @Field({ nullable: true }) logoUrl?: string;
  @Field({ nullable: true }) websiteUrl?: string;
  @Field() isActive!: boolean;
  @Field(() => Date) createdAt!: Date;
  @Field(() => Date) updatedAt!: Date;
}

@ObjectType()
class BrandListItem {
  @Field(() => ID) brandId!: string;
  @Field(() => ID) organizationId!: string;
  @Field() name!: string;
  @Field({ nullable: true }) slug?: string;
  @Field({ nullable: true }) logoUrl?: string;
  @Field() isActive!: boolean;
  @Field(() => Date) createdAt!: Date;
}

@InputType()
class CreateBrandInput {
  @Field(() => ID) organizationId!: string;
  @Field() name!: string;
  @Field({ nullable: true }) slug?: string;
  @Field({ nullable: true }) description?: string;
  @Field({ nullable: true }) logoUrl?: string;
  @Field({ nullable: true }) websiteUrl?: string;
}

@InputType()
class UpdateBrandInput {
  @Field({ nullable: true }) name?: string;
  @Field({ nullable: true }) slug?: string;
  @Field({ nullable: true }) description?: string;
  @Field({ nullable: true }) logoUrl?: string;
  @Field({ nullable: true }) websiteUrl?: string;
  @Field({ nullable: true }) isActive?: boolean;
}

@Resolver()
export class BrandsResolver {
  constructor(private readonly brands: BrandsService) {}

  // ── Queries ─────────────────────────────────────────────────────────

  @Roles('org_admin', 'dispensary_admin', 'super_admin')
  @Query(() => BrandResult, { name: 'brand', nullable: true })
  async brand(
    @Args('brandId', { type: () => ID }) brandId: string,
  ): Promise<BrandDto> {
    return this.brands.findById(brandId);
  }

  @Roles('super_admin')
  @Query(() => [BrandListItem], { name: 'brands' })
  async listBrands(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 })
    limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 })
    offset: number,
  ): Promise<BrandDto[]> {
    return this.brands.findAll(limit, offset);
  }

  @Roles('org_admin', 'dispensary_admin', 'super_admin')
  @Query(() => [BrandListItem], { name: 'brandsByOrganization' })
  async brandsByOrganization(
    @Args('organizationId', { type: () => ID }) organizationId: string,
  ): Promise<BrandDto[]> {
    return this.brands.findByOrganization(organizationId);
  }

  // ── Mutations ───────────────────────────────────────────────────────

  @Roles('org_admin', 'super_admin')
  @Mutation(() => BrandResult, { name: 'createBrand' })
  async createBrand(@Args('input') input: CreateBrandInput): Promise<BrandDto> {
    return this.brands.create(input);
  }

  @Roles('org_admin', 'super_admin')
  @Mutation(() => BrandResult, { name: 'updateBrand' })
  async updateBrand(
    @Args('brandId', { type: () => ID }) brandId: string,
    @Args('input') input: UpdateBrandInput,
  ): Promise<BrandDto> {
    return this.brands.update(brandId, input);
  }

  @Roles('org_admin', 'super_admin')
  @Mutation(() => Boolean, { name: 'deleteBrand' })
  async deleteBrand(
    @Args('brandId', { type: () => ID }) brandId: string,
  ): Promise<boolean> {
    return this.brands.softDelete(brandId);
  }
}
