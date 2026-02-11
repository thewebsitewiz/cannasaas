import { Category } from './category.entity';
import { ProductImage } from './product-image.entity';
import { ProductVariant } from './product-variant.entity';
export declare enum ProductType {
    FLOWER = "flower",
    EDIBLE = "edible",
    CONCENTRATE = "concentrate",
    VAPE = "vape",
    TOPICAL = "topical",
    TINCTURE = "tincture",
    PRE_ROLL = "pre_roll",
    ACCESSORY = "accessory"
}
export declare enum StrainType {
    SATIVA = "sativa",
    INDICA = "indica",
    HYBRID = "hybrid",
    CBD = "cbd"
}
export declare class Product {
    id: string;
    dispensaryId: string;
    categoryId: string;
    name: string;
    slug: string;
    description: string;
    productType: ProductType;
    strainType: StrainType;
    thcContent: number;
    cbdContent: number;
    brand: string;
    manufacturer: string;
    licenseNumber: string;
    batchNumber: string;
    labTested: boolean;
    labResultsUrl: string;
    metaTitle: string;
    metaDescription: string;
    tags: string[];
    isActive: boolean;
    isFeatured: boolean;
    category: Category;
    variants: ProductVariant[];
    images: ProductImage[];
    createdAt: Date;
    updatedAt: Date;
}
