import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';

@ObjectType()
@Entity('shift_templates')
export class ShiftTemplate {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'template_id' }) templateId!: string;
  @Field(() => ID, { name: 'dispensaryId' }) @Index() @Column('uuid', { name: 'dispensary_id' }) dispensary_id!: string;
  @Field() @Column({ length: 100 }) name!: string;
  @Field(() => Int, { name: 'dayOfWeek' }) @Column({ name: 'day_of_week' }) day_of_week!: number;
  @Field({ name: 'startTime' }) @Column({ type: 'time', name: 'start_time' }) start_time!: string;
  @Field({ name: 'endTime' }) @Column({ type: 'time', name: 'end_time' }) end_time!: string;
  @Field(() => Int, { name: 'positionId', nullable: true }) @Column({ nullable: true, name: 'position_id' }) position_id?: number;
  @Field(() => Int, { name: 'minStaff' }) @Column({ default: 1, name: 'min_staff' }) min_staff!: number;
  @Field(() => Int, { name: 'maxStaff' }) @Column({ default: 3, name: 'max_staff' }) max_staff!: number;
  @Field({ name: 'isActive' }) @Column({ default: true, name: 'is_active' }) is_active!: boolean;
}

@ObjectType()
@Entity('scheduled_shifts')
export class ScheduledShift {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'shift_id' }) shiftId!: string;
  @Field(() => ID, { name: 'dispensaryId' }) @Index() @Column('uuid', { name: 'dispensary_id' }) dispensary_id!: string;
  @Field(() => ID, { name: 'profileId' }) @Index() @Column('uuid', { name: 'profile_id' }) profile_id!: string;
  @Field(() => ID, { name: 'templateId', nullable: true }) @Column('uuid', { nullable: true, name: 'template_id' }) template_id?: string;
  @Field({ name: 'shiftDate' }) @Column({ type: 'date', name: 'shift_date' }) shift_date!: string;
  @Field({ name: 'startTime' }) @Column({ type: 'time', name: 'start_time' }) start_time!: string;
  @Field({ name: 'endTime' }) @Column({ type: 'time', name: 'end_time' }) end_time!: string;
  @Field() @Column({ length: 20, default: 'scheduled' }) status!: string;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) notes?: string;
  @Field() @Column({ default: false }) published!: boolean;
  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
  @Field(() => Date) @UpdateDateColumn({ type: 'timestamptz' }) updated_at!: Date;
}

@ObjectType()
@Entity('shift_swap_requests')
export class ShiftSwapRequest {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'swap_id' }) swapId!: string;
  @Field(() => ID, { name: 'originalShiftId' }) @Column('uuid', { name: 'original_shift_id' }) original_shift_id!: string;
  @Field(() => ID, { name: 'requestingProfileId' }) @Column('uuid', { name: 'requesting_profile_id' }) requesting_profile_id!: string;
  @Field(() => ID, { name: 'coveringProfileId', nullable: true }) @Column('uuid', { nullable: true, name: 'covering_profile_id' }) covering_profile_id?: string;
  @Field() @Column({ length: 20, default: 'open' }) status!: string;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) reason?: string;
  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
}

@ObjectType()
@Entity('time_off_requests')
export class TimeOffRequest {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'request_id' }) requestId!: string;
  @Field(() => ID, { name: 'profileId' }) @Column('uuid', { name: 'profile_id' }) profile_id!: string;
  @Field(() => ID, { name: 'dispensaryId' }) @Column('uuid', { name: 'dispensary_id' }) dispensary_id!: string;
  @Field({ name: 'startDate' }) @Column({ type: 'date', name: 'start_date' }) start_date!: string;
  @Field({ name: 'endDate' }) @Column({ type: 'date', name: 'end_date' }) end_date!: string;
  @Field({ name: 'requestType' }) @Column({ length: 20, default: 'pto', name: 'request_type' }) request_type!: string;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) reason?: string;
  @Field() @Column({ length: 20, default: 'pending' }) status!: string;
  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
}

