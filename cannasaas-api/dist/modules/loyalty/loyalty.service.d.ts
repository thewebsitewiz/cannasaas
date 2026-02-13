import { Repository } from 'typeorm';
import { LoyaltyAccount } from './entities/loyalty-account.entity';
import { LoyaltyTransaction } from './entities/loyalty-transaction.entity';
export declare enum LoyaltyTier {
    BRONZE = "bronze",
    SILVER = "silver",
    GOLD = "gold",
    PLATINUM = "platinum"
}
export declare class LoyaltyService {
    private accountRepo;
    private txRepo;
    private readonly logger;
    constructor(accountRepo: Repository<LoyaltyAccount>, txRepo: Repository<LoyaltyTransaction>);
    getOrCreateAccount(userId: string, orgId: string): Promise<LoyaltyAccount>;
    earnPoints(userId: string, orgId: string, orderId: string, amount: number): Promise<{
        pointsEarned: number;
        newBalance: number;
        tier: string;
    }>;
    redeemPoints(userId: string, orgId: string, points: number): Promise<{
        pointsRedeemed: number;
        discountAmount: number;
        remainingBalance: number;
    }>;
    private calculateTier;
}
