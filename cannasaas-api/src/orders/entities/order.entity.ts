import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Dispensary } from '../../dispensaries/entities/dispensary.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatusHistory } from './order-status-history.entity';
import { User } from '../../users/entities/user.entity';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum FulfillmentType {
  PICKUP = 'pickup',
  DELIVERY = 'delivery',
}

@Entity('orders')
@Index(['dispensaryId', 'createdAt'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_number', length: 20, unique: true })
  orderNumber!: string; // Human-readable: "ORD-20260210-001"

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'dispensary_id', type: 'uuid' })
  dispensaryId!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  // Pricing
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal!: number;

  @Column({
    name: 'tax_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  taxAmount!: number;

  @Column({
    name: 'excise_tax',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  exciseTax!: number; // Cannabis-specific excise tax

  @Column({
    name: 'discount_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  discountAmount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total!: number;

  // Status
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus!: PaymentStatus;

  @Column({
    name: 'fulfillment_type',
    type: 'enum',
    enum: FulfillmentType,
  })
  fulfillmentType!: FulfillmentType;

  // Customer info (snapshot at time of order)
  @Column({ name: 'customer_name', length: 255 })
  customerName!: string;

  @Column({ name: 'customer_email', length: 255 })
  customerEmail!: string;

  @Column({ name: 'customer_phone', length: 20, nullable: true })
  customerPhone!: string;

  // Delivery address (if delivery)
  @Column({ name: 'delivery_address', type: 'text', nullable: true })
  deliveryAddress!: string;

  // Notes
  @Column({ type: 'text', nullable: true })
  notes!: string;

  @Column({ name: 'internal_notes', type: 'text', nullable: true })
  internalNotes!: string;

  // Timestamps
  @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
  confirmedAt!: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt!: Date;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt!: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Dispensary)
  @JoinColumn({ name: 'dispensary_id' })
  dispensary!: Dispensary;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items!: OrderItem[];

  @OneToMany(() => OrderStatusHistory, (history) => history.order, {
    cascade: true,
  })
  statusHistory!: OrderStatusHistory[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
