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

export enum ComplianceEventType {
  SALE = 'sale',
  RETURN = 'return',
  INVENTORY_ADJUSTMENT = 'inventory_adjustment',
  INVENTORY_RECEIVED = 'inventory_received',
  INVENTORY_DESTROYED = 'inventory_destroyed',
  PRODUCT_RECALL = 'product_recall',
  ID_VERIFICATION = 'id_verification',
  PURCHASE_LIMIT_CHECK = 'purchase_limit_check',
}

@Entity('compliance_logs')
@Index(['dispensaryId', 'createdAt'])
@Index(['eventType', 'createdAt'])
export class ComplianceLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'dispensary_id', type: 'uuid' })
  dispensaryId!: string;

  @Column({
    name: 'event_type',
    type: 'enum',
    enum: ComplianceEventType,
  })
  eventType!: ComplianceEventType;

  @Column({ type: 'jsonb' })
  details!: Record<string, any>;
  // For SALE: { orderId, items: [{productName, quantity, batchNumber, licenseNumber}], total }
  // For INVENTORY_ADJUSTMENT: { variantId, oldQuantity, newQuantity, reason }
  // For ID_VERIFICATION: { customerId, verificationType, verified }
  // For PURCHASE_LIMIT_CHECK: { customerId, dailyTotal, withinLimit }

  @Column({ name: 'performed_by', type: 'uuid', nullable: true })
  performedBy!: string;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId!: string;

  @ManyToOne(() => Dispensary)
  @JoinColumn({ name: 'dispensary_id' })
  dispensary!: Dispensary;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
