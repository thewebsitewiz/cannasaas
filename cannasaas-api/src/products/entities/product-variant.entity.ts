import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Product } from './product.entity';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Column({ length: 100 })
  name!: string; // e.g., "3.5g", "1/8 oz", "100mg pack"

  @Column({ length: 50, nullable: true })
  sku!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({
    name: 'compare_at_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  compareAtPrice!: number; // Original price for showing discounts

  @Column({ type: 'int', default: 0 })
  quantity!: number; // Current stock

  @Column({ name: 'low_stock_threshold', type: 'int', default: 5 })
  lowStockThreshold!: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  weight!: number; // in grams

  @Column({ name: 'weight_unit', length: 10, default: 'g' })
  weightUnit!: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @ManyToOne(() => Product, (product) => product.variants)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
