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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const promotion_entity_1 = require("./entities/promotion.entity");
let PromotionService = class PromotionService {
    constructor(promoRepo) {
        this.promoRepo = promoRepo;
    }
    async validate(code, orgId, cart) {
        const promo = await this.promoRepo.findOne({
            where: { code: code.toUpperCase(), organizationId: orgId, active: true },
        });
        if (!promo)
            throw new common_1.BadRequestException('Invalid promo code');
        const now = new Date();
        if (now < promo.startsAt || now > promo.expiresAt)
            throw new common_1.BadRequestException('Promo code expired');
        if (promo.usageLimit && promo.usageCount >= promo.usageLimit)
            throw new common_1.BadRequestException('Promo code usage limit reached');
        if (cart.total < Number(promo.minimumOrderValue))
            throw new common_1.BadRequestException(`Minimum order of $${promo.minimumOrderValue} required`);
        return this.calculateDiscount(promo, cart);
    }
    calculateDiscount(promo, cart) {
        let discount = 0;
        switch (promo.type) {
            case promotion_entity_1.PromotionType.PERCENTAGE:
                discount = cart.total * (Number(promo.value) / 100);
                if (promo.maximumDiscount)
                    discount = Math.min(discount, Number(promo.maximumDiscount));
                break;
            case promotion_entity_1.PromotionType.FIXED_AMOUNT:
                discount = Math.min(Number(promo.value), cart.total);
                break;
            case promotion_entity_1.PromotionType.FREE_SHIPPING:
                discount = cart.shippingCost || 0;
                break;
            case promotion_entity_1.PromotionType.BUY_X_GET_Y:
                const { buyQuantity = 2, getQuantity = 1 } = promo.conditions || {};
                const eligible = cart.items.filter(i => !promo.conditions?.productIds?.length ||
                    promo.conditions.productIds.includes(i.productId));
                const totalQty = eligible.reduce((s, i) => s + i.quantity, 0);
                const sets = Math.floor(totalQty / (buyQuantity + getQuantity));
                const cheapest = eligible.sort((a, b) => a.price - b.price);
                discount = cheapest.slice(0, sets * getQuantity)
                    .reduce((s, i) => s + i.price, 0);
                break;
        }
        return {
            promoId: promo.id, code: promo.code, type: promo.type,
            discount: Math.round(discount * 100) / 100,
            description: promo.name,
        };
    }
};
exports.PromotionService = PromotionService;
exports.PromotionService = PromotionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(promotion_entity_1.Promotion)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PromotionService);
//# sourceMappingURL=promotion.service.js.map