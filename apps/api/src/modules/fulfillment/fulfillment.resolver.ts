import { Resolver, Query, Mutation, Args, ID, Float } from '@nestjs/graphql';
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';
import { FulfillmentService, DeliveryEligibility as DE, AvailableSlot as AS } from './fulfillment.service';
import { DeliveryZone } from './entities/delivery-zone.entity';
import { OrderTracking } from './entities/order-tracking.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ObjectType()
class DeliveryZoneMatch {
  @Field() zoneId!: string;
  @Field() name!: string;
  @Field(() => Float) deliveryFee!: number;
  @Field(() => Int) estimatedMinutesMin!: number;
  @Field(() => Int) estimatedMinutesMax!: number;
}

@ObjectType()
class DeliveryEligibilityResult {
  @Field() eligible!: boolean;
  @Field(() => Float, { nullable: true }) distance?: number;
  @Field(() => DeliveryZoneMatch, { nullable: true }) zone?: DeliveryZoneMatch;
  @Field({ nullable: true }) reason?: string;
}

@ObjectType()
class AvailableSlotResult {
  @Field() slotId!: string;
  @Field() startTime!: string;
  @Field() endTime!: string;
  @Field(() => Int) spotsRemaining!: number;
}

@Resolver()
export class FulfillmentResolver {
  constructor(private readonly fulfillment: FulfillmentService) {}

  // ── Public: Check delivery eligibility ──────────────────────────────────

  @Public()
  @Query(() => DeliveryEligibilityResult, { name: 'checkDeliveryEligibility' })
  async checkEligibility(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('latitude', { type: () => Float }) latitude: number,
    @Args('longitude', { type: () => Float }) longitude: number,
    @Args('orderSubtotal', { type: () => Float, nullable: true }) orderSubtotal?: number,
  ): Promise<DE> {
    return this.fulfillment.checkDeliveryEligibility(dispensaryId, latitude, longitude, orderSubtotal);
  }

  // ── Public: Get delivery zones ─────────────────────────────────────────

  @Public()
  @Query(() => [DeliveryZone], { name: 'deliveryZones' })
  async zones(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
  ): Promise<DeliveryZone[]> {
    return this.fulfillment.getZones(dispensaryId);
  }

  // ── Public: Get available time slots ───────────────────────────────────

  @Public()
  @Query(() => [AvailableSlotResult], { name: 'availableTimeSlots' })
  async availableSlots(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('slotType') slotType: string,
    @Args('date') date: string,
  ): Promise<AS[]> {
    return this.fulfillment.getAvailableSlots(dispensaryId, slotType as any, date);
  }

  // ── Staff/Admin: Update fulfillment status ─────────────────────────────

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => OrderTracking, { name: 'updateFulfillmentStatus' })
  async updateStatus(
    @Args('orderId', { type: () => ID }) orderId: string,
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('status') status: string,
    @Args('notes', { nullable: true }) notes: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<OrderTracking> {
    if (user.role === 'dispensary_admin' && dispensaryId !== user.dispensaryId) {
      throw new ForbiddenException('Access denied');
    }
    return this.fulfillment.updateFulfillmentStatus(orderId, dispensaryId, status, user.sub, { notes });
  }

  // ── Auth: Get order tracking history ───────────────────────────────────

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [OrderTracking], { name: 'orderTracking' })
  async tracking(
    @Args('orderId', { type: () => ID }) orderId: string,
  ): Promise<OrderTracking[]> {
    return this.fulfillment.getOrderTracking(orderId);
  }
}
