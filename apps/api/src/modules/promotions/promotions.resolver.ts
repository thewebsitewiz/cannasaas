import { Resolver, Query, Mutation, Args, ID, Int, Float, InputType } from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { PromotionsService } from './promotions.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ObjectType() class PromotionResult {
  @Field(() => ID) promoId!: string;
  @Field(() => ID) dispensaryId!: string;
  @Field() name!: string;
  @Field({ nullable: true }) description?: string;
  @Field() type!: string;
  @Field({ nullable: true }) code?: string;
  @Field(() => Float) discountValue!: number;
  @Field(() => Float, { nullable: true }) minimumOrderTotal?: number;
  @Field(() => Int, { nullable: true }) maxUses?: number;
  @Field(() => Int) usesCount!: number;
  @Field(() => Int, { nullable: true }) maxUsesPerCustomer?: number;
  @Field({ nullable: true }) appliesTo?: string;
  @Field({ nullable: true }) appliesToProductTypeId?: number;
  @Field(() => ID, { nullable: true }) appliesToBrandId?: string;
  @Field({ nullable: true }) appliesToTaxCategoryId?: number;
  @Field() stackableWithOthers!: boolean;
  @Field() isStaffDiscount!: boolean;
  @Field() isMedicalDiscount!: boolean;
  @Field(() => Date, { nullable: true }) startAt?: Date;
  @Field(() => Date, { nullable: true }) endAt?: Date;
  @Field() isActive!: boolean;
  @Field(() => Date) createdAt!: Date;
  @Field(() => Date) updatedAt!: Date;
}

@ObjectType() class PromotionListItem {
  @Field(() => ID) promoId!: string;
  @Field(() => ID) dispensaryId!: string;
  @Field() name!: string;
  @Field({ nullable: true }) description?: string;
  @Field() type!: string;
  @Field({ nullable: true }) code?: string;
  @Field(() => Float) discountValue!: number;
  @Field(() => Float, { nullable: true }) minimumOrderTotal?: number;
  @Field(() => Int, { nullable: true }) maxUses?: number;
  @Field(() => Int) usesCount!: number;
  @Field() isActive!: boolean;
  @Field(() => Date, { nullable: true }) startAt?: Date;
  @Field(() => Date, { nullable: true }) endAt?: Date;
  @Field(() => Date) createdAt!: Date;
}

@ObjectType() class EligibilityResult {
  @Field() eligible!: boolean;
  @Field({ nullable: true }) reason?: string;
  @Field(() => PromotionResult, { nullable: true }) promotion?: PromotionResult;
}

@ObjectType() class DiscountResult {
  @Field(() => ID) promoId!: string;
  @Field() promoName!: string;
  @Field() type!: string;
  @Field(() => Float) discountAmount!: number;
  @Field(() => Float) newTotal!: number;
}

@ObjectType() class PromotionProductResult {
  @Field(() => ID) id!: string;
  @Field(() => ID) promoId!: string;
  @Field(() => ID, { nullable: true }) productId?: string;
  @Field(() => ID, { nullable: true }) variantId?: string;
  @Field() isEligible!: boolean;
}

@ObjectType() class PromotionCategoryResult {
  @Field(() => ID) id!: string;
  @Field(() => ID) promoId!: string;
  @Field(() => Int) categoryId!: number;
  @Field() isEligible!: boolean;
}

@InputType() class CreatePromotionInput {
  @Field() name!: string;
  @Field({ nullable: true }) description?: string;
  @Field() type!: string;
  @Field({ nullable: true }) code?: string;
  @Field(() => Float) discountValue!: number;
  @Field(() => Float, { nullable: true }) minimumOrderTotal?: number;
  @Field(() => Int, { nullable: true }) maxUses?: number;
  @Field(() => Int, { nullable: true }) maxUsesPerCustomer?: number;
  @Field({ nullable: true }) appliesTo?: string;
  @Field({ nullable: true }) appliesToProductTypeId?: number;
  @Field(() => ID, { nullable: true }) appliesToBrandId?: string;
  @Field({ nullable: true }) appliesToTaxCategoryId?: number;
  @Field({ nullable: true }) stackableWithOthers?: boolean;
  @Field({ nullable: true }) isStaffDiscount?: boolean;
  @Field({ nullable: true }) isMedicalDiscount?: boolean;
  @Field({ nullable: true }) startAt?: string;
  @Field({ nullable: true }) endAt?: string;
}

