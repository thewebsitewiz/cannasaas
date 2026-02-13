import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { TenantBaseEntity } from '../../common/entities/base.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductImage } from './product-image.entity';
import { Category } from './category.entity';


export enum ProductType {
  FLOWER = 'flower',
  PRE_ROLLS = 'pre_rolls',
  VAPES = 'vapes',
  EDIBLES = 'edibles',
  CONCENTRATES = 'concentrates',
  TINCTURES = 'tinctures',
  TOPICALS = 'topicals',
  ACCESSORIES = 'accessories',
  APPAREL = 'apparel',
  OTHER = 'other',
}

export enum StrainType {
  SATIVA = 'sativa',
  INDICA = 'indica',
  HYBRID = 'hybrid',
  SATIVA_DOMINANT = 'sativa_dominant',
  INDICA_DOMINANT = 'indica_dominant',
}

@Entity('products')
@Index(['organizationId', 'slug'], { unique: true })
@Index(['organizationId', 'status'])
@Index(['organizationId', 'category'])
export class Product extends TenantBaseEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  slug: string;

  @Column({ length: 50, nullable: true })
  sku?: string;

  // Descriptions
  @Column({ name: 'short_description', type: 'text', nullable: true })
  shortDescription?: string;

  @Column({ name: 'long_description', type: 'text', nullable: true })
  longDescription?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'ai_description', type: 'text', nullable: true })
  aiDescription?: string;

  @Column({ name: 'ai_description_generated_at', type: 'timestamptz', nullable: true })
  aiDescriptionGeneratedAt?: Date;

  // Categorization
  @Column({
    type: 'enum',
    enum: [
      'flower', 'pre_rolls', 'vapes', 'edibles', 'concentrates',
      'tinctures', 'topicals', 'accessories', 'apparel', 'other',
    ],
    default: 'flower',
  })
  category: string;

  @Column({ length: 100, nullable: true })
  subcategory?: string;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  // Brand
  @Column({ type: 'jsonb', nullable: true })
  brand?: {
    name: string;
    logo?: string;
  };

  // Cannabis-specific information
  @Column({ type: 'jsonb', name: 'cannabis_info', default: {} })
  cannabisInfo: {
    strain?: {
      name?: string;
      type?: string;
      genetics?: string;
    };
    cannabinoids?: {
      thc?: { percentage: number; min?: number; max?: number };
      cbd?: { percentage: number; min?: number; max?: number };
      cbg?: { percentage: number };
      cbn?: { percentage: number };
    };
    terpenes?: Array<{ name: string; percentage: number }>;
    effects?: {
      primary?: string[];
      medical?: string[];
    };
    flavors?: string[];
    labTesting?: {
      tested: boolean;
      labName?: string;
      batchNumber?: string;
      testDate?: string;
      coaUrl?: string;
    };
  };

  // Top-level terpenes list (Sprint 7+ — AI description service)
  @Column({ type: 'simple-array', nullable: true })
  terpenes?: string[];

  // Price (denormalized from variant for quick access)
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price?: number;

  // SEO
  @Column({ type: 'jsonb', nullable: true })
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };

  // Review aggregates (denormalized for performance)
  @Column({ name: 'review_count', default: 0 })
  reviewCount: number;

  @Column({ name: 'average_rating', type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  // Status
  @Column({
    type: 'enum',
    enum: ['draft', 'active', 'archived', 'out_of_stock'],
    default: 'draft',
  })
  status: string;

  @Column({ default: false })
  featured: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'simple-array', nullable: true })
  badges?: string[];

  // Analytics (denormalized)
  @Column({ type: 'jsonb', default: {} })
  analytics: {
    views?: number;
    addToCartCount?: number;
    purchaseCount?: number;
    conversionRate?: number;
    revenueGenerated?: number;
  };

  // Sort order for manual sorting
  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  // Relations
  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'dispensary_id', type: 'uuid', nullable: true })
  dispensaryId: string;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string;

  @Column({ name: 'product_type', length: 50, nullable: true })
  productType: string;

  @Column({ name: 'strain_type', length: 50, nullable: true })
  strainType: string;

  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: true,
    eager: true,
  })
  variants: ProductVariant[];

  @OneToMany(() => ProductImage, (image) => image.product, {
    cascade: true,
    eager: true,
  })
  images: ProductImage[];

  @Column({ name: 'thc_content', type: 'decimal', precision: 5, scale: 2, nullable: true })
  thcContent: number;

  @Column({ name: 'cbd_content', type: 'decimal', precision: 5, scale: 2, nullable: true })
  cbdContent: number;

  @Column({ length: 100, nullable: true })
  manufacturer: string;

}
