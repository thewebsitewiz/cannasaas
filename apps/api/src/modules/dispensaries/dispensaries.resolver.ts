import { Resolver, Query, Mutation, Args, ID, Int, Float, InputType } from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { DispensariesService } from './dispensaries.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import GraphQLJSON from 'graphql-type-json';

@ObjectType() class DispensaryResult {
  @Field(() => ID) entityId!: string;
  @Field(() => ID) companyId!: string;
  @Field() type!: string;
  @Field() name!: string;
  @Field() slug!: string;
  @Field({ nullable: true }) licenseNumber?: string;
  @Field({ nullable: true }) licenseType?: string;
  @Field({ nullable: true }) addressLine1?: string;
  @Field({ nullable: true }) city?: string;
  @Field() state!: string;
  @Field({ nullable: true }) zip?: string;
  @Field(() => Float, { nullable: true }) latitude?: number;
  @Field(() => Float, { nullable: true }) longitude?: number;
  @Field({ nullable: true }) county?: string;
  @Field({ nullable: true }) municipality?: string;
  @Field({ nullable: true }) phone?: string;
  @Field({ nullable: true }) email?: string;
  @Field({ nullable: true }) website?: string;
  @Field() isActive!: boolean;
  @Field() isDeliveryEnabled!: boolean;
  @Field() isPickupEnabled!: boolean;
  @Field({ nullable: true }) metrcLicenseNumber?: string;
  @Field({ nullable: true }) timezone?: string;
  @Field(() => Float, { nullable: true }) cashDiscountPercent?: number;
  @Field({ nullable: true }) isCashEnabled?: boolean;
  @Field({ nullable: true }) cashDeliveryEnabled?: boolean;
  @Field(() => Date) createdAt!: Date;
  @Field(() => Date, { nullable: true }) updatedAt?: Date;
}

@ObjectType() class DispensaryListItem {
  @Field(() => ID) entityId!: string;
  @Field(() => ID) companyId!: string;
  @Field() type!: string;
  @Field() name!: string;
  @Field() slug!: string;
  @Field({ nullable: true }) licenseNumber?: string;
  @Field({ nullable: true }) city?: string;
  @Field({ nullable: true }) state?: string;
  @Field({ nullable: true }) zip?: string;
  @Field() isActive!: boolean;
  @Field() isDeliveryEnabled!: boolean;
  @Field() isPickupEnabled!: boolean;
  @Field(() => Date) createdAt!: Date;
}

@InputType() class UpdateDispensaryInput {
  @Field({ nullable: true }) name?: string;
  @Field({ nullable: true }) slug?: string;
  @Field({ nullable: true }) type?: string;
  @Field({ nullable: true }) licenseNumber?: string;
  @Field({ nullable: true }) licenseType?: string;
  @Field({ nullable: true }) addressLine1?: string;
  @Field({ nullable: true }) city?: string;
  @Field({ nullable: true }) state?: string;
  @Field({ nullable: true }) zip?: string;
  @Field(() => Float, { nullable: true }) latitude?: number;
  @Field(() => Float, { nullable: true }) longitude?: number;
  @Field({ nullable: true }) county?: string;
  @Field({ nullable: true }) municipality?: string;
  @Field({ nullable: true }) phone?: string;
  @Field({ nullable: true }) email?: string;
  @Field({ nullable: true }) website?: string;
  @Field({ nullable: true }) isActive?: boolean;
  @Field({ nullable: true }) isDeliveryEnabled?: boolean;
  @Field({ nullable: true }) isPickupEnabled?: boolean;
  @Field({ nullable: true }) metrcLicenseNumber?: string;
  @Field({ nullable: true }) timezone?: string;
}

@InputType() class CreateDispensaryInput {
  @Field(() => ID) companyId!: string;
  @Field() name!: string;
  @Field() slug!: string;
  @Field({ nullable: true }) type?: string;
  @Field() state!: string;
  @Field({ nullable: true }) licenseNumber?: string;
  @Field({ nullable: true }) licenseType?: string;
  @Field({ nullable: true }) addressLine1?: string;
  @Field({ nullable: true }) city?: string;
  @Field({ nullable: true }) zip?: string;
  @Field({ nullable: true }) phone?: string;
  @Field({ nullable: true }) email?: string;
  @Field({ nullable: true }) website?: string;
  @Field({ nullable: true }) timezone?: string;
}

@Resolver()
export class DispensariesResolver {
  constructor(private readonly dispensaries: DispensariesService) {}

  // ── Queries ─────────────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin', 'budtender')
  @Query(() => DispensaryResult, { name: 'dispensary', nullable: true })
  async dispensary(
    @Args('entityId', { type: () => ID }) entityId: string,
  ): Promise<any> {
    return this.dispensaries.findById(entityId);
  }

  @Roles('org_admin', 'super_admin')
  @Query(() => [DispensaryListItem], { name: 'dispensaries' })
  async dispensaries(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 }) limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<any[]> {
    return this.dispensaries.findAll(limit, offset);
  }

  @Roles('org_admin', 'super_admin')
  @Query(() => [DispensaryListItem], { name: 'dispensariesByCompany' })
  async dispensariesByCompany(
    @Args('companyId', { type: () => ID }) companyId: string,
  ): Promise<any[]> {
    return this.dispensaries.findByCompany(companyId);
  }

  // ── Mutations ───────────────────────────────────────────────────────

  @Roles('org_admin', 'super_admin')
  @Mutation(() => DispensaryResult, { name: 'createDispensary' })
  async createDispensary(
    @Args('input') input: CreateDispensaryInput,
  ): Promise<any> {
    return this.dispensaries.create(input);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => DispensaryResult, { name: 'updateDispensary' })
  async updateDispensary(
    @Args('entityId', { type: () => ID }) entityId: string,
    @Args('input') input: UpdateDispensaryInput,
  ): Promise<any> {
    return this.dispensaries.update(entityId, input);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => DispensaryResult, { name: 'updateOperatingHours' })
  async updateOperatingHours(
    @Args('entityId', { type: () => ID }) entityId: string,
    @Args('hours', { type: () => GraphQLJSON }) hours: any,
  ): Promise<any> {
    return this.dispensaries.updateOperatingHours(entityId, hours);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => DispensaryResult, { name: 'updateDeliverySettings' })
  async updateDeliverySettings(
    @Args('entityId', { type: () => ID }) entityId: string,
    @Args('isDeliveryEnabled', { nullable: true }) isDeliveryEnabled: boolean,
    @Args('cashDeliveryEnabled', { nullable: true }) cashDeliveryEnabled: boolean,
    @Args('cashDiscountPercent', { type: () => Float, nullable: true }) cashDiscountPercent: number,
  ): Promise<any> {
    return this.dispensaries.updateDeliverySettings(entityId, { isDeliveryEnabled, cashDeliveryEnabled, cashDiscountPercent });
  }

  @Roles('org_admin', 'super_admin')
  @Mutation(() => Boolean, { name: 'deleteDispensary' })
  async deleteDispensary(
    @Args('entityId', { type: () => ID }) entityId: string,
  ): Promise<boolean> {
    return this.dispensaries.softDelete(entityId);
  }
}
