import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order, OrderStatus } from './order.entity';

@Entity('order_status_history')
export class OrderStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @Column({
    name: 'from_status',
    type: 'enum',
    enum: OrderStatus,
    nullable: true,
  })
  fromStatus!: OrderStatus;

  @Column({
    name: 'to_status',
    type: 'enum',
    enum: OrderStatus,
  })
  toStatus!: OrderStatus;

  @Column({ name: 'changed_by', type: 'uuid', nullable: true })
  changedBy!: string; // User ID who made the change

  @Column({ type: 'text', nullable: true })
  notes!: string;

  @ManyToOne(() => Order, (order) => order.statusHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