@InputType() class UpdatePromotionInput {
  @Field({ nullable: true }) name?: string;
  @Field({ nullable: true }) description?: string;
  @Field({ nullable: true }) code?: string;
  @Field(() => Float, { nullable: true }) discountValue?: number;
  @Field(() => Float, { nullable: true }) minimumOrderTotal?: number;
  @Field(() => Int, { nullable: true }) maxUses?: number;
  @Field(() => Int, { nullable: true }) maxUsesPerCustomer?: number;
  @Field({ nullable: true }) appliesTo?: string;
  @Field({ nullable: true }) stackableWithOthers?: boolean;
  @Field({ nullable: true }) startAt?: string;
  @Field({ nullable: true }) endAt?: string;
}

@Resolver()
export class PromotionsResolver {
  constructor(private readonly promotions: PromotionsService) {}

  // ── Queries ─────────────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => PromotionResult, { name: 'promotion', nullable: true })
  async promotion(
    @Args('promoId', { type: () => ID }) promoId: string,
  ): Promise<any> {
    return this.promotions.findById(promoId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [PromotionListItem], { name: 'promotionsByDispensary' })
  async promotionsByDispensary(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 }) limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<any[]> {
    return this.promotions.findByDispensary(dispensaryId, limit, offset);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin', 'budtender', 'customer')
  @Query(() => [PromotionListItem], { name: 'activePromotions' })
  async activePromotions(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
  ): Promise<any[]> {
    return this.promotions.getActivePromotions(dispensaryId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin', 'budtender')
  @Query(() => EligibilityResult, { name: 'checkPromoEligibility' })
  async checkPromoEligibility(
    @Args('promoId', { type: () => ID }) promoId: string,
    @Args('orderTotal', { type: () => Float }) orderTotal: number,
    @Args('customerId', { type: () => ID, nullable: true }) customerId: string,
  ): Promise<any> {
    return this.promotions.checkEligibility(promoId, orderTotal, customerId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [PromotionProductResult], { name: 'promotionProducts' })
  async promotionProducts(
    @Args('promoId', { type: () => ID }) promoId: string,
  ): Promise<any[]> {
    return this.promotions.getPromotionProducts(promoId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [PromotionCategoryResult], { name: 'promotionCategories' })
  async promotionCategories(
    @Args('promoId', { type: () => ID }) promoId: string,
  ): Promise<any[]> {
    return this.promotions.getPromotionCategories(promoId);
  }

  // ── Mutations ───────────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => PromotionResult, { name: 'createPromotion' })
  async createPromotion(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('input') input: CreatePromotionInput,
  ): Promise<any> {
    return this.promotions.create(dispensaryId, input);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => PromotionResult, { name: 'updatePromotion' })
  async updatePromotion(
    @Args('promoId', { type: () => ID }) promoId: string,
    @Args('input') input: UpdatePromotionInput,
  ): Promise<any> {
    return this.promotions.update(promoId, input);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => PromotionResult, { name: 'activatePromotion' })
  async activatePromotion(
    @Args('promoId', { type: () => ID }) promoId: string,
  ): Promise<any> {
    return this.promotions.activate(promoId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => PromotionResult, { name: 'deactivatePromotion' })
  async deactivatePromotion(
    @Args('promoId', { type: () => ID }) promoId: string,
  ): Promise<any> {
    return this.promotions.deactivate(promoId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin', 'budtender')
  @Mutation(() => DiscountResult, { name: 'applyPromoDiscount' })
  async applyPromoDiscount(
    @Args('promoId', { type: () => ID }) promoId: string,
    @Args('orderTotal', { type: () => Float }) orderTotal: number,
  ): Promise<any> {
    return this.promotions.applyDiscount(promoId, orderTotal);
  }
}
