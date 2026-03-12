import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Entity('pos_product_mappings')
@Index(['dispensary_id', 'external_product_id', 'provider'], { unique: true })
export class PosProductMapping {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'mapping_id' }) mappingId!: string;
  @Field(() => ID, { name: 'dispensaryId' }) @Column({ type: 'uuid', name: 'dispensary_id' }) dispensary_id!: string;
  @Field(() => ID, { name: 'internalProductId' }) @Column({ type: 'uuid', name: 'internal_product_id' }) internal_product_id!: string;
  @Field(() => ID, { name: 'internalVariantId', nullable: true }) @Column({ type: 'uuid', nullable: true, name: 'internal_variant_id' }) internal_variant_id?: string;
  @Field({ name: 'externalProductId' }) @Column({ length: 255, name: 'external_product_id' }) external_product_id!: string;
  @Field({ name: 'externalVariantId', nullable: true }) @Column({ length: 255, nullable: true, name: 'external_variant_id' }) external_variant_id?: string;
  @Field() @Column({ length: 50 }) provider!: string;
  @Field({ name: 'matchMethod', nullable: true }) @Column({ length: 50, nullable: true, name: 'match_method' }) match_method?: string; // 'sku' | 'name' | 'manual'
  @Field({ name: 'isConfirmed' }) @Column({ default: false, name: 'is_confirmed' }) is_confirmed!: boolean;
  @Field(() => Date, { name: 'lastSyncedAt', nullable: true }) @Column({ type: 'timestamptz', nullable: true, name: 'last_synced_at' }) last_synced_at?: Date;
  @Field(() => Date, { name: 'createdAt' }) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
  @Field(() => Date, { name: 'updatedAt' }) @UpdateDateColumn({ type: 'timestamptz' }) updated_at!: Date;
}
