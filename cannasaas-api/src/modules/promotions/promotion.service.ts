// cannasaas-api/src/modules/promotions/promotion.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion, PromotionType } from './entities/promotion.entity';

@Injectable()
export class PromotionService {
  constructor(
    @InjectRepository(Promotion) private promoRepo: Repository<Promotion>,
  ) {}

  async validate(code: string, orgId: string, cart: {
    total: number; items: { productId: string; categoryId: string;
      quantity: number; price: number }[];
    userId: string;
  }) {
    const promo = await this.promoRepo.findOne({
      where: { code: code.toUpperCase(), organizationId: orgId, active: true },
    });
    if (!promo) throw new BadRequestException('Invalid promo code');

    const now = new Date();
    if (now < promo.startsAt || now > promo.expiresAt)
      throw new BadRequestException('Promo code expired');
    if (promo.usageLimit && promo.usageCount >= promo.usageLimit)
      throw new BadRequestException('Promo code usage limit reached');
    if (cart.total < Number(promo.minimumOrderValue))
      throw new BadRequestException(
        `Minimum order of $${promo.minimumOrderValue} required`);

    return this.calculateDiscount(promo, cart);
  }

  private calculateDiscount(promo: Promotion, cart: any) {
    let discount = 0;
    switch (promo.type) {
      case PromotionType.PERCENTAGE:
        discount = cart.total * (Number(promo.value) / 100);
        if (promo.maximumDiscount)
          discount = Math.min(discount, Number(promo.maximumDiscount));
        break;
      case PromotionType.FIXED_AMOUNT:
        discount = Math.min(Number(promo.value), cart.total);
        break;
      case PromotionType.FREE_SHIPPING:
        discount = cart.shippingCost || 0;
        break;
      case PromotionType.BUY_X_GET_Y:
        const { buyQuantity = 2, getQuantity = 1 } = promo.conditions || {};
        const eligible = cart.items.filter(i =>
          !promo.conditions?.productIds?.length ||
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
}
