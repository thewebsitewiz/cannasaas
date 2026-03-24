import { Resolver, Query, Mutation, Args, ID, Int, Float } from '@nestjs/graphql';
import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { CustomerService } from './customer.service';
import { SegmentationService } from './segmentation.service';
import { CustomerProfile, CustomerAddress, AgeVerification } from './entities/customer.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ObjectType() class AgeVerifyResult {
  @Field() verified!: boolean;
  @Field(() => Int) age!: number;
  @Field({ nullable: true }) reason?: string;
}

@ObjectType() class OrderHistoryResult {
  @Field(() => Int) total!: number;
  @Field(() => [CustomerOrderSummary]) orders!: CustomerOrderSummary[];
}

@ObjectType() class CustomerOrderSummary {
  @Field(() => ID) orderId!: string;
  @Field({ nullable: true }) dispensaryName?: string;
  @Field() orderType!: string;
  @Field() orderStatus!: string;
  @Field(() => Float) subtotal!: number;
  @Field(() => Float) total!: number;
  @Field(() => Int, { nullable: true }) itemCount?: number;
  @Field(() => Date) createdAt!: Date;
}

@ObjectType() class CustomerSegment {
  @Field() name!: string;
  @Field() description!: string;
  @Field(() => Int) count!: number;
}

@ObjectType() class SegmentMember {
  @Field(() => ID) user_id!: string;
  @Field({ nullable: true }) first_name?: string;
  @Field({ nullable: true }) last_name?: string;
  @Field({ nullable: true }) email?: string;
  @Field(() => Float, { nullable: true }) total_spent?: number;
  @Field(() => Int, { nullable: true }) total_orders?: number;
}

@ObjectType() class SegmentStatsResult {
  @Field(() => Int) totalCustomers!: number;
  @Field(() => [CustomerSegment]) segments!: CustomerSegment[];
}

@ObjectType() class PurchaseLimitResult {
  @Field() allowed!: boolean;
  @Field(() => Float, { nullable: true }) limit?: number;
  @Field(() => Float, { nullable: true }) remaining?: number;
  @Field({ nullable: true }) reason?: string;
}

@InputType() class AddAddressInput {
  @Field({ nullable: true }) label?: string;
  @Field() addressLine1!: string;
  @Field({ nullable: true }) addressLine2?: string;
  @Field() city!: string;
  @Field() state!: string;
  @Field() zip!: string;
  @Field(() => Float, { nullable: true }) latitude?: number;
  @Field(() => Float, { nullable: true }) longitude?: number;
  @Field({ nullable: true }) isDefault?: boolean;
  @Field({ nullable: true }) deliveryInstructions?: string;
}

@Resolver()
export class CustomerResolver {
  constructor(
    private readonly customers: CustomerService,
    private readonly segmentation: SegmentationService,
  ) {}

  // ── Profile ───────────────────────────────────────────────────────────────

