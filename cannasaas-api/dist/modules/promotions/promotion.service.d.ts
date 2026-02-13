import { Repository } from 'typeorm';
import { Promotion, PromotionType } from './entities/promotion.entity';
export declare class PromotionService {
    private promoRepo;
    constructor(promoRepo: Repository<Promotion>);
    validate(code: string, orgId: string, cart: {
        total: number;
        items: {
            productId: string;
            categoryId: string;
            quantity: number;
            price: number;
        }[];
        userId: string;
    }): Promise<{
        promoId: string;
        code: string;
        type: PromotionType;
        discount: number;
        description: string;
    }>;
    private calculateDiscount;
}
