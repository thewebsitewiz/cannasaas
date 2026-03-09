import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';

@ObjectType()
@Entity('products')
@Index(['dispensary_id', 'is_active', 'product_type_id'])
@Index(['dispensary_id', 'primary_category_id', 'is_active'])
export class Product {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid') id!: string;

  @Field(() => ID) @Index() @Column({ type: 'uuid' }) dispensary_id!: string;
  @Field(() => ID, { nullable: true }) @Column({ type: 'uuid', nullable: true }) brand_id?: string;
  @Field(() => ID, { nullable: true }) @Column({ type: 'uuid', nullable: true }) manufacturer_id?: string;
  @Field(() => ID, { nullable: true }) @Column({ type: 'uuid', nullable: true }) strain_id?: string;
  @Field(() => Int, { nullable: true }) @Column({ nullable: true }) product_type_id?: number;
  @Field(() => Int, { nullable: true }) @Column({ nullable: true }) primary_category_id?: number;
  @Field(() => Int, { nullable: true }) @Column({ nullable: true }) tax_category_id?: number;
  @Field(() => Int, { nullable: true }) @Column({ nullable: true }) packaging_type_id?: number;
  @Field(() => Int, { nullable: true }) @Column({ nullable: true }) extraction_method_id?: number;
  @Field(() => Int, { nullable: true }) @Column({ nullable: true }) uom_id?: number;
  @Field(() => Int, { nullable: true }) @Column({ nullable: true }) metrc_item_category_id?: number;

  @Field() @Column({ length: 255 }) name!: string;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) description?: string;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) short_description?: string;
  @Field({ nullable: true }) @Index({ unique: true }) @Column({ nullable: true, length: 100 }) sku?: string;
  @Field({ nullable: true }) @Index() @Column({ nullable: true, length: 50 }) metrc_item_uid?: string;

  @Field(() => Float, { nullable: true }) @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true }) net_weight_g?: number;
  @Field(() => Float, { nullable: true }) @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true }) net_volume_ml?: number;
  @Field(() => Float, { nullable: true }) @Column({ type: 'decimal', precision: 6, scale: 3, nullable: true }) thc_percent?: number;
  @Field(() => Float, { nullable: true }) @Column({ type: 'decimal', precision: 6, scale: 3, nullable: true }) cbd_percent?: number;
  @Field(() => Float, { nullable: true }) @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true }) total_thc_mg_per_container?: number;

  @Field() @Column({ default: false }) is_hemp_derived!: boolean;
  @Field() @Column({ default: false }) is_child_resistant_packaged!: boolean;
  @Field() @Column({ default: false }) is_tamper_evident!: boolean;
  @Field() @Column({ default: false }) is_resealable!: boolean;
  @Field() @Column({ default: true }) has_no_minor_appeals!: boolean;
  @Field() @Column({ default: false }) is_active!: boolean;
  @Field() @Column({ default: false }) is_approved!: boolean;

  @Field(() => ID, { nullable: true }) @Column({ type: 'uuid', nullable: true }) approved_by_user_id?: string;
  @Field(() => Date, { nullable: true }) @Column({ type: 'timestamptz', nullable: true }) approved_at?: Date;

  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
  @Field(() => Date) @UpdateDateColumn({ type: 'timestamptz' }) updated_at!: Date;
  @Field(() => Date, { nullable: true }) @DeleteDateColumn({ type: 'timestamptz', nullable: true }) deleted_at?: Date;
}
