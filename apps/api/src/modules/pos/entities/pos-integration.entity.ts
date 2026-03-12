import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';

@ObjectType()
@Entity('pos_integrations')
@Index(['dispensary_id'], { unique: true })
export class PosIntegration {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'integration_id' }) integrationId!: string;
  @Field(() => ID, { name: 'dispensaryId' }) @Column({ type: 'uuid', name: 'dispensary_id' }) dispensary_id!: string;
  @Field({ name: 'provider' }) @Column({ length: 50 }) provider!: string; // 'dutchie' | 'treez'
  @Column({ type: 'jsonb', default: '{}' }) credentials!: Record<string, any>; // encrypted at rest
  @Field({ name: 'dispensaryExternalId', nullable: true }) @Column({ length: 255, nullable: true, name: 'dispensary_external_id' }) dispensary_external_id?: string;
  @Field({ name: 'isActive' }) @Column({ default: false, name: 'is_active' }) is_active!: boolean;
  @Field({ name: 'isSyncEnabled' }) @Column({ default: false, name: 'is_sync_enabled' }) is_sync_enabled!: boolean;
  @Field(() => Date, { name: 'lastSyncAt', nullable: true }) @Column({ type: 'timestamptz', nullable: true, name: 'last_sync_at' }) last_sync_at?: Date;
  @Field({ name: 'lastSyncStatus', nullable: true }) @Column({ length: 50, nullable: true, name: 'last_sync_status' }) last_sync_status?: string;
  @Field({ name: 'lastSyncError', nullable: true }) @Column({ type: 'text', nullable: true, name: 'last_sync_error' }) last_sync_error?: string;
  @Field(() => Date, { name: 'createdAt' }) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
  @Field(() => Date, { name: 'updatedAt' }) @UpdateDateColumn({ type: 'timestamptz' }) updated_at!: Date;
}
