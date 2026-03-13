import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
@Entity('metrc_manifests')
export class MetrcManifest {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'manifest_id' }) manifestId!: string;
  @Field(() => ID, { name: 'transferId', nullable: true }) @Column('uuid', { nullable: true, name: 'transfer_id' }) transfer_id?: string;
  @Field(() => ID, { name: 'dispensaryId' }) @Index() @Column('uuid', { name: 'dispensary_id' }) dispensary_id!: string;
  @Field({ name: 'manifestNumber' }) @Column({ length: 50, name: 'manifest_number' }) manifest_number!: string;
  @Field({ name: 'manifestType' }) @Column({ length: 30, default: 'transfer', name: 'manifest_type' }) manifest_type!: string;
  @Field({ name: 'fromLicense' }) @Column({ length: 50, name: 'from_license' }) from_license!: string;
  @Field({ name: 'toLicense' }) @Column({ length: 50, name: 'to_license' }) to_license!: string;
  @Field({ name: 'fromFacilityName', nullable: true }) @Column({ length: 200, nullable: true, name: 'from_facility_name' }) from_facility_name?: string;
  @Field({ name: 'toFacilityName', nullable: true }) @Column({ length: 200, nullable: true, name: 'to_facility_name' }) to_facility_name?: string;
  @Field({ name: 'driverName', nullable: true }) @Column({ length: 100, nullable: true, name: 'driver_name' }) driver_name?: string;
  @Field({ name: 'vehicleLicensePlate', nullable: true }) @Column({ length: 20, nullable: true, name: 'vehicle_license_plate' }) vehicle_license_plate?: string;
  @Field() @Column({ length: 20, default: 'draft' }) status!: string;
  @Field({ name: 'metrcTransferId', nullable: true }) @Column({ length: 100, nullable: true, name: 'metrc_transfer_id' }) metrc_transfer_id?: string;
  @Field(() => Int, { name: 'totalPackages' }) @Column({ default: 0, name: 'total_packages' }) total_packages!: number;
  @Field(() => Float, { name: 'totalQuantity' }) @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'total_quantity' }) total_quantity!: number;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) notes?: string;
  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
  @Field(() => Date) @UpdateDateColumn({ type: 'timestamptz' }) updated_at!: Date;
}

@ObjectType()
@Entity('metrc_manifest_items')
export class MetrcManifestItem {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'item_id' }) itemId!: string;
  @Field(() => ID, { name: 'manifestId' }) @Index() @Column('uuid', { name: 'manifest_id' }) manifest_id!: string;
  @Field(() => ID, { name: 'variantId' }) @Column('uuid', { name: 'variant_id' }) variant_id!: string;
  @Field({ name: 'productName' }) @Column({ length: 255, name: 'product_name' }) product_name!: string;
  @Field({ name: 'metrcPackageTag', nullable: true }) @Column({ length: 100, nullable: true, name: 'metrc_package_tag' }) metrc_package_tag?: string;
  @Field(() => Float) @Column({ type: 'decimal', precision: 10, scale: 2 }) quantity!: number;
  @Field({ name: 'unitOfMeasure' }) @Column({ length: 20, default: 'each', name: 'unit_of_measure' }) unit_of_measure!: string;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) notes?: string;
}

@ObjectType()
@Entity('waste_destruction_logs')
export class WasteDestructionLog {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'log_id' }) logId!: string;
  @Field(() => ID, { name: 'dispensaryId' }) @Index() @Column('uuid', { name: 'dispensary_id' }) dispensary_id!: string;
  @Field(() => ID, { name: 'variantId', nullable: true }) @Column('uuid', { nullable: true, name: 'variant_id' }) variant_id?: string;
  @Field({ name: 'productName' }) @Column({ length: 255, name: 'product_name' }) product_name!: string;
  @Field({ name: 'metrcPackageTag', nullable: true }) @Column({ length: 100, nullable: true, name: 'metrc_package_tag' }) metrc_package_tag?: string;
  @Field(() => Float) @Column({ type: 'decimal', precision: 10, scale: 2 }) quantity!: number;
  @Field({ name: 'unitOfMeasure' }) @Column({ length: 20, default: 'grams', name: 'unit_of_measure' }) unit_of_measure!: string;
  @Field({ name: 'wasteType' }) @Column({ length: 30, default: 'plant_waste', name: 'waste_type' }) waste_type!: string;
  @Field({ name: 'destructionMethod', nullable: true }) @Column({ length: 50, nullable: true, name: 'destruction_method' }) destruction_method?: string;
  @Field() @Column({ type: 'text' }) reason!: string;
  @Field({ name: 'witness1Name' }) @Column({ length: 100, name: 'witness1_name' }) witness1_name!: string;
  @Field({ name: 'witness1Title', nullable: true }) @Column({ length: 50, nullable: true, name: 'witness1_title' }) witness1_title?: string;
  @Field({ name: 'witness2Name', nullable: true }) @Column({ length: 100, nullable: true, name: 'witness2_name' }) witness2_name?: string;
  @Field({ name: 'witness2Title', nullable: true }) @Column({ length: 50, nullable: true, name: 'witness2_title' }) witness2_title?: string;
  @Field(() => Date, { name: 'destroyedAt' }) @Column({ type: 'timestamptz', name: 'destroyed_at' }) destroyed_at!: Date;
  @Field() @Column({ length: 20, default: 'pending' }) status!: string;
  @Field(() => ID, { name: 'submittedByUserId' }) @Column('uuid', { name: 'submitted_by_user_id' }) submitted_by_user_id!: string;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) notes?: string;
  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
}

