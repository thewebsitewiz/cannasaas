import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { ObjectType, Field, Float } from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ObjectType() class KnowledgeProduct {
  @Field(() => ID) productId!: string;
  @Field() productName!: string;
  @Field({ nullable: true }) strainType?: string;
  @Field({ nullable: true }) categoryName?: string;
  @Field(() => [String], { nullable: true }) effects?: string[];
  @Field(() => [String], { nullable: true }) terpenes?: string[];
  @Field(() => Float, { nullable: true }) thcContent?: number;
  @Field(() => Float, { nullable: true }) cbdContent?: number;
  @Field({ nullable: true }) description?: string;
  @Field({ nullable: true }) matchedCondition?: string;
  @Field(() => [String], { nullable: true }) matchedEffects?: string[];
}

@Resolver()
export class KnowledgeResolver {
  constructor(private readonly knowledge: KnowledgeService) {}

  private resolveDispensary(user: JwtPayload, dispensaryId?: string): string {
    const targetId = dispensaryId ?? user.dispensaryId;
    if (!targetId) throw new ForbiddenException('dispensaryId required');
    if (user.role === 'dispensary_admin' && targetId !== user.dispensaryId) throw new ForbiddenException('Access denied');
    return targetId;
  }

  @Query(() => [KnowledgeProduct], { name: 'productsByEffect' })
  async productsByEffect(
    @CurrentUser() user: JwtPayload,
    @Args('effect') effect: string,
    @Args('dispensaryId', { type: () => ID, nullable: true }) dispensaryId?: string,
  ): Promise<KnowledgeProduct[]> {
    return this.knowledge.searchByEffect(effect, this.resolveDispensary(user, dispensaryId));
  }

  @Query(() => [KnowledgeProduct], { name: 'productsByCondition' })
  async productsByCondition(
    @CurrentUser() user: JwtPayload,
    @Args('condition') condition: string,
    @Args('dispensaryId', { type: () => ID, nullable: true }) dispensaryId?: string,
  ): Promise<KnowledgeProduct[]> {
    return this.knowledge.searchByCondition(condition, this.resolveDispensary(user, dispensaryId));
  }

  @Query(() => [KnowledgeProduct], { name: 'compareProducts' })
  async compareProducts(
    @Args('productIds', { type: () => [ID] }) productIds: string[],
  ): Promise<KnowledgeProduct[]> {
    return this.knowledge.getProductComparison(productIds);
  }
}
