import { ProductType, StrainType } from '../entities/product.entity';
export declare class CreateVariantDto {
    name: string;
    sku?: string;
    price: number;
    compareAtPrice?: number;
    quantity?: number;
    weight?: number;
    weightUnit?: string;
}
export declare class CreateProductDto {
    dispensaryId: string;
    categoryId: string;
    name: string;
    slug: string;
    description?: string;
    productType: ProductType;
    strainType?: StrainType;
    thcContent?: number;
    cbdContent?: number;
    brand?: string;
    manufacturer?: string;
    licenseNumber?: string;
    batchNumber?: string;
    labTested?: boolean;
    tags?: string[];
    isFeatured?: boolean;
    variants: CreateVariantDto[];
}
