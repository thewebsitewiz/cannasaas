import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Entity('orders')
@Index(['dispensaryId', 'createdAt'])
@Index(['customerUserId', 'createdAt'])
export class Order {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid') orderId!: string;
  @Field() @Index() @Column('uuid') dispensaryId!: string;
  @Field({ nullable: true }) @Index() @Column('uuid', { nullable: true }) customerUserId?: string;
  @Field({ nullable: true }) @Column('uuid', { nullable: true }) staffUserId?: string;
  @Field() @Column({ default: 'pickup' }) orderType!: string;
  @Field() @Column({ default: 'draft' }) orderStatus!: string;
  @Field() @Column('numeric', { precision: 10, scale: 2, default: 0 }) subtotal!: number;
  @Field() @Column('numeric', { precision: 10, scale: 2, default: 0 }) discountTotal!: number;
  @Field() @Column('numeric', { precision: 10, scale: 2, default: 0 }) taxTotal!: number;
  @Field() @Column('numeric', { precision: 10, scale: 2, default: 0 }) total!: number;
  @Column('jsonb', { nullable: true }) taxBreakdown?: Record<string, unknown>;
  @Column('jsonb', { nullable: true }) appliedPromotions?: Record<string, unknown>[];
  @Field({ nullable: true }) @Column({ nullable: true, length: 100 }) metrcReceiptId?: string;
  @Field({ nullable: true }) @Column({ type: 'timestamptz', nullable: true }) metrcReportedAt?: Date;
  @Field({ nullable: true }) @Column({ nullable: true, default: 'pending' }) metrcSyncStatus?: string;
  @Field({ nullable: true }) @Column({ nullable: true, default: 'cash', name: 'payment_method' }) paymentMethod?: string;
  @Field() @Column('numeric', { precision: 10, scale: 2, default: 0, name: 'cash_discount_applied' }) cashDiscountApplied!: number;
  @Column('jsonb', { nullable: true }) fulfillmentAddress?: Record<string, unknown>;
  @Field({ nullable: true }) @Column({ type: 'timestamptz', nullable: true }) scheduledPickupAt?: Date;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) notes?: string;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) cancellationReason?: string;
  @Field({ nullable: true }) @Column({ type: 'timestamptz', nullable: true }) cancelledAt?: Date;
  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @Field(() => Date) @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
}
