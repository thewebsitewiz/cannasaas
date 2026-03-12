import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';

@ObjectType()
@Entity('delivery_zones')
export class DeliveryZone {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'zone_id' }) zoneId!: string;
  @Field(() => ID, { name: 'dispensaryId' }) @Index() @Column({ type: 'uuid', name: 'dispensary_id' }) dispensary_id!: string;
  @Field() @Column({ length: 100 }) name!: string;
  @Field(() => Float, { name: 'radiusMiles' }) @Column({ type: 'decimal', precision: 6, scale: 2, default: 5.0 }) radius_miles!: number;
  @Field(() => Float, { name: 'deliveryFee' }) @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 }) delivery_fee!: number;
  @Field(() => Float, { name: 'minOrderAmount', nullable: true }) @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true }) min_order_amount?: number;
  @Field(() => Float, { name: 'freeDeliveryThreshold', nullable: true }) @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true }) free_delivery_threshold?: number;
  @Field(() => Int, { name: 'estimatedMinutesMin', nullable: true }) @Column({ nullable: true, default: 30 }) estimated_minutes_min?: number;
  @Field(() => Int, { name: 'estimatedMinutesMax', nullable: true }) @Column({ nullable: true, default: 60 }) estimated_minutes_max?: number;
  @Field({ name: 'isActive' }) @Column({ default: true }) is_active!: boolean;
  @Field(() => Int, { name: 'sortOrder', nullable: true }) @Column({ nullable: true, default: 0 }) sort_order?: number;
  @Field(() => Date, { name: 'createdAt' }) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
  @Field(() => Date, { name: 'updatedAt' }) @UpdateDateColumn({ type: 'timestamptz' }) updated_at!: Date;
}
