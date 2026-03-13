import { Resolver, Query, Mutation, Args, ID, Int, Float } from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { PlatformService } from './platform.service';
import { Roles } from '../../common/decorators/roles.decorator';
import GraphQLJSON from 'graphql-type-json';

@ObjectType() class TenantStats { @Field(() => Int) total!: number; @Field(() => Int) active!: number; @Field(() => Int) trial!: number; @Field(() => Int) suspended!: number; }
@ObjectType() class RevenueStats { @Field(() => Float) mrr!: number; @Field(() => Float) arr!: number; }
@ObjectType() class DispStats { @Field(() => Int) total!: number; @Field(() => Int) active!: number; @Field(() => Int) states!: number; }
@ObjectType() class UserStats { @Field(() => Int) total!: number; @Field(() => Int) customers!: number; @Field(() => Int) staff!: number; @Field(() => Int) active24h!: number; @Field(() => Int) active7d!: number; }
@ObjectType() class OrderStats { @Field(() => Int) total!: number; @Field(() => Int) last30d!: number; @Field(() => Float) gmvTotal!: number; @Field(() => Float) gmv30d!: number; }
@ObjectType() class TierBreakdown { @Field() tier!: string; @Field(() => Int) count!: number; @Field(() => Float) revenue!: number; }

@ObjectType() class PlatformDashboard {
  @Field(() => TenantStats) tenants!: TenantStats;
  @Field(() => RevenueStats) revenue!: RevenueStats;
  @Field(() => DispStats) dispensaries!: DispStats;
  @Field(() => UserStats) users!: UserStats;
  @Field(() => OrderStats) orders!: OrderStats;
  @Field(() => [TierBreakdown]) tierBreakdown!: TierBreakdown[];
  @Field(() => Int) totalLocations!: number;
}

@ObjectType() class PlatformTenant {
  @Field(() => ID) orgId!: string; @Field() name!: string;
  @Field({ nullable: true }) subscriptionTier?: string; @Field({ nullable: true }) billingStatus?: string;
  @Field({ nullable: true }) billingEmail?: string; @Field(() => Float, { nullable: true }) monthlyRevenue?: number;
  @Field(() => Int, { nullable: true }) totalLocations?: number; @Field({ nullable: true }) notes?: string;
  @Field(() => Int, { nullable: true }) dispensaryCount?: number; @Field(() => Int, { nullable: true }) userCount?: number;
  @Field(() => Int, { nullable: true }) orders30d?: number; @Field(() => Float, { nullable: true }) revenue30d?: number;
  @Field(() => Date, { nullable: true }) onboardedAt?: Date; @Field(() => Date, { nullable: true }) trialEndsAt?: Date;
  @Field(() => Date) createdAt!: Date;
}

@ObjectType() class PlatformActivity {
  @Field(() => ID) activity_id!: string; @Field() activity_type!: string;
  @Field({ nullable: true }) description?: string; @Field({ nullable: true }) org_name?: string;
  @Field(() => Date) created_at!: Date;
}

@ObjectType() class TaxRule {
  @Field(() => Int) tax_category_id!: number; @Field() state!: string; @Field() code!: string;
  @Field() name!: string; @Field(() => Float) rate!: number; @Field() tax_basis!: string;
  @Field({ nullable: true }) statutory_reference?: string; @Field() is_active!: boolean;
}

@ObjectType() class BillingInvoice {
  @Field(() => ID) invoice_id!: string; @Field(() => Float) amount!: number;
  @Field(() => Float) total!: number; @Field() status!: string;
  @Field({ nullable: true }) org_name?: string; @Field(() => Date) created_at!: Date;
}

@ObjectType() class PlatformReport {
  @Field(() => GraphQLJSON) tenantHealth!: any;
  @Field(() => Float) churnRate!: number; @Field(() => Int) totalTenants!: number; @Field(() => Int) churned!: number;
}

@Resolver()
export class PlatformResolver {
  constructor(private readonly platform: PlatformService) {}

