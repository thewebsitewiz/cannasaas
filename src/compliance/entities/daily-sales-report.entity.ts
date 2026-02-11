import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Dispensary } from '../../dispensaries/entities/dispensary.entity';

@Entity('daily_sales_reports')
@Index(['dispensaryId', 'reportDate'], { unique: true })
export class DailySalesReport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'dispensary_id', type: 'uuid' })
  dispensaryId!: string;

  @Column({ name: 'report_date', type: 'date' })
  reportDate!: string; // YYYY-MM-DD

  @Column({ name: 'total_orders', type: 'int', default: 0 })
  totalOrders!: number;

  @Column({
    name: 'total_revenue',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalRevenue!: number;

  @Column({
    name: 'total_tax',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalTax!: number;

  @Column({
    name: 'total_excise_tax',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalExciseTax!: number;

  @Column({ name: 'total_items_sold', type: 'int', default: 0 })
  totalItemsSold!: number;

  @Column({
    name: 'average_order_value',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  averageOrderValue!: number;

  @Column({ name: 'unique_customers', type: 'int', default: 0 })
  uniqueCustomers!: number;

  // Breakdown by product type (JSONB)
  @Column({ name: 'sales_by_type', type: 'jsonb', nullable: true })
  salesByType!: Record<string, { count: number; revenue: number }>;

  // Breakdown by category
  @Column({ name: 'sales_by_category', type: 'jsonb', nullable: true })
  salesByCategory!: Record<string, { count: number; revenue: number }>;

  @Column({ name: 'cancelled_orders', type: 'int', default: 0 })
  cancelledOrders!: number;

  @Column({
    name: 'refunded_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  refundedAmount!: number;

  @ManyToOne(() => Dispensary)
  @JoinColumn({ name: 'dispensary_id' })
  dispensary!: Dispensary;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
