import { Resolver, Query, Mutation, Args, ID, Int, Float } from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { LoyaltyService } from './loyalty.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import GraphQLJSON from 'graphql-type-json';

@ObjectType() class LoyaltyTierInfo { @Field() name!: string; @Field() code!: string; @Field(() => Int) minPoints!: number; @Field(() => Float) multiplier!: number; @Field({ nullable: true }) perks?: string; @Field({ nullable: true }) color?: string; }
@ObjectType() class NextTierInfo { @Field() name!: string; @Field(() => Int) pointsNeeded!: number; }

@ObjectType() class MyLoyalty {
  @Field(() => Int) points!: number; @Field(() => Int) lifetimePoints!: number;
  @Field() tier!: string; @Field() tierName!: string; @Field({ nullable: true }) tierColor?: string;
  @Field({ nullable: true }) tierPerks?: string; @Field(() => Float) multiplier!: number;
  @Field(() => NextTierInfo, { nullable: true }) nextTier?: NextTierInfo;
  @Field(() => Float) pointValue!: number;
  @Field(() => [LoyaltyTierInfo]) allTiers!: LoyaltyTierInfo[];
}

@ObjectType() class PointTransaction { @Field(() => ID) transactionId!: string; @Field() type!: string; @Field(() => Int) points!: number; @Field(() => Int) balanceAfter!: number; @Field({ nullable: true }) description?: string; @Field(() => Date) createdAt!: Date; }

@ObjectType() class LoyaltyReward { @Field(() => ID) rewardId!: string; @Field() name!: string; @Field({ nullable: true }) description?: string; @Field(() => Int) pointsCost!: number; @Field() rewardType!: string; @Field(() => Float) rewardValue!: number; }

@ObjectType() class RedeemResult { @Field(() => Int) newBalance!: number; @Field() rewardName!: string; }

@ObjectType() class BirthdayCheck { @Field() eligible!: boolean; @Field({ nullable: true }) reason?: string; @Field(() => Int, { nullable: true }) bonusPoints?: number; @Field(() => Float, { nullable: true }) discountPercent?: number; }

@ObjectType() class TierCount { @Field() tier!: string; @Field(() => Int) count!: number; }
@ObjectType() class LoyaltyStats { @Field(() => Int) activeMembers!: number; @Field(() => Int) totalEarned!: number; @Field(() => Int) totalRedeemed!: number; @Field(() => Int) redemptionCount!: number; @Field(() => Int) birthdayClaims!: number; @Field(() => [TierCount]) tierBreakdown!: TierCount[]; }

@Resolver()
export class LoyaltyResolver {
  constructor(private readonly loyalty: LoyaltyService) {}

  // ── Customer ──────────────────────────────────────────────────────────

  @Roles('customer', 'dispensary_admin')
  @Query(() => MyLoyalty, { name: 'myLoyalty', nullable: true })
  async myLoyalty(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    return this.loyalty.getMyLoyalty(user.sub, dispensaryId);
  }

  @Roles('customer', 'dispensary_admin')
  @Query(() => [PointTransaction], { name: 'myPointHistory' })
  async pointHistory(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<any[]> {
    return this.loyalty.getPointHistory(user.sub, limit);
  }

  @Roles('customer', 'dispensary_admin')
  @Query(() => [LoyaltyReward], { name: 'availableRewards' })
  async rewards(@Args('dispensaryId', { type: () => ID }) dispensaryId: string): Promise<any[]> {
    return this.loyalty.getRewards(dispensaryId);
  }

  @Roles('customer')
  @Mutation(() => RedeemResult, { name: 'redeemReward' })
  async redeem(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('rewardId', { type: () => ID }) rewardId: string,
    @Args('orderId', { type: () => ID, nullable: true }) orderId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    const result = await this.loyalty.redeemPoints(user.sub, dispensaryId, rewardId, orderId);
    return { newBalance: result.newBalance, rewardName: result.reward.name };
  }

  @Roles('customer')
  @Query(() => BirthdayCheck, { name: 'birthdayBonusCheck' })
  async birthdayCheck(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    return this.loyalty.checkBirthdayBonus(user.sub, dispensaryId);
  }

  @Roles('customer')
  @Mutation(() => PointTransaction, { name: 'claimBirthdayBonus' })
  async claimBirthday(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    return this.loyalty.claimBirthdayBonus(user.sub, dispensaryId);
  }

  // ── Admin ──────────────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => LoyaltyStats, { name: 'loyaltyStats' })
  async stats(@Args('dispensaryId', { type: () => ID }) dispensaryId: string): Promise<any> {
    return this.loyalty.getLoyaltyStats(dispensaryId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => GraphQLJSON, { name: 'createReward' })
  async createReward(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('name') name: string,
    @Args('pointsCost', { type: () => Int }) pointsCost: number,
    @Args('rewardType') rewardType: string,
    @Args('rewardValue', { type: () => Float }) rewardValue: number,
    @Args('description', { nullable: true }) description: string,
  ): Promise<any> {
    return this.loyalty.createReward(dispensaryId, { name, description, pointsCost, rewardType, rewardValue });
  }

  @Roles('dispensary_admin', 'budtender')
  @Mutation(() => GraphQLJSON, { name: 'givePoints' })
  async givePoints(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('points', { type: () => Int }) points: number,
    @Args('reason') reason: string,
  ): Promise<any> {
    return this.loyalty.earnPoints(userId, dispensaryId, points, 'earn_manual', reason);
  }
}
