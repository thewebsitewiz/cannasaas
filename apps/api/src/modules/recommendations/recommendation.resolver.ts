import { Resolver, Query, Args, ID, Int } from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ObjectType() class RecommendedProduct {
  @Field(() => ID) productId!: string;
  @Field() productName!: string;
  @Field({ nullable: true }) strainType?: string;
  @Field(() => Int, { nullable: true }) coCount?: number;
  @Field(() => Int, { nullable: true }) unitsSold?: number;
  @Field(() => Int, { nullable: true }) matchScore?: number;
  @Field(() => Int, { nullable: true }) orderCount?: number;
  @Field(() => [String], { nullable: true }) effects?: string[];
}

@Resolver()
export class RecommendationResolver {
  constructor(private readonly recService: RecommendationService) {}

  private resolveDispensary(user: JwtPayload, dispensaryId?: string): string {
    const targetId = dispensaryId ?? user.dispensaryId;
    if (!targetId) throw new ForbiddenException('dispensaryId required');
    if (user.role === 'dispensary_admin' && targetId !== user.dispensaryId) throw new ForbiddenException('Access denied');
    return targetId;
  }

  @Query(() => [RecommendedProduct], { name: 'recommendations' })
  async recommendations(
    @CurrentUser() user: JwtPayload,
    @Args('productId', { type: () => ID }) productId: string,
    @Args('dispensaryId', { type: () => ID, nullable: true }) dispensaryId?: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<RecommendedProduct[]> {
    return this.recService.getFrequentlyBoughtTogether(productId, this.resolveDispensary(user, dispensaryId), limit ?? 5);
  }

  @Query(() => [RecommendedProduct], { name: 'popularInCategory' })
  async popularInCategory(
    @CurrentUser() user: JwtPayload,
    @Args('categoryId', { type: () => ID }) categoryId: string,
    @Args('dispensaryId', { type: () => ID, nullable: true }) dispensaryId?: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<RecommendedProduct[]> {
    return this.recService.getPopularInCategory(categoryId, this.resolveDispensary(user, dispensaryId), limit ?? 10);
  }

  @Query(() => [RecommendedProduct], { name: 'trending' })
  async trending(
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID, nullable: true }) dispensaryId?: string,
    @Args('days', { type: () => Int, nullable: true }) days?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<RecommendedProduct[]> {
    return this.recService.getTrendingProducts(this.resolveDispensary(user, dispensaryId), days ?? 7, limit ?? 10);
  }

  @Query(() => [RecommendedProduct], { name: 'personalizedForMe' })
  async personalizedForMe(
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID, nullable: true }) dispensaryId?: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<RecommendedProduct[]> {
    return this.recService.getPersonalizedForCustomer(user.sub, this.resolveDispensary(user, dispensaryId), limit ?? 10);
  }
}
