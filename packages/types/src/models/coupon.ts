/**
 * @file coupon.ts
 * @package @cannasaas/types
 *
 * Coupon / promo code types — mirrors the Promotions module entity:
 *   src/promotions/entities/promotion.entity.ts
 *
 * Used by:
 *   POST /cart/promo      (apply)
 *   DELETE /cart/promo    (remove)
 *   GET  /promotions      (admin list)
 *   POST /promotions      (admin create)
 */

/**
 * How the discount value is applied to the cart subtotal.
 * - `flat`       — deduct a fixed dollar amount, e.g. "$5 off"
 * - `percentage` — deduct a percentage, e.g. "15% off"
 * - `bogo`       — buy-one-get-one (requires `bogoProductId` on the entity)
 * - `free_item`  — adds a specific product variant for free
 */
export type DiscountType = 'flat' | 'percentage' | 'bogo' | 'free_item';

/**
 * Which products / categories the coupon applies to.
 * `all` means the coupon applies to the entire cart subtotal.
 */
export type CouponScope = 'all' | 'category' | 'product' | 'variant';

/**
 * A promotional coupon code as returned by the admin API.
 */
export interface Coupon {
  id: string;
  organizationId: string;
  dispensaryId?: string | null;

  /** The customer-facing redemption code, e.g. "SPRING20" */
  code: string;

  /** Short description shown in cart after successful application */
  description: string;

  discountType: DiscountType;

  /**
   * Discount value:
   *   - flat: dollar amount (e.g. 5.00)
   *   - percentage: percent (e.g. 20 for 20%)
   *   - bogo / free_item: ignored (logic on backend)
   */
  discountValue: number;

  scope: CouponScope;

  /** Populated when scope is 'category' */
  applicableCategories?: string[];
  /** Populated when scope is 'product' */
  applicableProductIds?: string[];

  /** Minimum cart subtotal before the coupon is valid */
  minimumOrderAmount?: number | null;

  /** Maximum total discount in dollars (caps percentage discounts) */
  maximumDiscountAmount?: number | null;

  /** ISO 8601 validity window */
  startsAt: string;
  expiresAt: string | null;

  /** How many times this coupon can be redeemed across all customers */
  usageLimit?: number | null;
  /** How many times this coupon has been redeemed so far */
  usageCount: number;

  /** Per-customer redemption cap */
  perCustomerLimit?: number | null;

  /** Whether single-use: once redeemed it becomes inactive */
  isSingleUse: boolean;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Lightweight coupon result returned after POST /cart/promo.
 * Avoids exposing full coupon configuration to the storefront.
 */
export interface AppliedCoupon {
  code: string;
  description: string;
  discountType: DiscountType;
  discountAmount: number;
}
