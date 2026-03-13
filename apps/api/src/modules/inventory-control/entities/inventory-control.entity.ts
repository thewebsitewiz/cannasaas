import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Check } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

// ── Transfer ────────────────────────────────────────────────────────────────

@ObjectType()
@Entity('inventory_transfers')
export class InventoryTransfer {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'transfer_id' }) transferId!: string;
  @Field(() => ID, { name: 'organizationId' }) @Column('uuid', { name: 'organization_id' }) organization_id!: string;
  @Field(() => ID, { name: 'fromDispensaryId' }) @Index() @Column('uuid', { name: 'from_dispensary_id' }) from_dispensary_id!: string;
  @Field(() => ID, { name: 'toDispensaryId' }) @Index() @Column('uuid', { name: 'to_dispensary_id' }) to_dispensary_id!: string;
  @Field() @Column({ length: 20, default: 'requested' }) status!: string;
  @Field(() => ID, { name: 'requestedByUserId' }) @Column('uuid', { name: 'requested_by_user_id' }) requested_by_user_id!: string;
  @Field(() => ID, { name: 'approvedByUserId', nullable: true }) @Column('uuid', { nullable: true, name: 'approved_by_user_id' }) approved_by_user_id?: string;
  @Field(() => Date, { name: 'approvedAt', nullable: true }) @Column({ type: 'timestamptz', nullable: true, name: 'approved_at' }) approved_at?: Date;
  @Field(() => Date, { name: 'shippedAt', nullable: true }) @Column({ type: 'timestamptz', nullable: true, name: 'shipped_at' }) shipped_at?: Date;
  @Field(() => Date, { name: 'receivedAt', nullable: true }) @Column({ type: 'timestamptz', nullable: true, name: 'received_at' }) received_at?: Date;
  @Field({ name: 'metrcManifestId', nullable: true }) @Column({ length: 100, nullable: true, name: 'metrc_manifest_id' }) metrc_manifest_id?: string;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) notes?: string;
  @Field({ name: 'rejectionReason', nullable: true }) @Column({ type: 'text', nullable: true, name: 'rejection_reason' }) rejection_reason?: string;
  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
  @Field(() => Date) @UpdateDateColumn({ type: 'timestamptz' }) updated_at!: Date;
}

@ObjectType()
@Entity('inventory_transfer_items')
export class InventoryTransferItem {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'item_id' }) itemId!: string;
  @Field(() => ID, { name: 'transferId' }) @Index() @Column('uuid', { name: 'transfer_id' }) transfer_id!: string;
  @Field(() => ID, { name: 'variantId' }) @Column('uuid', { name: 'variant_id' }) variant_id!: string;
  @Field({ name: 'productName' }) @Column({ length: 255, name: 'product_name' }) product_name!: string;
  @Field({ name: 'variantName', nullable: true }) @Column({ length: 100, nullable: true, name: 'variant_name' }) variant_name?: string;
  @Field(() => Int, { name: 'quantityRequested' }) @Column({ name: 'quantity_requested' }) quantity_requested!: number;
  @Field(() => Int, { name: 'quantityShipped', nullable: true }) @Column({ nullable: true, name: 'quantity_shipped' }) quantity_shipped?: number;
  @Field(() => Int, { name: 'quantityReceived', nullable: true }) @Column({ nullable: true, name: 'quantity_received' }) quantity_received?: number;
  @Field({ name: 'metrcPackageTag', nullable: true }) @Column({ length: 100, nullable: true, name: 'metrc_package_tag' }) metrc_package_tag?: string;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) notes?: string;
}

// ── Counts ──────────────────────────────────────────────────────────────────

@ObjectType()
@Entity('inventory_counts')
export class InventoryCount {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'count_id' }) countId!: string;
  @Field(() => ID, { name: 'dispensaryId' }) @Index() @Column('uuid', { name: 'dispensary_id' }) dispensary_id!: string;
  @Field({ name: 'countType' }) @Column({ length: 20, default: 'cycle', name: 'count_type' }) count_type!: string;
  @Field() @Column({ length: 20, default: 'in_progress' }) status!: string;
  @Field(() => ID, { name: 'startedByUserId' }) @Column('uuid', { name: 'started_by_user_id' }) started_by_user_id!: string;
  @Field(() => ID, { name: 'completedByUserId', nullable: true }) @Column('uuid', { nullable: true, name: 'completed_by_user_id' }) completed_by_user_id?: string;
  @Field(() => Date, { name: 'startedAt' }) @Column({ type: 'timestamptz', name: 'started_at' }) started_at!: Date;
  @Field(() => Date, { name: 'completedAt', nullable: true }) @Column({ type: 'timestamptz', nullable: true, name: 'completed_at' }) completed_at?: Date;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) notes?: string;
  @Field(() => Int, { name: 'totalItems' }) @Column({ default: 0, name: 'total_items' }) total_items!: number;
  @Field(() => Int, { name: 'itemsCounted' }) @Column({ default: 0, name: 'items_counted' }) items_counted!: number;
  @Field(() => Int, { name: 'varianceCount' }) @Column({ default: 0, name: 'variance_count' }) variance_count!: number;
  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
  @Field(() => Date) @UpdateDateColumn({ type: 'timestamptz' }) updated_at!: Date;
}

