import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
export declare class AiDescriptionService {
    private productRepo;
    private readonly anthropic;
    constructor(productRepo: Repository<Product>);
    generateDescription(productId: string, options?: {
        tone?: 'professional' | 'casual' | 'medical' | 'luxury';
        maxLength?: number;
    }): Promise<{
        productId: string;
        description: string;
    }>;
    bulkGenerate(orgId: string, productIds: string[], tone?: string): Promise<any[]>;
}
