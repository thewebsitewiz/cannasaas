import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { StrainData } from './entities/strain-data.entity';
import { OtreebaService } from './otreeba.service';
import { ProductEnrichmentService, EnrichmentResult } from './product-enrichment.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { ForbiddenException } from '@nestjs/common';

@ObjectType()
class EnrichmentResultType {
  @Field() productId!: string;
  @Field() strainMatched!: boolean;
  @Field({ nullable: true }) strainName?: string;
  @Field(() => [String]) fieldsUpdated!: string[];
}

@ObjectType()
class BulkEnrichResultType {
  @Field(() => Int) total!: number;
  @Field(() => Int) enriched!: number;
  @Field(() => Int) failed!: number;
}

@ObjectType()
class BulkImportResultType {
  @Field(() => Int) imported!: number;
  @Field(() => Int) skipped!: number;
  @Field(() => Int) total!: number;
}

@Resolver(() => StrainData)
export class ProductDataResolver {
  constructor(
    private readonly otreeba: OtreebaService,
    private readonly enrichment: ProductEnrichmentService,
  ) {}

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [StrainData], { name: 'searchStrains' })
  async searchStrains(@Args('name') name: string): Promise<StrainData[]> {
    return this.otreeba.searchStrains(name);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [StrainData], { name: 'cachedStrains' })
  async cachedStrains(@Args('type', { nullable: true }) type?: string): Promise<StrainData[]> {
    return this.otreeba.listCachedStrains(type);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => EnrichmentResultType, { name: 'enrichProduct' })
  async enrichProduct(
    @Args('productId', { type: () => ID }) productId: string,
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<EnrichmentResult> {
    if (user.role === 'dispensary_admin' && dispensaryId !== user.dispensaryId) throw new ForbiddenException('Access denied');
    return this.enrichment.enrichProduct(productId, dispensaryId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => BulkEnrichResultType, { name: 'enrichDispensaryProducts' })
  async enrichDispensary(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ total: number; enriched: number; failed: number }> {
    if (user.role === 'dispensary_admin' && dispensaryId !== user.dispensaryId) throw new ForbiddenException('Access denied');
    return this.enrichment.enrichDispensary(dispensaryId);
  }

  @Roles('org_admin', 'super_admin')
  @Mutation(() => BulkImportResultType, { name: 'importOtreebaStrains' })
  async importStrains(
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('count', { type: () => Int, nullable: true }) count?: number,
    @Args('type', { nullable: true }) type?: string,
  ): Promise<{ imported: number; skipped: number; total: number }> {
    return this.otreeba.bulkImportStrains({ page, count, type });
  }
}
