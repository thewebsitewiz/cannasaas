import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_status_history')
export class OrderStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @Column({ name: 'from_status', length: 30, nullable: true })
  fromStatus!: string;

  @Column({ name: 'to_status', length: 30 })
  toStatus!: string;

  @Column({ name: 'changed_by', type: 'uuid', nullable: true })
  changedBy!: string;

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
