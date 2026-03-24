import { Resolver, Query, Mutation, Args, ID, Int, Float, ObjectType, Field } from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
class MarketingCampaign {
  @Field(() => ID) campaignId!: string;
  @Field() dispensaryId!: string;
  @Field() name!: string;
  @Field() campaignType!: string;
  @Field() channel!: string;
  @Field(() => GraphQLJSON, { nullable: true }) audienceFilter?: any;
  @Field({ nullable: true }) subject?: string;
  @Field({ nullable: true }) body?: string;
  @Field() status!: string;
  @Field({ nullable: true }) scheduledAt?: Date;
  @Field({ nullable: true }) sentAt?: Date;
  @Field(() => Int) sentCount!: number;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}

@ObjectType()
class MarketingAutomation {
  @Field(() => ID) automationId!: string;
  @Field() dispensaryId!: string;
  @Field() triggerEvent!: string;
  @Field(() => Int) delayMinutes!: number;
  @Field({ nullable: true }) templateId?: string;
  @Field() channel!: string;
  @Field() isActive!: boolean;
  @Field() createdAt!: Date;
}

@ObjectType()
class CampaignStats {
  @Field(() => ID) campaignId!: string;
  @Field(() => Int) sentCount!: number;
  @Field(() => Float) openRate!: number;
  @Field(() => Float) clickRate!: number;
}

@Resolver()
export class MarketingResolver {
  constructor(private readonly marketing: MarketingService) {}

  private guard(user: JwtPayload, dispensaryId: string) {
    if (user.role === 'dispensary_admin' && dispensaryId !== user.dispensaryId)
      throw new ForbiddenException('Access denied');
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => MarketingCampaign, { name: 'createMarketingCampaign' })
  async createCampaign(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('name') name: string,
    @Args('campaignType', { defaultValue: 'blast' }) campaignType: string,
    @Args('channel', { defaultValue: 'email' }) channel: string,
    @Args('audienceFilter', { nullable: true }) audienceFilter: string,
    @Args('subject', { nullable: true }) subject: string,
    @Args('body', { nullable: true }) body: string,
    @Args('scheduledAt', { nullable: true }) scheduledAt: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<MarketingCampaign> {
    this.guard(user, dispensaryId);
    return this.marketing.createCampaign({
      dispensaryId,
      name,
      campaignType,
      channel,
      audienceFilter: audienceFilter ? { type: audienceFilter } : undefined,
      subject,
      body,
      scheduledAt,
    });
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [MarketingCampaign], { name: 'marketingCampaigns' })
  async getCampaigns(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<MarketingCampaign[]> {
    this.guard(user, dispensaryId);
    return this.marketing.getCampaigns(dispensaryId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => MarketingCampaign, { name: 'sendMarketingCampaign' })
  async sendCampaign(
    @Args('campaignId', { type: () => ID }) campaignId: string,
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<MarketingCampaign> {
    this.guard(user, dispensaryId);
    return this.marketing.sendCampaign(campaignId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [MarketingAutomation], { name: 'marketingAutomations' })
  async getAutomations(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<MarketingAutomation[]> {
    this.guard(user, dispensaryId);
    return this.marketing.getAutomatedTriggers(dispensaryId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => MarketingAutomation, { name: 'createMarketingAutomation' })
  async createAutomation(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('triggerEvent') triggerEvent: string,
    @Args('delayMinutes', { type: () => Int, defaultValue: 0 }) delayMinutes: number,
    @Args('templateId', { nullable: true }) templateId: string,
    @Args('channel', { defaultValue: 'email' }) channel: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<MarketingAutomation> {
    this.guard(user, dispensaryId);
    return this.marketing.createAutomatedTrigger({
      dispensaryId,
      triggerEvent,
      delayMinutes,
      templateId,
      channel,
    });
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => CampaignStats, { name: 'campaignStats' })
  async getStats(
    @Args('campaignId', { type: () => ID }) campaignId: string,
  ): Promise<CampaignStats> {
    return this.marketing.getCampaignStats(campaignId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => Int, { name: 'audienceCount' })
  async audienceCount(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('filter', { defaultValue: 'all' }) filter: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<number> {
    this.guard(user, dispensaryId);
    return this.marketing.getAudienceCount(dispensaryId, filter);
  }
}
