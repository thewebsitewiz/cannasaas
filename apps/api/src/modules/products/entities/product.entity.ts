import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';

@ObjectType()
@Entity('products')
@Index(['dispensary_id', 'is_active', 'product_type_id'])
@Index(['dispensary_id', 'primary_category_id', 'is_active'])
export class Product {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid') id!: string;

  @Field(() => ID, { name: 'dispensaryId' }) @Index() @Column({ type: 'uuid' }) dispensary_id!: string;
  @Field(() => ID, { name: 'brandId', nullable: true }) @Column({ type: 'uuid', nullable: true }) brand_id?: string;
  @Field(() => ID, { name: 'manufacturerId', nullable: true }) @Column({ type: 'uuid', nullable: true }) manufacturer_id?: string;
  @Field(() => ID, { name: 'strainId', nullable: true }) @Column({ type: 'uuid', nullable: true }) strain_id?: string;
  @Field(() => Int, { name: 'productTypeId', nullable: true }) @Column({ nullable: true }) product_type_id?: number;
  @Field(() => Int, { name: 'primaryCategoryId', nullable: true }) @Column({ nullable: true }) primary_category_id?: number;
  @Field(() => Int, { name: 'taxCategoryId', nullable: true }) @Column({ nullable: true }) tax_category_id?: number;
  @Field(() => Int, { name: 'packagingTypeId', nullable: true }) @Column({ nullable: true }) packaging_type_id?: number;
  @Field(() => Int, { name: 'extractionMethodId', nullable: true }) @Column({ nullable: true }) extraction_method_id?: number;
  @Field(() => Int, { name: 'uomId', nullable: true }) @Column({ nullable: true }) uom_id?: number;
  @Field(() => Int, { name: 'metrcItemCategoryId', nullable: true }) @Column({ nullable: true }) metrc_item_category_id?: number;

  @Field({ name: 'strainName', nullable: true }) @Column({ length: 255, nullable: true }) strain_name?: string;
  @Field({ name: 'strainType', nullable: true }) @Column({ length: 20, nullable: true }) strain_type?: string;
  @Field(() => GraphQLJSON, { name: 'effects', nullable: true }) @Column({ type: 'jsonb', default: '[]' }) effects!: any;
  @Field(() => GraphQLJSON, { name: 'flavors', nullable: true }) @Column({ type: 'jsonb', default: '[]' }) flavors!: any;
  @Field(() => GraphQLJSON, { name: 'terpenes', nullable: true }) @Column({ type: 'jsonb', default: '[]' }) terpenes!: any;
  @Field(() => GraphQLJSON, { name: 'lineage', nullable: true }) @Column({ type: 'jsonb', default: '{}' }) lineage!: any;
  @Field({ name: 'otreebaOcpc', nullable: true }) @Column({ length: 50, nullable: true }) otreeba_ocpc?: string;
  @Field(() => Date, { name: 'enrichedAt', nullable: true }) @Column({ type: 'timestamptz', nullable: true }) enriched_at?: Date;

  @Field() @Column({ length: 255 }) name!: string;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) description?: string;
  @Field({ name: 'shortDescription', nullable: true }) @Column({ type: 'text', nullable: true }) short_description?: string;
  @Field({ nullable: true }) @Index({ unique: true }) @Column({ nullable: true, length: 100 }) sku?: string;
  @Field({ name: 'metrcItemUid', nullable: true }) @Index() @Column({ nullable: true, length: 50 }) metrc_item_uid?: string;

  @Field(() => Float, { name: 'netWeightG', nullable: true }) @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true }) net_weight_g?: number;
  @Field(() => Float, { name: 'netVolumeMl', nullable: true }) @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true }) net_volume_ml?: number;
  @Field(() => Float, { name: 'thcPercent', nullable: true }) @Column({ type: 'decimal', precision: 6, scale: 3, nullable: true }) thc_percent?: number;
  @Field(() => Float, { name: 'cbdPercent', nullable: true }) @Column({ type: 'decimal', precision: 6, scale: 3, nullable: true }) cbd_percent?: number;
  @Field(() => Float, { name: 'totalThcMgPerContainer', nullable: true }) @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true }) total_thc_mg_per_container?: number;

  @Field({ name: 'isHempDerived' }) @Column({ default: false }) is_hemp_derived!: boolean;
  @Field({ name: 'isChildResistantPackaged' }) @Column({ default: false }) is_child_resistant_packaged!: boolean;
  @Field({ name: 'isTamperEvident' }) @Column({ default: false }) is_tamper_evident!: boolean;
  @Field({ name: 'isResealable' }) @Column({ default: false }) is_resealable!: boolean;
  @Field({ name: 'hasNoMinorAppeals' }) @Column({ default: true }) has_no_minor_appeals!: boolean;
  @Field({ name: 'isActive' }) @Column({ default: false }) is_active!: boolean;
  @Field({ name: 'isApproved' }) @Column({ default: false }) is_approved!: boolean;

  @Field(() => ID, { name: 'approvedByUserId', nullable: true }) @Column({ type: 'uuid', nullable: true }) approved_by_user_id?: string;
  @Field(() => Date, { name: 'approvedAt', nullable: true }) @Column({ type: 'timestamptz', nullable: true }) approved_at?: Date;

  @Field(() => Date, { name: 'createdAt' }) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
  @Field(() => Date, { name: 'updatedAt' }) @UpdateDateColumn({ type: 'timestamptz' }) updated_at!: Date;
  @Field(() => Date, { name: 'deletedAt', nullable: true }) @DeleteDateColumn({ type: 'timestamptz', nullable: true }) deleted_at?: Date;
}
