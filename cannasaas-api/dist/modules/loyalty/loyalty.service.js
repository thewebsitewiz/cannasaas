"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var LoyaltyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoyaltyService = exports.LoyaltyTier = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const loyalty_account_entity_1 = require("./entities/loyalty-account.entity");
const loyalty_transaction_entity_1 = require("./entities/loyalty-transaction.entity");
var LoyaltyTier;
(function (LoyaltyTier) {
    LoyaltyTier["BRONZE"] = "bronze";
    LoyaltyTier["SILVER"] = "silver";
    LoyaltyTier["GOLD"] = "gold";
    LoyaltyTier["PLATINUM"] = "platinum";
})(LoyaltyTier || (exports.LoyaltyTier = LoyaltyTier = {}));
const TIER_CONFIG = {
    [LoyaltyTier.BRONZE]: { min: 0, earnRate: 1.0, redeemRate: 100, perks: [] },
    [LoyaltyTier.SILVER]: { min: 500, earnRate: 1.25, redeemRate: 90,
        perks: ['Free shipping on orders > $50'] },
    [LoyaltyTier.GOLD]: { min: 2000, earnRate: 1.5, redeemRate: 80,
        perks: ['Free shipping', 'Early access to new products'] },
    [LoyaltyTier.PLATINUM]: { min: 5000, earnRate: 2.0, redeemRate: 70,
        perks: ['Free shipping', 'Early access', 'Exclusive deals', 'Priority support'] },
};
let LoyaltyService = LoyaltyService_1 = class LoyaltyService {
    constructor(accountRepo, txRepo) {
        this.accountRepo = accountRepo;
        this.txRepo = txRepo;
        this.logger = new common_1.Logger(LoyaltyService_1.name);
    }
    async getOrCreateAccount(userId, orgId) {
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
    async earnPoints(userId, orgId, orderId, amount) {
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
    async redeemPoints(userId, orgId, points) {
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
    calculateTier(lifetime) {
        if (lifetime >= 5000)
            return LoyaltyTier.PLATINUM;
        if (lifetime >= 2000)
            return LoyaltyTier.GOLD;
        if (lifetime >= 500)
            return LoyaltyTier.SILVER;
        return LoyaltyTier.BRONZE;
    }
};
exports.LoyaltyService = LoyaltyService;
exports.LoyaltyService = LoyaltyService = LoyaltyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(loyalty_account_entity_1.LoyaltyAccount)),
    __param(1, (0, typeorm_1.InjectRepository)(loyalty_transaction_entity_1.LoyaltyTransaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], LoyaltyService);
//# sourceMappingURL=loyalty.service.js.map