  @Roles('customer', 'dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => CustomerProfile, { name: 'myProfile', nullable: true })
  async myProfile(@CurrentUser() user: JwtPayload): Promise<any> {
    return this.customers.getProfile(user.sub);
  }

  @Roles('customer')
  @Mutation(() => CustomerProfile, { name: 'createCustomerProfile' })
  async createProfile(
    @Args('phone', { nullable: true }) phone: string,
    @Args('dateOfBirth', { nullable: true }) dateOfBirth: string,
    @Args('preferredDispensaryId', { type: () => ID, nullable: true }) preferredDispensaryId: string,
    @Args('marketingOptIn', { nullable: true }) marketingOptIn: boolean,
    @Args('smsOptIn', { nullable: true }) smsOptIn: boolean,
    @CurrentUser() user: JwtPayload,
  ): Promise<CustomerProfile> {
    return this.customers.createCustomerProfile(user.sub, { phone, dateOfBirth, preferredDispensaryId, marketingOptIn, smsOptIn });
  }

  @Roles('customer')
  @Mutation(() => CustomerProfile, { name: 'updateCustomerProfile' })
  async updateProfile(
    @Args('phone', { nullable: true }) phone: string,
    @Args('firstName', { nullable: true }) firstName: string,
    @Args('lastName', { nullable: true }) lastName: string,
    @Args('preferredDispensaryId', { type: () => ID, nullable: true }) preferredDispensaryId: string,
    @Args('marketingOptIn', { nullable: true }) marketingOptIn: boolean,
    @Args('smsOptIn', { nullable: true }) smsOptIn: boolean,
    @CurrentUser() user: JwtPayload,
  ): Promise<CustomerProfile> {
    return this.customers.updateProfile(user.sub, { phone, firstName, lastName, preferredDispensaryId, marketingOptIn, smsOptIn });
  }

  // ── Age Verification ──────────────────────────────────────────────────────

  @Roles('customer', 'budtender', 'dispensary_admin')
  @Mutation(() => AgeVerifyResult, { name: 'verifyAge' })
  async verifyAge(
    @Args('dateOfBirth') dateOfBirth: string,
    @Args('idType') idType: string,
    @Args('idState', { nullable: true }) idState: string,
    @Args('idNumberLast4', { nullable: true }) idNumberLast4: string,
    @Args('idExpiration', { nullable: true }) idExpiration: string,
    @Args('dispensaryId', { type: () => ID, nullable: true }) dispensaryId: string,
    @Args('method', { nullable: true, defaultValue: 'self_declared' }) method: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ verified: boolean; age: number; reason?: string }> {
    return this.customers.verifyAge(user.sub, { dateOfBirth, idType, idState, idNumberLast4, idExpiration, dispensaryId, method });
  }

  @Roles('customer', 'dispensary_admin')
  @Query(() => [AgeVerification], { name: 'verificationHistory' })
  async verificationHistory(@CurrentUser() user: JwtPayload): Promise<AgeVerification[]> {
    return this.customers.getVerificationHistory(user.sub);
  }

  // ── Addresses ─────────────────────────────────────────────────────────────

  @Roles('customer')
  @Query(() => [CustomerAddress], { name: 'myAddresses' })
  async myAddresses(@CurrentUser() user: JwtPayload): Promise<CustomerAddress[]> {
    return this.customers.getAddresses(user.sub);
  }

  @Roles('customer')
  @Mutation(() => CustomerAddress, { name: 'addAddress' })
  async addAddress(
    @Args('input') input: AddAddressInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<CustomerAddress> {
    return this.customers.addAddress(user.sub, input);
  }

  @Roles('customer')
  @Mutation(() => CustomerAddress, { name: 'updateAddress' })
  async updateAddress(
    @Args('addressId', { type: () => ID }) addressId: string,
    @Args('input') input: AddAddressInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<CustomerAddress> {
    return this.customers.updateAddress(addressId, user.sub, input);
  }

  @Roles('customer')
  @Mutation(() => Boolean, { name: 'deleteAddress' })
  async deleteAddress(
    @Args('addressId', { type: () => ID }) addressId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    return this.customers.deleteAddress(addressId, user.sub);
  }

  // ── Order History ─────────────────────────────────────────────────────────

  @Roles('customer')
  @Query(() => OrderHistoryResult, { name: 'myOrders' })
  async myOrders(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) rawLimit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    const limit = Math.min(rawLimit, 100);
    const { orders, total } = await this.customers.getOrderHistory(user.sub, limit, offset);
    return {
      total,
      orders: orders.map((o: any) => ({
        orderId: o.orderId,
        dispensaryName: o.dispensary_name,
        orderType: o.orderType,
        orderStatus: o.orderStatus,
        subtotal: parseFloat(o.subtotal),
        total: parseFloat(o.total),
        itemCount: parseInt(o.item_count, 10),
        createdAt: o.createdAt,
      })),
    };
  }

  // ── Purchase Limits ───────────────────────────────────────────────────────

  @Roles('customer', 'budtender', 'dispensary_admin')
  @Query(() => PurchaseLimitResult, { name: 'checkPurchaseLimit' })
  async checkLimit(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('productCategory') productCategory: string,
    @Args('quantityGrams', { type: () => Float }) quantityGrams: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    return this.customers.checkPurchaseLimit(user.sub, dispensaryId, productCategory, quantityGrams);
  }

  // ── Admin: Customer List ──────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [CustomerProfile], { name: 'customers' })
  async customerList(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 }) rawLimit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<any[]> {
    const limit = Math.min(rawLimit, 100);
    return this.customers.getCustomers(dispensaryId, limit, offset);
  }

  // ── Segmentation ───────────────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [CustomerSegment], { name: 'customerSegments' })
  async customerSegments(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
  ): Promise<any[]> {
    return this.segmentation.getSegments(dispensaryId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [SegmentMember], { name: 'customerSegmentMembers' })
  async segmentMembers(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('segmentName') segmentName: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 }) rawLimit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<any[]> {
    return this.segmentation.getSegmentMembers(dispensaryId, segmentName, Math.min(rawLimit, 100), offset);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => SegmentStatsResult, { name: 'customerSegmentStats' })
  async segmentStats(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
  ): Promise<any> {
    return this.segmentation.getSegmentStats(dispensaryId);
  }
}
