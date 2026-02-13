// cannasaas-api/src/modules/promotions/entities/promotion.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn } from 'typeorm';

export enum PromotionType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  BUY_X_GET_Y = 'buy_x_get_y',
  FREE_SHIPPING = 'free_shipping',
}

@Entity('promotions')
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  organizationId: string;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'enum', enum: PromotionType })
  type: PromotionType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  value: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minimumOrderValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maximumDiscount: number;

  @Column({ type: 'jsonb', nullable: true })
  conditions: {
    productIds?: string[];
    categoryIds?: string[];
    buyQuantity?: number;
    getQuantity?: number;
    firstTimeOnly?: boolean;
    minItems?: number;
  };

  @Column({ type: 'int', nullable: true })
  usageLimit: number;

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @Column({ type: 'int', default: 1 })
  perCustomerLimit: number;

  @Column({ type: 'timestamp' })
  startsAt: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