@ObjectType()
@Entity('inventory_count_items')
export class InventoryCountItem {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'count_item_id' }) countItemId!: string;
  @Field(() => ID, { name: 'countId' }) @Index() @Column('uuid', { name: 'count_id' }) count_id!: string;
  @Field(() => ID, { name: 'variantId' }) @Column('uuid', { name: 'variant_id' }) variant_id!: string;
  @Field({ name: 'productName' }) @Column({ length: 255, name: 'product_name' }) product_name!: string;
  @Field({ name: 'variantName', nullable: true }) @Column({ length: 100, nullable: true, name: 'variant_name' }) variant_name?: string;
  @Field(() => Int, { name: 'expectedQuantity' }) @Column({ default: 0, name: 'expected_quantity' }) expected_quantity!: number;
  @Field(() => Int, { name: 'countedQuantity', nullable: true }) @Column({ nullable: true, name: 'counted_quantity' }) counted_quantity?: number;
  @Field(() => Int, { nullable: true }) @Column({ type: 'int', nullable: true, insert: false, update: false }) variance?: number;
  @Field(() => ID, { name: 'countedByUserId', nullable: true }) @Column('uuid', { nullable: true, name: 'counted_by_user_id' }) counted_by_user_id?: string;
  @Field(() => Date, { name: 'countedAt', nullable: true }) @Column({ type: 'timestamptz', nullable: true, name: 'counted_at' }) counted_at?: Date;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) notes?: string;
}

// ── Adjustments ─────────────────────────────────────────────────────────────

@ObjectType()
@Entity('inventory_adjustments')
export class InventoryAdjustment {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'adjustment_id' }) adjustmentId!: string;
  @Field(() => ID, { name: 'dispensaryId' }) @Index() @Column('uuid', { name: 'dispensary_id' }) dispensary_id!: string;
  @Field(() => ID, { name: 'variantId' }) @Column('uuid', { name: 'variant_id' }) variant_id!: string;
  @Field({ name: 'productName' }) @Column({ length: 255, name: 'product_name' }) product_name!: string;
  @Field(() => Int, { name: 'reasonId' }) @Column({ name: 'reason_id' }) reason_id!: number;
  @Field(() => Int, { name: 'quantityChange' }) @Column({ name: 'quantity_change' }) quantity_change!: number;
  @Field(() => Int, { name: 'quantityBefore' }) @Column({ name: 'quantity_before' }) quantity_before!: number;
  @Field(() => Int, { name: 'quantityAfter' }) @Column({ name: 'quantity_after' }) quantity_after!: number;
  @Field() @Column({ length: 20, default: 'pending' }) status!: string;
  @Field(() => ID, { name: 'submittedByUserId' }) @Column('uuid', { name: 'submitted_by_user_id' }) submitted_by_user_id!: string;
  @Field(() => ID, { name: 'approvedByUserId', nullable: true }) @Column('uuid', { nullable: true, name: 'approved_by_user_id' }) approved_by_user_id?: string;
  @Field(() => Date, { name: 'approvedAt', nullable: true }) @Column({ type: 'timestamptz', nullable: true, name: 'approved_at' }) approved_at?: Date;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) notes?: string;
  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
  @Field(() => Date) @UpdateDateColumn({ type: 'timestamptz' }) updated_at!: Date;
}

// ── Lookup ──────────────────────────────────────────────────────────────────

@ObjectType()
@Entity('lkp_adjustment_reasons')
export class LkpAdjustmentReason {
  @Field(() => Int) @PrimaryGeneratedColumn({ name: 'reason_id' }) reasonId!: number;
  @Field() @Column({ length: 30, unique: true }) code!: string;
  @Field() @Column({ length: 100 }) name!: string;
  @Field() @Column({ length: 10, default: 'decrease' }) direction!: string;
  @Field({ name: 'requiresApproval' }) @Column({ default: false, name: 'requires_approval' }) requires_approval!: boolean;
  @Field({ name: 'isActive' }) @Column({ default: true, name: 'is_active' }) is_active!: boolean;
}
