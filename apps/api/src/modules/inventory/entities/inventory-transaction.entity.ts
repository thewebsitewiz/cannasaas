import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Entity('inventory_transactions')
@Index(['dispensaryId', 'createdAt'])
@Index(['inventoryId', 'createdAt'])
export class InventoryTransaction {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid', { name: 'transaction_id' })
  transactionId: string;

  @Field()
  @Index()
  @Column({ type: 'uuid', name: 'inventory_id' })
  inventoryId: string;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true, name: 'batch_id' })
  batchId: string;

  @Field()
  @Column({ type: 'uuid', name: 'dispensary_id' })
  dispensaryId: string;

  @Field()
  @Column({ type: 'varchar', name: 'transaction_type' })
  transactionType: string;

  @Field({ nullable: true })
  @Column({ type: 'smallint', nullable: true, name: 'adjustment_reason_id' })
  adjustmentReasonId: number;

  @Field()
  @Column({ type: 'numeric', precision: 12, scale: 4, name: 'quantity_delta' })
  quantityDelta: number;

  @Field()
  @Column({ type: 'numeric', precision: 12, scale: 4, name: 'quantity_before' })
  quantityBefore: number;

  @Field()
  @Column({ type: 'numeric', precision: 12, scale: 4, name: 'quantity_after' })
  quantityAfter: number;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true, name: 'reference_order_id' })
  referenceOrderId: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'reference_transfer_manifest_id' })
  referenceTransferManifestId: string;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true, name: 'performed_by_user_id' })
  performedByUserId: string;

  @Field()
  @Column({ type: 'boolean', default: false, name: 'metrc_synced' })
  metrcSynced: boolean;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true, name: 'metrc_synced_at' })
  metrcSyncedAt: Date;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Field()
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
