import { Resolver, Query, Mutation, Args, ID, Int, InputType } from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { OrganizationsService } from './organizations.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ObjectType() class OrganizationResult {
  @Field(() => ID) organizationId!: string;
  @Field() name!: string;
  @Field() slug!: string;
  @Field({ nullable: true }) billingEmail?: string;
  @Field({ nullable: true }) billingAddress?: string;
  @Field() subscriptionTier!: string;
  @Field() subscriptionStatus!: string;
  @Field({ nullable: true }) stripeCustomerId?: string;
  @Field(() => Date) createdAt!: Date;
  @Field(() => Date) updatedAt!: Date;
}

@ObjectType() class OrganizationListItem {
  @Field(() => ID) organizationId!: string;
  @Field() name!: string;
  @Field() slug!: string;
  @Field({ nullable: true }) billingEmail?: string;
  @Field() subscriptionTier!: string;
  @Field() subscriptionStatus!: string;
  @Field(() => Date) createdAt!: Date;
}

@InputType() class CreateOrganizationInput {
  @Field() name!: string;
  @Field() slug!: string;
  @Field({ nullable: true }) billingEmail?: string;
  @Field({ nullable: true }) billingAddress?: string;
  @Field({ nullable: true }) subscriptionTier?: string;
}

@InputType() class UpdateOrganizationInput {
  @Field({ nullable: true }) name?: string;
  @Field({ nullable: true }) slug?: string;
  @Field({ nullable: true }) billingEmail?: string;
  @Field({ nullable: true }) billingAddress?: string;
}

@InputType() class UpdateSubscriptionInput {
  @Field({ nullable: true }) subscriptionTier?: string;
  @Field({ nullable: true }) subscriptionStatus?: string;
  @Field({ nullable: true }) stripeCustomerId?: string;
}

@Resolver()
export class OrganizationsResolver {
  constructor(private readonly organizations: OrganizationsService) {}

  // ── Queries ─────────────────────────────────────────────────────────

  @Roles('org_admin', 'super_admin')
  @Query(() => OrganizationResult, { name: 'organization', nullable: true })
  async organization(
    @Args('organizationId', { type: () => ID }) organizationId: string,
  ): Promise<any> {
    return this.organizations.findById(organizationId);
  }

  @Roles('org_admin', 'super_admin')
  @Query(() => OrganizationResult, { name: 'myOrganization', nullable: true })
  async myOrganization(
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    if (!user.organizationId) return null;
    return this.organizations.findById(user.organizationId);
  }

  @Roles('super_admin')
  @Query(() => [OrganizationListItem], { name: 'organizations' })
  async organizations(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 }) limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<any[]> {
    return this.organizations.findAll(limit, offset);
  }

  // ── Mutations ───────────────────────────────────────────────────────

  @Roles('super_admin')
  @Mutation(() => OrganizationResult, { name: 'createOrganization' })
  async createOrganization(
    @Args('input') input: CreateOrganizationInput,
  ): Promise<any> {
    return this.organizations.create(input);
  }

  @Roles('org_admin', 'super_admin')
  @Mutation(() => OrganizationResult, { name: 'updateOrganization' })
  async updateOrganization(
    @Args('organizationId', { type: () => ID }) organizationId: string,
    @Args('input') input: UpdateOrganizationInput,
  ): Promise<any> {
    return this.organizations.update(organizationId, input);
  }

  @Roles('super_admin')
  @Mutation(() => OrganizationResult, { name: 'updateSubscription' })
  async updateSubscription(
    @Args('organizationId', { type: () => ID }) organizationId: string,
    @Args('input') input: UpdateSubscriptionInput,
  ): Promise<any> {
    return this.organizations.updateSubscription(organizationId, input);
  }

  @Roles('super_admin')
  @Mutation(() => Boolean, { name: 'deleteOrganization' })
  async deleteOrganization(
    @Args('organizationId', { type: () => ID }) organizationId: string,
  ): Promise<boolean> {
    return this.organizations.softDelete(organizationId);
  }
}