  @Roles('super_admin')
  @Query(() => PlatformDashboard, { name: 'platformDashboard' })
  async dashboard(): Promise<any> { return this.platform.getDashboard(); }

  @Roles('super_admin')
  @Query(() => [PlatformTenant], { name: 'platformTenants' })
  async tenants(): Promise<any[]> { return this.platform.getTenants(); }

  @Roles('super_admin')
  @Query(() => PlatformTenant, { name: 'platformTenant' })
  async tenant(@Args('orgId', { type: () => ID }) orgId: string): Promise<any> { return this.platform.getTenant(orgId); }

  @Roles('super_admin')
  @Mutation(() => PlatformTenant, { name: 'updateTenant' })
  async updateTenant(
    @Args('orgId', { type: () => ID }) orgId: string,
    @Args('subscriptionTier', { nullable: true }) subscriptionTier: string,
    @Args('billingStatus', { nullable: true }) billingStatus: string,
    @Args('billingEmail', { nullable: true }) billingEmail: string,
    @Args('notes', { nullable: true }) notes: string,
  ): Promise<any> { return this.platform.updateTenant(orgId, { subscriptionTier, billingStatus, billingEmail, notes }); }

  @Roles('super_admin')
  @Mutation(() => PlatformTenant, { name: 'createTenant' })
  async createTenant(
    @Args('name') name: string, @Args('billingEmail') billingEmail: string,
    @Args('subscriptionTier', { defaultValue: 'starter' }) subscriptionTier: string,
    @Args('state', { defaultValue: 'NY' }) state: string,
  ): Promise<any> { return this.platform.createTenant({ name, billingEmail, subscriptionTier, state }); }

  @Roles('super_admin')
  @Mutation(() => PlatformTenant, { name: 'suspendTenant' })
  async suspendTenant(@Args('orgId', { type: () => ID }) orgId: string, @Args('reason') reason: string): Promise<any> {
    return this.platform.suspendTenant(orgId, reason);
  }

  @Roles('super_admin')
  @Query(() => [TaxRule], { name: 'platformTaxRules' })
  async taxRules(): Promise<any[]> { return this.platform.getTaxRules(); }

  @Roles('super_admin')
  @Mutation(() => TaxRule, { name: 'addTaxRule' })
  async addTaxRule(
    @Args('state') state: string, @Args('code') code: string, @Args('name') name: string,
    @Args('rate', { type: () => Float }) rate: number, @Args('taxBasis') taxBasis: string,
    @Args('statutoryReference', { nullable: true }) statutoryReference: string,
  ): Promise<any> { return this.platform.addTaxRule({ state, code, name, rate, taxBasis, statutoryReference }); }

  @Roles('super_admin')
  @Mutation(() => TaxRule, { name: 'updateTaxRule' })
  async updateTaxRule(
    @Args('taxCategoryId', { type: () => Int }) taxCategoryId: number,
    @Args('rate', { type: () => Float, nullable: true }) rate: number,
    @Args('isActive', { nullable: true }) isActive: boolean,
    @Args('name', { nullable: true }) name: string,
  ): Promise<any> { return this.platform.updateTaxRule(taxCategoryId, { rate, isActive, name }); }

  @Roles('super_admin')
  @Query(() => [BillingInvoice], { name: 'platformInvoices' })
  async invoices(@Args('orgId', { type: () => ID, nullable: true }) orgId: string): Promise<any[]> { return this.platform.getInvoices(orgId); }

  @Roles('super_admin')
  @Query(() => [PlatformActivity], { name: 'platformActivity' })
  async activity(@Args('limit', { type: () => Int, nullable: true, defaultValue: 50 }) limit: number): Promise<any[]> { return this.platform.getActivity(limit); }

  @Roles('super_admin')
  @Query(() => PlatformReport, { name: 'platformReport' })
  async report(): Promise<any> { return this.platform.getPlatformReport(); }

  @Roles('super_admin')
  @Query(() => [GraphQLJSON], { name: 'subscriptionTiers' })
  async tiers(): Promise<any[]> { return this.platform.getSubscriptionTiers(); }
}
