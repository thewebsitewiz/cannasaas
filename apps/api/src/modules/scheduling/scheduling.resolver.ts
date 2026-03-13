import { Resolver, Query, Mutation, Args, ID, Int, Float } from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { SchedulingService } from './scheduling.service';
import { ScheduledShift, ShiftSwapRequest, TimeOffRequest, DriverProfile, DeliveryTrip } from './entities/scheduling.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ObjectType() class DriverStats {
  @Field(() => Int) totalTrips!: number;
  @Field(() => Int) completed!: number;
  @Field(() => Float) avgDeliveryMinutes!: number;
  @Field(() => Float) avgDistance!: number;
  @Field(() => Float) avgRating!: number;
  @Field(() => Int) positiveRatings!: number;
  @Field(() => Float) totalMiles!: number;
}

@Resolver()
export class SchedulingResolver {
  constructor(private readonly scheduling: SchedulingService) {}

  // ── Shifts ────────────────────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [ScheduledShift], { name: 'weekSchedule' })
  async weekSchedule(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('weekStart') weekStart: string,
  ): Promise<any[]> {
    return this.scheduling.getWeekSchedule(dispensaryId, weekStart);
  }

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [ScheduledShift], { name: 'myShifts' })
  async myShifts(
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ScheduledShift[]> {
    const [profile] = await this.scheduling['ds'].query(
      `SELECT profile_id FROM employee_profiles WHERE user_id = $1`, [user.sub],
    );
    if (!profile) return [];
    return this.scheduling.getMyShifts(profile.profile_id, startDate, endDate);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => ScheduledShift, { name: 'createShift' })
  async createShift(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('profileId', { type: () => ID }) profileId: string,
    @Args('shiftDate') shiftDate: string,
    @Args('startTime') startTime: string,
    @Args('endTime') endTime: string,
    @Args('notes', { nullable: true }) notes: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ScheduledShift> {
    return this.scheduling.createShift({ dispensaryId, profileId, shiftDate, startTime, endTime, notes, createdByUserId: user.sub });
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => Boolean, { name: 'deleteShift' })
  async deleteShift(@Args('shiftId', { type: () => ID }) shiftId: string): Promise<boolean> {
    return this.scheduling.deleteShift(shiftId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => Int, { name: 'publishWeekSchedule' })
  async publishWeek(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('weekStart') weekStart: string,
  ): Promise<number> {
    return this.scheduling.publishWeek(dispensaryId, weekStart);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => Int, { name: 'autoGenerateSchedule' })
  async autoGenerate(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('weekStart') weekStart: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<number> {
    return this.scheduling.autoGenerateWeek(dispensaryId, weekStart, user.sub);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [ScheduledShift], { name: 'coverageGaps' })
  async coverageGaps(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('weekStart') weekStart: string,
  ): Promise<any[]> {
    return this.scheduling.getCoverageGaps(dispensaryId, weekStart);
  }

  // ── Shift Swaps ───────────────────────────────────────────────────────────

  @Roles('budtender', 'dispensary_admin')
  @Mutation(() => ShiftSwapRequest, { name: 'requestShiftSwap' })
  async requestSwap(
    @Args('shiftId', { type: () => ID }) shiftId: string,
    @Args('reason', { nullable: true }) reason: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ShiftSwapRequest> {
    const [profile] = await this.scheduling['ds'].query(
      `SELECT profile_id FROM employee_profiles WHERE user_id = $1`, [user.sub],
    );
    return this.scheduling.requestSwap(shiftId, profile.profile_id, reason);
  }

  @Roles('budtender', 'dispensary_admin')
  @Mutation(() => ShiftSwapRequest, { name: 'claimShiftSwap' })
  async claimSwap(
    @Args('swapId', { type: () => ID }) swapId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ShiftSwapRequest> {
    const [profile] = await this.scheduling['ds'].query(
      `SELECT profile_id FROM employee_profiles WHERE user_id = $1`, [user.sub],
    );
    return this.scheduling.claimSwap(swapId, profile.profile_id);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => ShiftSwapRequest, { name: 'approveShiftSwap' })
  async approveSwap(
    @Args('swapId', { type: () => ID }) swapId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ShiftSwapRequest> {
    return this.scheduling.approveSwap(swapId, user.sub);
  }

  // ── Time Off ──────────────────────────────────────────────────────────────

  @Roles('budtender', 'dispensary_admin')
  @Mutation(() => TimeOffRequest, { name: 'requestTimeOff' })
  async requestTimeOff(
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string,
    @Args('requestType', { defaultValue: 'pto' }) requestType: string,
    @Args('reason', { nullable: true }) reason: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<TimeOffRequest> {
    const [profile] = await this.scheduling['ds'].query(
      `SELECT profile_id FROM employee_profiles WHERE user_id = $1`, [user.sub],
    );
    return this.scheduling.requestTimeOff(profile.profile_id, user.dispensaryId || '', { startDate, endDate, requestType, reason });
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => TimeOffRequest, { name: 'reviewTimeOff' })
  async reviewTimeOff(
    @Args('requestId', { type: () => ID }) requestId: string,
    @Args('approved') approved: boolean,
    @CurrentUser() user: JwtPayload,
  ): Promise<TimeOffRequest> {
    return this.scheduling.reviewTimeOff(requestId, approved, user.sub);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [TimeOffRequest], { name: 'timeOffRequests' })
  async timeOffRequests(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('status', { nullable: true }) status: string,
  ): Promise<any[]> {
    return this.scheduling.getTimeOffRequests(dispensaryId, status);
  }

  // ── Drivers ───────────────────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [DriverProfile], { name: 'drivers' })
  async drivers(@Args('dispensaryId', { type: () => ID }) dispensaryId: string): Promise<any[]> {
    return this.scheduling.getDrivers(dispensaryId);
  }

  @Roles('budtender', 'dispensary_admin')
  @Mutation(() => DriverProfile, { name: 'updateDriverStatus' })
  async updateDriverStatus(
    @Args('driverId', { type: () => ID }) driverId: string,
    @Args('status') status: string,
    @Args('latitude', { type: () => Float, nullable: true }) lat: number,
    @Args('longitude', { type: () => Float, nullable: true }) lng: number,
  ): Promise<DriverProfile> {
    return this.scheduling.updateDriverStatus(driverId, status, lat, lng);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => DeliveryTrip, { name: 'assignDelivery' })
  async assignDelivery(
    @Args('driverId', { type: () => ID }) driverId: string,
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('deliveryAddress') deliveryAddress: string,
    @Args('orderId', { type: () => ID, nullable: true }) orderId: string,
    @Args('distanceMiles', { type: () => Float, nullable: true }) distanceMiles: number,
    @Args('estimatedMinutes', { type: () => Int, nullable: true }) estimatedMinutes: number,
  ): Promise<DeliveryTrip> {
    return this.scheduling.assignDelivery(driverId, dispensaryId, { orderId, deliveryAddress, distanceMiles, estimatedMinutes });
  }

  @Roles('budtender', 'dispensary_admin')
  @Mutation(() => DeliveryTrip, { name: 'completeDeliveryTrip' })
  async completeTrip(
    @Args('tripId', { type: () => ID }) tripId: string,
    @Args('customerRating', { type: () => Int, nullable: true }) rating: number,
  ): Promise<DeliveryTrip> {
    return this.scheduling.completeTrip(tripId, rating);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [DeliveryTrip], { name: 'driverTrips' })
  async driverTrips(
    @Args('driverId', { type: () => ID }) driverId: string,
    @Args('days', { type: () => Int, nullable: true, defaultValue: 7 }) days: number,
  ): Promise<DeliveryTrip[]> {
    return this.scheduling.getDriverTrips(driverId, days);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => DriverStats, { name: 'driverStats' })
  async driverStats(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('days', { type: () => Int, nullable: true, defaultValue: 30 }) days: number,
  ): Promise<any> {
    return this.scheduling.getDriverStats(dispensaryId, days);
  }
}
