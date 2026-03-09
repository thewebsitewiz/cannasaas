import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Entity('inventory')
@Index(['dispensaryId', 'variantId'], { unique: true })
@Index(['dispensaryId'])
export class Inventory {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid', { name: 'inventory_id' })
  inventoryId: string;

  @Field()
  @Index()
  @Column({ type: 'uuid', name: 'variant_id' })
  variantId: string;

  @Field()
  @Column({ type: 'uuid', name: 'dispensary_id' })
  dispensaryId: string;

  @Field()
  @Column({ type: 'numeric', precision: 12, scale: 4, default: 0, name: 'quantity_on_hand' })
  quantityOnHand: number;

  @Field()
  @Column({ type: 'numeric', precision: 12, scale: 4, default: 0, name: 'quantity_reserved' })
  quantityReserved: number;

  @Field()
  @Column({ type: 'numeric', precision: 12, scale: 4, default: 0, name: 'quantity_available' })
  quantityAvailable: number;

  @Field({ nullable: true })
  @Column({ type: 'numeric', precision: 12, scale: 4, nullable: true, name: 'reorder_threshold' })
  reorderThreshold: number;

  @Field({ nullable: true })
  @Column({ type: 'numeric', precision: 12, scale: 4, nullable: true, name: 'reorder_quantity' })
  reorderQuantity: number;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 200, nullable: true, name: 'location_in_store' })
  locationInStore: string;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true, name: 'last_metrc_sync_at' })
  lastMetrcSyncAt: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true, name: 'last_reconciled_at' })
  lastReconciledAt: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true, name: 'last_count_at' })
  lastCountAt: Date;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true, name: 'last_count_by_user_id' })
  lastCountByUserId: string;

  @Field()
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
