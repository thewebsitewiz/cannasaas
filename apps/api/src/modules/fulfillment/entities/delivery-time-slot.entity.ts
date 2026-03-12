import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
@Entity('delivery_time_slots')
export class DeliveryTimeSlot {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'slot_id' }) slotId!: string;
  @Field(() => ID, { name: 'dispensaryId' }) @Index() @Column({ type: 'uuid', name: 'dispensary_id' }) dispensary_id!: string;
  @Field({ name: 'slotType' }) @Column({ length: 20, default: 'delivery' }) slot_type!: string;
  @Field(() => Int, { name: 'dayOfWeek' }) @Column({ name: 'day_of_week' }) day_of_week!: number;
  @Field({ name: 'startTime' }) @Column({ type: 'time', name: 'start_time' }) start_time!: string;
  @Field({ name: 'endTime' }) @Column({ type: 'time', name: 'end_time' }) end_time!: string;
  @Field(() => Int, { name: 'maxOrders', nullable: true }) @Column({ nullable: true, default: 10 }) max_orders?: number;
  @Field({ name: 'isActive' }) @Column({ default: true }) is_active!: boolean;
  @Field(() => Date, { name: 'createdAt' }) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
  @Field(() => Date, { name: 'updatedAt' }) @UpdateDateColumn({ type: 'timestamptz' }) updated_at!: Date;
}
