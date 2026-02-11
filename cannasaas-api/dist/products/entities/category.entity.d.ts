import { Dispensary } from '../../dispensaries/entities/dispensary.entity';
import { Product } from './product.entity';
export declare class Category {
    id: string;
    dispensaryId: string;
    name: string;
    slug: string;
    description: string;
    imageUrl: string;
    sortOrder: number;
    isActive: boolean;
    dispensary: Dispensary;
    products: Product[];
    createdAt: Date;
    updatedAt: Date;
}
