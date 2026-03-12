import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
@Entity('order_tracking')
export class OrderTracking {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'tracking_id' }) trackingId!: string;
  @Field(() => ID, { name: 'orderId' }) @Index() @Column({ type: 'uuid', name: 'order_id' }) order_id!: string;
  @Field() @Column({ length: 50 }) status!: string;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) notes?: string;
  @Field(() => ID, { name: 'updatedByUserId', nullable: true }) @Column({ type: 'uuid', nullable: true, name: 'updated_by_user_id' }) updated_by_user_id?: string;
  @Field(() => Float, { nullable: true }) @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true }) latitude?: number;
  @Field(() => Float, { nullable: true }) @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true }) longitude?: number;
  @Field(() => Date, { name: 'createdAt' }) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
}
