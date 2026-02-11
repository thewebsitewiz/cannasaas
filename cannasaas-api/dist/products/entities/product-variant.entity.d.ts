import { Product } from './product.entity';
export declare class ProductVariant {
    id: string;
    productId: string;
    name: string;
    sku: string;
    price: number;
    compareAtPrice: number;
    quantity: number;
    lowStockThreshold: number;
    weight: number;
    weightUnit: string;
    sortOrder: number;
    isActive: boolean;
    product: Product;
    createdAt: Date;
    updatedAt: Date;
}
