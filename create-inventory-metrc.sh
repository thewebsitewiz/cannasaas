#!/bin/bash

API_SRC="apps/api/src/modules"

mkdir -p "$API_SRC/inventory/entities"
mkdir -p "$API_SRC/metrc/entities"

# ─── inventory.entity.ts ───────────────────────────────────────────────────────
cat > "$API_SRC/inventory/entities/inventory.entity.ts" << 'EOF'
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
EOF

# ─── inventory-transaction.entity.ts ──────────────────────────────────────────
cat > "$API_SRC/inventory/entities/inventory-transaction.entity.ts" << 'EOF'
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
EOF

# ─── inventory.module.ts ───────────────────────────────────────────────────────
cat > "$API_SRC/inventory/inventory.module.ts" << 'EOF'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from './entities/inventory.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Inventory, InventoryTransaction])],
  exports: [TypeOrmModule],
})
export class InventoryModule {}
EOF

# ─── metrc-credential.entity.ts ───────────────────────────────────────────────
cat > "$API_SRC/metrc/entities/metrc-credential.entity.ts" << 'EOF'
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
@Entity('metrc_credentials')
export class MetrcCredential {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid', { name: 'credential_id' })
  credentialId: string;

  @Field()
  @Index({ unique: true })
  @Column({ type: 'uuid', name: 'dispensary_id' })
  dispensaryId: string;

  @Field()
  @Column({ type: 'varchar', name: 'user_api_key' })
  userApiKey: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true, name: 'integrator_api_key' })
  integratorApiKey: string;

  @Field()
  @Column({ type: 'varchar', length: 10 })
  state: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true, name: 'metrc_username' })
  metrcUsername: string;

  @Field()
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true, name: 'last_validated_at' })
  lastValidatedAt: Date;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true, name: 'validation_error' })
  validationError: string;

  @Field()
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
EOF

# ─── metrc-sync-log.entity.ts ─────────────────────────────────────────────────
cat > "$API_SRC/metrc/entities/metrc-sync-log.entity.ts" << 'EOF'
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
@Entity('metrc_sync_logs')
@Index(['dispensaryId', 'createdAt'])
@Index(['dispensaryId', 'status'])
export class MetrcSyncLog {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid', { name: 'sync_id' })
  syncId: string;

  @Field()
  @Column({ type: 'uuid', name: 'dispensary_id' })
  dispensaryId: string;

  @Field()
  @Index()
  @Column({ type: 'uuid', name: 'credential_id' })
  credentialId: string;

  @Field()
  @Column({ type: 'varchar', name: 'sync_type' })
  syncType: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true, name: 'reference_entity_type' })
  referenceEntityType: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true, name: 'reference_entity_id' })
  referenceEntityId: string;

  @Field()
  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  @Field({ nullable: true })
  @Column({ type: 'jsonb', nullable: true, name: 'metrc_response' })
  metrcResponse: Record<string, any>;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string;

  @Field()
  @Column({ type: 'integer', default: 0, name: 'attempt_count' })
  attemptCount: number;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true, name: 'next_retry_at' })
  nextRetryAt: Date;

  @Field()
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
EOF

# ─── compliance-log.entity.ts ─────────────────────────────────────────────────
cat > "$API_SRC/metrc/entities/compliance-log.entity.ts" << 'EOF'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Entity('compliance_logs')
@Index(['dispensaryId', 'createdAt'])
@Index(['dispensaryId', 'entityType', 'entityId'])
export class ComplianceLog {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid', { name: 'log_id' })
  logId: string;

  @Field()
  @Column({ type: 'uuid', name: 'dispensary_id' })
  dispensaryId: string;

  @Field()
  @Column({ type: 'varchar', name: 'event_type' })
  eventType: string;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true, name: 'entity_type' })
  entityType: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true, name: 'entity_id' })
  entityId: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true })
  action: string;

  @Field({ nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any>;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true, name: 'ip_address' })
  ipAddress: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true, name: 'user_agent' })
  userAgent: string;

  @Field()
  @Column({ type: 'boolean', default: false, name: 'metrc_synced' })
  metrcSynced: boolean;

  @Field()
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
EOF

# ─── regulatory-library.entity.ts ─────────────────────────────────────────────
cat > "$API_SRC/metrc/entities/regulatory-library.entity.ts" << 'EOF'
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
@Entity('regulatory_library')
@Index(['state', 'status'])
export class RegulatoryLibrary {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid', { name: 'reg_id' })
  regId: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true, name: 'jurisdiction_level' })
  jurisdictionLevel: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true, name: 'jurisdiction_name' })
  jurisdictionName: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 10, nullable: true })
  state: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true, name: 'statute_number' })
  statuteNumber: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true })
  title: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  summary: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true, name: 'full_text' })
  fullText: string;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true, name: 'effective_date' })
  effectiveDate: Date;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true, name: 'expiry_date' })
  expiryDate: Date;

  @Field()
  @Column({ type: 'varchar', default: 'active' })
  status: string;

  @Field({ nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true, name: 'source_url' })
  sourceUrl: string;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true, name: 'last_verified_at' })
  lastVerifiedAt: Date;

  @Field()
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
EOF

# ─── metrc.module.ts ──────────────────────────────────────────────────────────
cat > "$API_SRC/metrc/metrc.module.ts" << 'EOF'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetrcCredential } from './entities/metrc-credential.entity';
import { MetrcSyncLog } from './entities/metrc-sync-log.entity';
import { ComplianceLog } from './entities/compliance-log.entity';
import { RegulatoryLibrary } from './entities/regulatory-library.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MetrcCredential, MetrcSyncLog, ComplianceLog, RegulatoryLibrary])],
  exports: [TypeOrmModule],
})
export class MetrcModule {}
EOF

echo "✅ All 8 files created successfully."
echo ""
echo "Now add to app.module.ts:"
echo "  import { InventoryModule } from './modules/inventory/inventory.module';"
echo "  import { MetrcModule } from './modules/metrc/metrc.module';"
echo "  // add InventoryModule, MetrcModule to the imports array"
