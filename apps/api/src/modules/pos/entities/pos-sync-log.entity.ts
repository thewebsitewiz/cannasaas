import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
@Entity('pos_sync_logs')
@Index(['dispensary_id', 'created_at'])
export class PosSyncLog {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'sync_log_id' }) syncLogId!: string;
  @Field(() => ID, { name: 'dispensaryId' }) @Column({ type: 'uuid', name: 'dispensary_id' }) dispensary_id!: string;
  @Field() @Column({ length: 50 }) provider!: string;
  @Field({ name: 'syncType' }) @Column({ length: 50, name: 'sync_type' }) sync_type!: string; // 'product_pull' | 'inventory_sync' | 'order_push'
  @Field() @Column({ length: 20, default: 'pending' }) status!: string;
  @Field(() => Int, { name: 'itemsProcessed' }) @Column({ default: 0, name: 'items_processed' }) items_processed!: number;
  @Field(() => Int, { name: 'itemsCreated' }) @Column({ default: 0, name: 'items_created' }) items_created!: number;
  @Field(() => Int, { name: 'itemsUpdated' }) @Column({ default: 0, name: 'items_updated' }) items_updated!: number;
  @Field(() => Int, { name: 'itemsFailed' }) @Column({ default: 0, name: 'items_failed' }) items_failed!: number;
  @Field({ name: 'errorMessage', nullable: true }) @Column({ type: 'text', nullable: true, name: 'error_message' }) error_message?: string;
  @Field(() => Int, { name: 'durationMs', nullable: true }) @Column({ nullable: true, name: 'duration_ms' }) duration_ms?: number;
  @Field(() => Date, { name: 'createdAt' }) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
}