@ObjectType()
@Entity('driver_profiles')
export class DriverProfile {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'driver_id' }) driverId!: string;
  @Field(() => ID, { name: 'profileId' }) @Index({ unique: true }) @Column('uuid', { name: 'profile_id' }) profile_id!: string;
  @Field(() => ID, { name: 'dispensaryId' }) @Index() @Column('uuid', { name: 'dispensary_id' }) dispensary_id!: string;
  @Field({ name: 'vehicleMake', nullable: true }) @Column({ length: 50, nullable: true, name: 'vehicle_make' }) vehicle_make?: string;
  @Field({ name: 'vehicleModel', nullable: true }) @Column({ length: 50, nullable: true, name: 'vehicle_model' }) vehicle_model?: string;
  @Field(() => Int, { name: 'vehicleYear', nullable: true }) @Column({ nullable: true, name: 'vehicle_year' }) vehicle_year?: number;
  @Field({ name: 'vehicleColor', nullable: true }) @Column({ length: 30, nullable: true, name: 'vehicle_color' }) vehicle_color?: string;
  @Field({ name: 'licensePlate', nullable: true }) @Column({ length: 15, nullable: true, name: 'license_plate' }) license_plate?: string;
  @Field({ name: 'insuranceProvider', nullable: true }) @Column({ length: 100, nullable: true, name: 'insurance_provider' }) insurance_provider?: string;
  @Field({ name: 'insuranceExpiry', nullable: true }) @Column({ type: 'date', nullable: true, name: 'insurance_expiry' }) insurance_expiry?: string;
  @Field(() => Int, { name: 'maxDeliveriesPerHour' }) @Column({ default: 3, name: 'max_deliveries_per_hour' }) max_deliveries_per_hour!: number;
  @Field() @Column({ length: 20, default: 'available' }) status!: string;
  @Field(() => Float, { name: 'currentLatitude', nullable: true }) @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true, name: 'current_latitude' }) current_latitude?: number;
  @Field(() => Float, { name: 'currentLongitude', nullable: true }) @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true, name: 'current_longitude' }) current_longitude?: number;
  @Field(() => Date, { name: 'lastLocationUpdate', nullable: true }) @Column({ type: 'timestamptz', nullable: true, name: 'last_location_update' }) last_location_update?: Date;
  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
  @Field(() => Date) @UpdateDateColumn({ type: 'timestamptz' }) updated_at!: Date;
}

@ObjectType()
@Entity('delivery_trips')
export class DeliveryTrip {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'trip_id' }) tripId!: string;
  @Field(() => ID, { name: 'driverId' }) @Index() @Column('uuid', { name: 'driver_id' }) driver_id!: string;
  @Field(() => ID, { name: 'dispensaryId' }) @Column('uuid', { name: 'dispensary_id' }) dispensary_id!: string;
  @Field(() => ID, { name: 'orderId', nullable: true }) @Column('uuid', { nullable: true, name: 'order_id' }) order_id?: string;
  @Field() @Column({ length: 20, default: 'assigned' }) status!: string;
  @Field(() => Date, { name: 'departedAt', nullable: true }) @Column({ type: 'timestamptz', nullable: true, name: 'departed_at' }) departed_at?: Date;
  @Field(() => Date, { name: 'deliveredAt', nullable: true }) @Column({ type: 'timestamptz', nullable: true, name: 'delivered_at' }) delivered_at?: Date;
  @Field({ name: 'deliveryAddress', nullable: true }) @Column({ type: 'text', nullable: true, name: 'delivery_address' }) delivery_address?: string;
  @Field(() => Float, { name: 'distanceMiles', nullable: true }) @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true, name: 'distance_miles' }) distance_miles?: number;
  @Field(() => Int, { name: 'estimatedMinutes', nullable: true }) @Column({ nullable: true, name: 'estimated_minutes' }) estimated_minutes?: number;
  @Field(() => Int, { name: 'actualMinutes', nullable: true }) @Column({ nullable: true, name: 'actual_minutes' }) actual_minutes?: number;
  @Field(() => Int, { name: 'customerRating', nullable: true }) @Column({ nullable: true, name: 'customer_rating' }) customer_rating?: number;
  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
}
