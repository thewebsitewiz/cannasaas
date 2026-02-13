// cannasaas-api/src/modules/loyalty/loyalty.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyAccount } from './entities/loyalty-account.entity';
import { LoyaltyTransaction } from './entities/loyalty-transaction.entity';

export enum LoyaltyTier {
  BRONZE = 'bronze',    // 0-499 points
  SILVER = 'silver',    // 500-1999 points
  GOLD = 'gold',        // 2000-4999 points
  PLATINUM = 'platinum'  // 5000+ points
}

const TIER_CONFIG = {
  [LoyaltyTier.BRONZE]:   { min: 0,    earnRate: 1.0, redeemRate: 100, perks: [] },
  [LoyaltyTier.SILVER]:   { min: 500,  earnRate: 1.25, redeemRate: 90,
    perks: ['Free shipping on orders > $50'] },
  [LoyaltyTier.GOLD]:     { min: 2000, earnRate: 1.5, redeemRate: 80,
    perks: ['Free shipping', 'Early access to new products'] },
  [LoyaltyTier.PLATINUM]: { min: 5000, earnRate: 2.0, redeemRate: 70,
    perks: ['Free shipping', 'Early access', 'Exclusive deals', 'Priority support'] },
};

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(
    @InjectRepository(LoyaltyAccount) private accountRepo: Repository<LoyaltyAccount>,
    @InjectRepository(LoyaltyTransaction) private txRepo: Repository<LoyaltyTransaction>,
  ) {}

  async getOrCreateAccount(userId: string, orgId: string) {
    let account = await this.accountRepo.findOne({
      where: { userId, organizationId: orgId },
    });
    if (!account) {
      account = this.accountRepo.create({
        userId, organizationId: orgId,
        balance: 0, lifetimePoints: 0, tier: LoyaltyTier.BRONZE,
      });
      await this.accountRepo.save(account);
    }
    return account;
  }

  async earnPoints(userId: string, orgId: string, orderId: string, amount: number) {
    const account = await this.getOrCreateAccount(userId, orgId);
    const config = TIER_CONFIG[account.tier];
    const points = Math.floor(amount * config.earnRate);

    account.balance += points;
    account.lifetimePoints += points;
    account.tier = this.calculateTier(account.lifetimePoints);
    await this.accountRepo.save(account);

    await this.txRepo.save(this.txRepo.create({
      accountId: account.id, type: 'earn', points,
      orderId, description: `Earned ${points} pts on order`,
    }));

    return { pointsEarned: points, newBalance: account.balance, tier: account.tier };
  }

  async redeemPoints(userId: string, orgId: string, points: number) {
    const account = await this.getOrCreateAccount(userId, orgId);
    if (account.balance < points) {
      throw new Error(`Insufficient points. Have ${account.balance}, need ${points}`);
    }

    const config = TIER_CONFIG[account.tier];
    const discount = (points / config.redeemRate);

    account.balance -= points;
    await this.accountRepo.save(account);

    await this.txRepo.save(this.txRepo.create({
      accountId: account.id, type: 'redeem', points: -points,
      description: `Redeemed ${points} pts for $${discount.toFixed(2)} off`,
    }));

    return { pointsRedeemed: points, discountAmount: discount,
      remainingBalance: account.balance };
  }

  private calculateTier(lifetime: number): LoyaltyTier {
    if (lifetime >= 5000) return LoyaltyTier.PLATINUM;
    if (lifetime >= 2000) return LoyaltyTier.GOLD;
    if (lifetime >= 500) return LoyaltyTier.SILVER;
    return LoyaltyTier.BRONZE;
  }
}
