import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Category } from './category.entity';
import { ProductImage } from './product-image.entity';
import { ProductVariant } from './product-variant.entity';

export enum ProductType {
  FLOWER = 'flower',
  EDIBLE = 'edible',
  CONCENTRATE = 'concentrate',
  VAPE = 'vape',
  TOPICAL = 'topical',
  TINCTURE = 'tincture',
  PRE_ROLL = 'pre_roll',
  ACCESSORY = 'accessory',

  @Column({ name: "ai_description", type: "text", nullable: true })
  aiDescription: string;

  @Column({ name: "ai_description_generated_at", type: "timestamptz", nullable: true })
  aiDescriptionGeneratedAt: Date;

  @Column({ type: "simple-array", nullable: true })
  terpenes: string[];

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  price: number;
}

export enum StrainType {
  SATIVA = 'sativa',
  INDICA = 'indica',
  HYBRID = 'hybrid',
  CBD = 'cbd',

  @Column({ name: "ai_description", type: "text", nullable: true })
  aiDescription: string;

  @Column({ name: "ai_description_generated_at", type: "timestamptz", nullable: true })
  aiDescriptionGeneratedAt: Date;

  @Column({ type: "simple-array", nullable: true })
  terpenes: string[];

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  price: number;
}

@Entity('products')
@Index(['dispensaryId', 'slug'], { unique: true })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'dispensary_id', type: 'uuid' })
  dispensaryId!: string;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 100 })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({
    name: 'product_type',
    type: 'enum',
    enum: ProductType,
  })
  productType!: ProductType;

  @Column({
    name: 'strain_type',
    type: 'enum',
    enum: StrainType,
    nullable: true,
  })
  strainType!: StrainType;

  // Cannabis-specific fields
  @Column({
    name: 'thc_content',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  thcContent!: number;

  @Column({
    name: 'cbd_content',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  cbdContent!: number;

  @Column({ length: 255, nullable: true })
  brand!: string;

  @Column({ length: 255, nullable: true })
  manufacturer!: string;

  // Compliance fields (critical for cannabis)
  @Column({ name: 'license_number', length: 100, nullable: true })
  licenseNumber!: string;

  @Column({ name: 'batch_number', length: 100, nullable: true })
  batchNumber!: string;

  @Column({ name: 'lab_tested', type: 'boolean', default: false })
  labTested!: boolean;

  @Column({ name: 'lab_results_url', length: 500, nullable: true })
  labResultsUrl!: string;

  // SEO / Display
  @Column({ name: 'meta_title', length: 255, nullable: true })
  metaTitle!: string;

  @Column({ name: 'meta_description', type: 'text', nullable: true })
  metaDescription!: string;

  @Column({ type: 'simple-array', nullable: true })
  tags!: string[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured!: boolean;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: true,
  })
  variants!: ProductVariant[];

  @OneToMany(() => ProductImage, (image) => image.product, {
    cascade: true,
  })
  images!: ProductImage[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: "ai_description", type: "text", nullable: true })
  aiDescription: string;

  @Column({ name: "ai_description_generated_at", type: "timestamptz", nullable: true })
  aiDescriptionGeneratedAt: Date;

  @Column({ type: "simple-array", nullable: true })
  terpenes: string[];

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  price: number;
}
