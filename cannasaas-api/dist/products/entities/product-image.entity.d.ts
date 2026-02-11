import { Product } from './product.entity';
export declare class ProductImage {
    id: string;
    productId: string;
    imageUrl: string;
    altText: string;
    isPrimary: boolean;
    sortOrder: number;
    product: Product;
    createdAt: Date;
}
