import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);

  constructor(@InjectDataSource() private ds: DataSource) {}

  // ═══ READ ═══

  async findById(promoId: string): Promise<any> {
    const [row] = await this.ds.query(
      `SELECT promo_id as "promoId", dispensary_id as "dispensaryId",
        name, description, type, code,
        discount_value as "discountValue", minimum_order_total as "minimumOrderTotal",
        max_uses as "maxUses", uses_count as "usesCount", max_uses_per_customer as "maxUsesPerCustomer",
        applies_to as "appliesTo", applies_to_product_type_id as "appliesToProductTypeId",
        applies_to_brand_id as "appliesToBrandId", applies_to_tax_category_id as "appliesToTaxCategoryId",
        stackable_with_others as "stackableWithOthers",
        is_staff_discount as "isStaffDiscount", is_medical_discount as "isMedicalDiscount",
        start_at as "startAt", end_at as "endAt", is_active as "isActive",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM promotions WHERE promo_id = $1`,
      [promoId],
    );
    if (!row) throw new NotFoundException('Promotion not found');
    return row;
  }

  async findByDispensary(dispensaryId: string, limit = 50, offset = 0): Promise<any[]> {
    return this.ds.query(
      `SELECT promo_id as "promoId", dispensary_id as "dispensaryId",
        name, description, type, code,
        discount_value as "discountValue", minimum_order_total as "minimumOrderTotal",
        max_uses as "maxUses", uses_count as "usesCount",
        is_active as "isActive", start_at as "startAt", end_at as "endAt",
        created_at as "createdAt"
      FROM promotions WHERE dispensary_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [dispensaryId, limit, offset],
    );
  }

  async getActivePromotions(dispensaryId: string): Promise<any[]> {
    return this.ds.query(
      `SELECT promo_id as "promoId", dispensary_id as "dispensaryId",
        name, description, type, code,
        discount_value as "discountValue", minimum_order_total as "minimumOrderTotal",
        applies_to as "appliesTo", stackable_with_others as "stackableWithOthers",
        is_staff_discount as "isStaffDiscount", is_medical_discount as "isMedicalDiscount",
        start_at as "startAt", end_at as "endAt"
      FROM promotions
      WHERE dispensary_id = $1 AND is_active = true
        AND (start_at IS NULL OR start_at <= NOW())
        AND (end_at IS NULL OR end_at >= NOW())
      ORDER BY created_at DESC`,
      [dispensaryId],
    );
  }

  // ═══ CREATE ═══

  async create(dispensaryId: string, input: {
    name: string; description?: string; type: string; code?: string;
    discountValue: number; minimumOrderTotal?: number;
    maxUses?: number; maxUsesPerCustomer?: number;
    appliesTo?: string; appliesToProductTypeId?: number;
    appliesToBrandId?: string; appliesToTaxCategoryId?: number;
    stackableWithOthers?: boolean;
    isStaffDiscount?: boolean; isMedicalDiscount?: boolean;
    startAt?: string; endAt?: string;
  }): Promise<any> {
    const [row] = await this.ds.query(
      `INSERT INTO promotions (dispensary_id, name, description, type, code,
        discount_value, minimum_order_total, max_uses, max_uses_per_customer,
        applies_to, applies_to_product_type_id, applies_to_brand_id, applies_to_tax_category_id,
        stackable_with_others, is_staff_discount, is_medical_discount,
        start_at, end_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [dispensaryId, input.name, input.description || null, input.type, input.code || null,
        input.discountValue, input.minimumOrderTotal || null,
        input.maxUses || null, input.maxUsesPerCustomer || null,
        input.appliesTo || null, input.appliesToProductTypeId || null,
        input.appliesToBrandId || null, input.appliesToTaxCategoryId || null,
        input.stackableWithOthers || false,
        input.isStaffDiscount || false, input.isMedicalDiscount || false,
        input.startAt || null, input.endAt || null],
    );
    this.logger.log('Promotion created: ' + row.name + ' (' + row.promo_id + ')');
    return this.findById(row.promo_id);
  }

  // ═══ UPDATE ═══

  async update(promoId: string, input: {
    name?: string; description?: string; code?: string;
    discountValue?: number; minimumOrderTotal?: number;
    maxUses?: number; maxUsesPerCustomer?: number;
    appliesTo?: string; stackableWithOthers?: boolean;
    startAt?: string; endAt?: string;
  }): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const map: Record<string, string> = {
      name: 'name', description: 'description', code: 'code',
      discountValue: 'discount_value', minimumOrderTotal: 'minimum_order_total',
      maxUses: 'max_uses', maxUsesPerCustomer: 'max_uses_per_customer',
      appliesTo: 'applies_to', stackableWithOthers: 'stackable_with_others',
      startAt: 'start_at', endAt: 'end_at',
    };

    for (const [key, col] of Object.entries(map)) {
      if ((input as any)[key] !== undefined) {
        fields.push(col + ' = $' + idx);
        values.push((input as any)[key]);
        idx++;
      }
    }

    if (fields.length === 0) return this.findById(promoId);

    values.push(promoId);
    await this.ds.query(
      'UPDATE promotions SET ' + fields.join(', ') + ', updated_at = NOW() WHERE promo_id = $' + idx,
      values,
    );

    this.logger.log('Promotion updated: ' + promoId);
    return this.findById(promoId);
  }

  // ═══ ACTIVATE / DEACTIVATE ═══

  async activate(promoId: string): Promise<any> {
    await this.ds.query('UPDATE promotions SET is_active = true, updated_at = NOW() WHERE promo_id = $1', [promoId]);
    this.logger.log('Promotion activated: ' + promoId);
    return this.findById(promoId);
  }

  async deactivate(promoId: string): Promise<any> {
    await this.ds.query('UPDATE promotions SET is_active = false, updated_at = NOW() WHERE promo_id = $1', [promoId]);
    this.logger.log('Promotion deactivated: ' + promoId);
    return this.findById(promoId);
  }

  // ═══ ELIGIBILITY ═══

  async checkEligibility(promoId: string, orderTotal: number, customerId?: string): Promise<any> {
    const promo = await this.findById(promoId);

    if (!promo.isActive) return { eligible: false, reason: 'Promotion is not active' };

    if (promo.startAt && new Date(promo.startAt) > new Date()) {
      return { eligible: false, reason: 'Promotion has not started yet' };
    }
    if (promo.endAt && new Date(promo.endAt) < new Date()) {
      return { eligible: false, reason: 'Promotion has expired' };
    }

    if (promo.maxUses && promo.usesCount >= promo.maxUses) {
      return { eligible: false, reason: 'Promotion has reached maximum uses' };
    }

    if (promo.minimumOrderTotal && orderTotal < parseFloat(promo.minimumOrderTotal)) {
      return { eligible: false, reason: 'Order total does not meet minimum of $' + promo.minimumOrderTotal };
    }

    if (customerId && promo.maxUsesPerCustomer) {
      const [usage] = await this.ds.query(
        "SELECT COUNT(*) as count FROM promotions WHERE promo_id = $1",
        [promoId],
      );
      // Customer usage tracking would be on order-level; simplified check
    }

    return { eligible: true, promotion: promo };
  }

  async applyDiscount(promoId: string, orderTotal: number): Promise<any> {
    const promo = await this.findById(promoId);

    let discount = 0;
    if (promo.type === 'percentage') {
      discount = orderTotal * (parseFloat(promo.discountValue) / 100);
    } else if (promo.type === 'fixed') {
      discount = Math.min(parseFloat(promo.discountValue), orderTotal);
    } else if (promo.type === 'bogo') {
      discount = 0; // BOGO handled at item level
    }

    // Increment uses count
    await this.ds.query('UPDATE promotions SET uses_count = uses_count + 1, updated_at = NOW() WHERE promo_id = $1', [promoId]);

    this.logger.log('Discount applied: promo=' + promoId + ' discount=$' + discount.toFixed(2));
    return {
      promoId: promo.promoId,
      promoName: promo.name,
      type: promo.type,
      discountAmount: parseFloat(discount.toFixed(2)),
      newTotal: parseFloat((orderTotal - discount).toFixed(2)),
    };
  }

  // ═══ PROMO PRODUCTS & CATEGORIES ═══

  async getPromotionProducts(promoId: string): Promise<any[]> {
    return this.ds.query(
      `SELECT id, promo_id as "promoId", product_id as "productId", variant_id as "variantId", is_eligible as "isEligible"
      FROM promotion_products WHERE promo_id = $1`,
      [promoId],
    );
  }

  async getPromotionCategories(promoId: string): Promise<any[]> {
    return this.ds.query(
      `SELECT id, promo_id as "promoId", category_id as "categoryId", is_eligible as "isEligible"
      FROM promotion_categories WHERE promo_id = $1`,
      [promoId],
    );
  }
}
