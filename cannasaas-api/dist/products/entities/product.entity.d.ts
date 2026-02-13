import { TenantBaseEntity } from '../../common/entities/base.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductImage } from './product-image.entity';
export declare enum ProductType {
    FLOWER = "flower",
    PRE_ROLLS = "pre_rolls",
    VAPES = "vapes",
    EDIBLES = "edibles",
    CONCENTRATES = "concentrates",
    TINCTURES = "tinctures",
    TOPICALS = "topicals",
    ACCESSORIES = "accessories",
    APPAREL = "apparel",
    OTHER = "other"
}
export declare enum StrainType {
    SATIVA = "sativa",
    INDICA = "indica",
    HYBRID = "hybrid",
    SATIVA_DOMINANT = "sativa_dominant",
    INDICA_DOMINANT = "indica_dominant"
}
export declare class Product extends TenantBaseEntity {
    name: string;
    slug: string;
    sku?: string;
    shortDescription?: string;
    longDescription?: string;
    description?: string;
    aiDescription?: string;
    aiDescriptionGeneratedAt?: Date;
    category: string;
    subcategory?: string;
    tags?: string[];
    brand?: {
        name: string;
        logo?: string;
    };
    cannabisInfo: {
        strain?: {
            name?: string;
            type?: string;
            genetics?: string;
        };
        cannabinoids?: {
            thc?: {
                percentage: number;
                min?: number;
                max?: number;
            };
            cbd?: {
                percentage: number;
                min?: number;
                max?: number;
            };
            cbg?: {
                percentage: number;
            };
            cbn?: {
                percentage: number;
            };
        };
        terpenes?: Array<{
            name: string;
            percentage: number;
        }>;
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
    terpenes?: string[];
    price?: number;
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        keywords?: string[];
    };
    reviewCount: number;
    averageRating: number;
    status: string;
    featured: boolean;
    isActive: boolean;
    isFeatured: boolean;
    badges?: string[];
    analytics: {
        views?: number;
        addToCartCount?: number;
        purchaseCount?: number;
        conversionRate?: number;
        revenueGenerated?: number;
    };
    sortOrder: number;
    organization: Organization;
    dispensaryId: string;
    categoryId: string;
    productType: string;
    strainType: string;
    variants: ProductVariant[];
    images: ProductImage[];
    thcContent: number;
    cbdContent: number;
    manufacturer: string;
}
