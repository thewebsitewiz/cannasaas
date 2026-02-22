/**
 * ═══════════════════════════════════════════════════════════════════
 * useCartTotals — Derived Cart Calculations
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/hooks/useCartTotals.ts
 *
 * Computes all derived values from the Zustand cartStore: subtotal,
 * discount amount, tax estimate, total, item count, and weight
 * totals for purchase limit validation.
 *
 * ─── WHY A SEPARATE HOOK? ───────────────────────────────────────
 *
 *   Totals are DERIVED data — always computable from cart items +
 *   coupon. Storing derived data in the Zustand store creates sync
 *   bugs (item changes but total doesn't update). useMemo ensures
 *   recomputation only when inputs change. This hook centralizes
 *   all cart math in one testable, memoized location.
 *
 * ─── PURCHASE LIMIT CONTEXT ────────────────────────────────────
 *
 *   Cannabis regulations in NY/NJ/CT impose per-transaction limits:
 *     NY: 3oz (84g) flower, 24g concentrate per purchase
 *     NJ: 1oz (28g) flower, 5g concentrate
 *     CT: 1.5oz (42.5g) flower, 5g concentrate
 *   This hook computes weight totals by product category so the
 *   Cart page can show compliance warnings before checkout.
 *
 * @returns {CartTotals} — all computed cart values
 *
 * @example
 *   const { subtotal, discount, total, exceedsLimits } = useCartTotals();
 */

import { useMemo } from 'react';
import { useCartStore } from '@cannasaas/stores';

export interface CartTotals {
  /** Sum of (price × quantity) for all items, before discounts */
  subtotal: number;
  /** Dollar amount removed by active coupon */
  discount: number;
  /** Estimated tax (dispensary-specific rate) */
  taxEstimate: number;
  /** subtotal - discount + taxEstimate */
  total: number;
  /** Total number of units (sum of all quantities) */
  itemCount: number;
  /** Total weight in grams per product category for limit checks */
  weightByCategory: Record<string, number>;
  /** Whether the cart exceeds any known purchase limits */
  exceedsLimits: boolean;
  /** Human-readable limit violation messages (empty if compliant) */
  limitWarnings: string[];
}

/** Default tax rate — overridden by dispensary config at runtime */
const DEFAULT_TAX_RATE = 0.13; // 13% (NY cannabis tax approx.)

/**
 * Per-state purchase limits in grams.
 * TODO: Move to dispensary config (fetched from API) so limits
 * are accurate per-location rather than hardcoded to NY.
 */
const PURCHASE_LIMITS: Record<string, { limit: number; label: string }> = {
  flower:      { limit: 84,   label: '3 oz flower' },
  concentrate: { limit: 24,   label: '24g concentrate' },
  edible:      { limit: 16000, label: '16,000mg edibles' },
};

export function useCartTotals(): CartTotals {
  const items = useCartStore((s) => s.items);
  const coupon = useCartStore((s) => s.appliedCoupon);
  const dispensaryTaxRate = useCartStore((s) => s.dispensaryTaxRate);

  return useMemo(() => {
    const taxRate = dispensaryTaxRate ?? DEFAULT_TAX_RATE;

    // ── Subtotal ──
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // ── Discount from coupon ──
    let discount = 0;
    if (coupon) {
      if (coupon.type === 'percentage') {
        discount = subtotal * (coupon.value / 100);
        if (coupon.maxDiscount != null) {
          discount = Math.min(discount, coupon.maxDiscount);
        }
      } else if (coupon.type === 'fixed') {
        discount = Math.min(coupon.value, subtotal);
      }
    }

    // ── Tax ──
    const taxableAmount = subtotal - discount;
    const taxEstimate = Math.max(taxableAmount * taxRate, 0);

    // ── Total ──
    const total = Math.max(taxableAmount + taxEstimate, 0);

    // ── Item count ──
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    // ── Weight by category ──
    const weightByCategory: Record<string, number> = {};
    for (const item of items) {
      if (item.weightGrams != null && item.category) {
        weightByCategory[item.category] =
          (weightByCategory[item.category] ?? 0) + item.weightGrams * item.quantity;
      }
    }

    // ── Purchase limit check ──
    const limitWarnings: string[] = [];
    for (const [cat, grams] of Object.entries(weightByCategory)) {
      const rule = PURCHASE_LIMITS[cat];
      if (rule && grams > rule.limit) {
        limitWarnings.push(
          `${cat} exceeds the ${rule.label} purchase limit (${grams.toFixed(1)}g in cart).`,
        );
      }
    }

    return {
      subtotal,
      discount,
      taxEstimate,
      total,
      itemCount,
      weightByCategory,
      exceedsLimits: limitWarnings.length > 0,
      limitWarnings,
    };
  }, [items, coupon, dispensaryTaxRate]);
}
