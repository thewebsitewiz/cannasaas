import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
@Entity('lkp_product_types')
export class LkpProductType {
  @Field(() => Int) @PrimaryGeneratedColumn() product_type_id!: number;
  @Field() @Column({ unique: true, length: 100 }) code!: string;
  @Field() @Column({ length: 100 }) name!: string;
  @Field() @Column({ default: false }) requires_lab_test!: boolean;
  @Field() @Column({ default: false }) requires_serving_info!: boolean;
  @Field() @Column({ default: false }) requires_ingredient_list!: boolean;
  @Field() @Column({ default: false }) requires_extraction_method!: boolean;
  @Field() @Column({ default: false }) is_inhalable!: boolean;
  @Field() @Column({ default: false }) is_ingestible!: boolean;
  @Field({ nullable: true }) @Column({ nullable: true, length: 100 }) metrc_default_category_code?: string;
  @Field() @Column({ default: false }) hemp_eligible!: boolean;
  @Field() @Column({ default: true }) is_active!: boolean;
  @Field(() => Int) @Column({ default: 0 }) sort_order!: number;
}

@ObjectType()
@Entity('lkp_product_categories')
export class LkpProductCategory {
  @Field(() => Int) @PrimaryGeneratedColumn() category_id!: number;
  @Field(() => Int, { nullable: true }) @Column({ nullable: true }) parent_category_id?: number;
  @Field() @Column({ unique: true, length: 100 }) code!: string;
  @Field() @Column({ length: 100 }) name!: string;
  @Field(() => Int) @Column({ default: 0 }) depth!: number;
  @Field({ nullable: true }) @Column({ nullable: true, length: 100 }) metrc_category_code?: string;
  @Field() @Column({ default: true }) is_active!: boolean;
  @Field(() => Int) @Column({ default: 0 }) sort_order!: number;
}

@ObjectType()
@Entity('lkp_unit_of_measure')
export class LkpUnitOfMeasure {
  @Field(() => Int) @PrimaryGeneratedColumn() uom_id!: number;
  @Field() @Column({ unique: true, length: 20 }) code!: string;
  @Field() @Column({ length: 50 }) name!: string;
  @Field() @Column({ length: 20 }) uom_type!: string;
  @Field() @Column({ default: false }) is_metrc_supported!: boolean;
  @Field({ nullable: true }) @Column({ nullable: true, length: 50 }) metrc_code?: string;
  @Field() @Column({ default: true }) is_active!: boolean;
}

@ObjectType()
@Entity('lkp_packaging_types')
export class LkpPackagingType {
  @Field(() => Int) @PrimaryGeneratedColumn() packaging_type_id!: number;
  @Field() @Column({ unique: true, length: 100 }) code!: string;
  @Field() @Column({ length: 100 }) name!: string;
  @Field() @Column({ default: false }) is_child_resistant!: boolean;
  @Field() @Column({ default: false }) is_tamper_evident!: boolean;
  @Field() @Column({ default: false }) is_resealable!: boolean;
  @Field() @Column({ default: false }) is_opaque!: boolean;
  @Field() @Column({ default: true }) is_active!: boolean;
}

@ObjectType()
@Entity('lkp_extraction_methods')
export class LkpExtractionMethod {
  @Field(() => Int) @PrimaryGeneratedColumn() extraction_method_id!: number;
  @Field() @Column({ unique: true, length: 100 }) code!: string;
  @Field() @Column({ length: 100 }) name!: string;
  @Field() @Column({ default: false }) uses_solvent!: boolean;
  @Field({ nullable: true }) @Column({ nullable: true, length: 100 }) solvent_type?: string;
  @Field() @Column({ default: true }) is_active!: boolean;
}

@ObjectType()
@Entity('lkp_effects')
export class LkpEffect {
  @Field(() => Int) @PrimaryGeneratedColumn() effect_id!: number;
  @Field() @Column({ unique: true, length: 100 }) code!: string;
  @Field() @Column({ length: 100 }) name!: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 50 }) effect_category?: string;
  @Field() @Column({ default: false }) is_medical_claim!: boolean;
  @Field() @Column({ default: true }) is_active!: boolean;
  @Field(() => Int) @Column({ default: 0 }) sort_order!: number;
}

@ObjectType()
@Entity('lkp_flavors')
export class LkpFlavor {
  @Field(() => Int) @PrimaryGeneratedColumn() flavor_id!: number;
  @Field() @Column({ unique: true, length: 100 }) code!: string;
  @Field() @Column({ length: 100 }) name!: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 50 }) flavor_family?: string;
  @Field() @Column({ default: true }) is_active!: boolean;
  @Field(() => Int) @Column({ default: 0 }) sort_order!: number;
}