@ObjectType()
@Entity('audit_log')
export class AuditLog {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'audit_id' }) auditId!: string;
  @Field(() => ID, { name: 'dispensaryId', nullable: true }) @Column('uuid', { nullable: true, name: 'dispensary_id' }) dispensary_id?: string;
  @Field(() => ID, { name: 'userId', nullable: true }) @Index() @Column('uuid', { nullable: true, name: 'user_id' }) user_id?: string;
  @Field({ name: 'userEmail', nullable: true }) @Column({ length: 255, nullable: true, name: 'user_email' }) user_email?: string;
  @Field() @Column({ length: 50 }) action!: string;
  @Field({ name: 'entityType' }) @Column({ length: 50, name: 'entity_type' }) entity_type!: string;
  @Field({ name: 'entityId', nullable: true }) @Column({ length: 100, nullable: true, name: 'entity_id' }) entity_id?: string;
  @Field(() => GraphQLJSON, { nullable: true }) @Column({ type: 'jsonb', nullable: true }) changes?: any;
  @Field(() => GraphQLJSON, { name: 'oldValues', nullable: true }) @Column({ type: 'jsonb', nullable: true, name: 'old_values' }) old_values?: any;
  @Field(() => GraphQLJSON, { name: 'newValues', nullable: true }) @Column({ type: 'jsonb', nullable: true, name: 'new_values' }) new_values?: any;
  @Field({ name: 'ipAddress', nullable: true }) @Column({ length: 45, nullable: true, name: 'ip_address' }) ip_address?: string;
  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
}

@ObjectType()
@Entity('reconciliation_reports')
export class ReconciliationReport {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'report_id' }) reportId!: string;
  @Field(() => ID, { name: 'dispensaryId' }) @Column('uuid', { name: 'dispensary_id' }) dispensary_id!: string;
  @Field({ name: 'reportDate' }) @Column({ type: 'date', name: 'report_date' }) report_date!: string;
  @Field() @Column({ length: 20, default: 'pending' }) status!: string;
  @Field(() => Int, { name: 'totalLocalItems' }) @Column({ default: 0, name: 'total_local_items' }) total_local_items!: number;
  @Field(() => Int, { name: 'totalMetrcItems' }) @Column({ default: 0, name: 'total_metrc_items' }) total_metrc_items!: number;
  @Field(() => Int, { name: 'matchedItems' }) @Column({ default: 0, name: 'matched_items' }) matched_items!: number;
  @Field(() => Int, { name: 'discrepancyCount' }) @Column({ default: 0, name: 'discrepancy_count' }) discrepancy_count!: number;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) notes?: string;
  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
}

@ObjectType()
@Entity('reconciliation_items')
export class ReconciliationItem {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'item_id' }) itemId!: string;
  @Field(() => ID, { name: 'reportId' }) @Index() @Column('uuid', { name: 'report_id' }) report_id!: string;
  @Field({ name: 'productName', nullable: true }) @Column({ length: 255, nullable: true, name: 'product_name' }) product_name?: string;
  @Field({ name: 'metrcPackageTag', nullable: true }) @Column({ length: 100, nullable: true, name: 'metrc_package_tag' }) metrc_package_tag?: string;
  @Field(() => Int, { name: 'localQuantity', nullable: true }) @Column({ nullable: true, name: 'local_quantity' }) local_quantity?: number;
  @Field(() => Int, { name: 'metrcQuantity', nullable: true }) @Column({ nullable: true, name: 'metrc_quantity' }) metrc_quantity?: number;
  @Field(() => Int, { nullable: true }) @Column({ nullable: true }) variance?: number;
  @Field() @Column({ length: 20, default: 'matched' }) status!: string;
}