@ObjectType()
@Entity('lkp_terpenes')
export class LkpTerpene {
  @Field(() => Int) @PrimaryGeneratedColumn() terpene_id!: number;
  @Field() @Column({ unique: true, length: 100 }) code!: string;
  @Field() @Column({ length: 100 }) name!: string;
  @Field({ nullable: true }) @Column({ nullable: true, type: 'text' }) aroma?: string;
  @Field({ nullable: true }) @Column({ nullable: true, type: 'text' }) potential_effects?: string;
  @Field(() => Float, { nullable: true }) @Column({ type: 'decimal', precision: 5, scale: 1, nullable: true }) boiling_point_celsius?: number;
  @Field() @Column({ default: true }) is_active!: boolean;
  @Field(() => Int) @Column({ default: 0 }) sort_order!: number;
}

@ObjectType()
@Entity('lkp_cannabinoids')
export class LkpCannabinoid {
  @Field(() => Int) @PrimaryGeneratedColumn() cannabinoid_id!: number;
  @Field() @Column({ unique: true, length: 20 }) code!: string;
  @Field() @Column({ length: 50 }) name!: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 20 }) abbreviation?: string;
  @Field() @Column({ default: false }) is_psychoactive!: boolean;
  @Field() @Column({ default: false }) is_hemp_restricted!: boolean;
  @Field() @Column({ default: false }) is_scheduled!: boolean;
  @Field({ nullable: true }) @Column({ nullable: true, length: 50 }) schedule?: string;
  @Field() @Column({ default: true }) is_active!: boolean;
}

@ObjectType()
@Entity('lkp_allergens')
export class LkpAllergen {
  @Field(() => Int) @PrimaryGeneratedColumn() allergen_id!: number;
  @Field() @Column({ unique: true, length: 100 }) code!: string;
  @Field() @Column({ length: 100 }) name!: string;
  @Field() @Column({ default: false }) is_fda_major!: boolean;
  @Field() @Column({ default: true }) is_active!: boolean;
}

@ObjectType()
@Entity('lkp_lab_test_categories')
export class LkpLabTestCategory {
  @Field(() => Int) @PrimaryGeneratedColumn() test_category_id!: number;
  @Field() @Column({ unique: true, length: 100 }) code!: string;
  @Field() @Column({ length: 100 }) name!: string;
  @Field({ nullable: true }) @Column({ nullable: true, type: 'text' }) applies_to_product_types?: string;
  @Field() @Column({ default: false }) is_mandatory!: boolean;
  @Field() @Column({ default: true }) is_active!: boolean;
}

@ObjectType()
@Entity('lkp_tax_categories')
export class LkpTaxCategory {
  @Field(() => Int) @PrimaryGeneratedColumn() tax_category_id!: number;
  @Field() @Column({ unique: true, length: 100 }) code!: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 10 }) state?: string;
  @Field() @Column({ length: 100 }) name!: string;
  @Field() @Column({ length: 20 }) tax_basis!: string;
  @Field() @Column({ type: 'decimal', precision: 6, scale: 4, default: 0 }) rate!: number;
  @Field({ nullable: true }) @Column({ nullable: true, type: 'date' }) effective_date?: Date;
  @Field({ nullable: true }) @Column({ nullable: true, length: 255 }) statutory_reference?: string;
  @Field() @Column({ default: true }) is_active!: boolean;
}

@ObjectType()
@Entity('lkp_metrc_item_categories')
export class LkpMetrcItemCategory {
  @Field(() => Int) @PrimaryGeneratedColumn() metrc_category_id!: number;
  @Field() @Column({ unique: true, length: 100 }) code!: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 10 }) state?: string;
  @Field() @Column({ length: 100 }) name!: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 100 }) product_type_code?: string;
  @Field() @Column({ default: false }) requires_unit_weight!: boolean;
  @Field({ nullable: true }) @Column({ nullable: true, type: 'date' }) effective_date?: Date;
  @Field() @Column({ default: true }) is_active!: boolean;
}

@ObjectType()
@Entity('lkp_metrc_adjustment_reasons')
export class LkpMetrcAdjustmentReason {
  @Field(() => Int) @PrimaryGeneratedColumn() adjustment_reason_id!: number;
  @Field() @Column({ unique: true, length: 100 }) code!: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 10 }) state?: string;
  @Field() @Column({ length: 255 }) name!: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 50 }) reason_category?: string;
  @Field() @Column({ default: true }) is_active!: boolean;
}

@ObjectType()
@Entity('lkp_warning_statements')
export class LkpWarningStatement {
  @Field(() => Int) @PrimaryGeneratedColumn() warning_id!: number;
  @Field() @Column({ unique: true, length: 100 }) code!: string;
  @Field() @Column({ length: 5 }) jurisdiction!: string;
  @Field() @Column({ type: 'text' }) statement_text!: string;
  @Field({ nullable: true }) @Column({ nullable: true, type: 'text' }) applies_to_product_types?: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 50 }) applies_to_license_type?: string;
  @Field() @Column({ default: false }) is_mandatory!: boolean;
  @Field({ nullable: true }) @Column({ nullable: true, type: 'date' }) effective_date?: Date;
  @Field({ nullable: true }) @Column({ nullable: true, length: 255 }) statutory_reference?: string;
  @Field() @Column({ default: true }) is_active!: boolean;
}
