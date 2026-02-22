/**
 * @file usePurchaseLimitCheck.ts
 * @app apps/storefront
 *
 * Cannabis purchase limit validation hook.
 *
 * Computes whether adding a specific product variant to the cart would
 * exceed the customer's state-mandated daily purchase limit.
 *
 * Reads:
 *   - usePurchaseLimit() — GET /compliance/purchase-limit (current remaining)
 *   - useCartStore — current cart weight totals
 *
 * Returns:
 *   - canAdd: boolean — whether the variant can be added
 *   - remaining: number (grams) — how much the customer can still buy
 *   - warning: string | null — human-readable warning message if near limit
 *
 * Used by:
 *   - ProductCard "Add to Cart" button (disables if would exceed)
 *   - CartSummary warning banner
 *   - CheckoutPage order validation
 *
 * Compliance note:
 *   This is a CLIENT-SIDE check for UX only. The authoritative check
 *   is always performed server-side in the compliance module on POST /orders.
 *
 * @example
 *   const { canAdd, remaining, warning } = usePurchaseLimitCheck({
 *     variantWeightGrams: 3.5,
 *     quantity: 2,
 *   });
 */

import { usePurchaseLimit } from '@cannasaas/api-client';
import { useAuthStore } from '@cannasaas/stores';

interface CheckParams {
  /** Weight per unit in grams */
  variantWeightGrams: number;
  /** Number of units to add */
  quantity: number;
}

interface LimitCheckResult {
  /** Whether adding these units would stay within the daily limit */
  canAdd: boolean;
  /** Remaining grams the customer can purchase today */
  remainingGrams: number;
  /** Warning message when close to or over limit, null otherwise */
  warning: string | null;
  /** True while compliance/purchase-limit is fetching */
  isLoading: boolean;
}

const WARNING_THRESHOLD_GRAMS = 3.5; // Warn when within 1/8 oz of limit

export function usePurchaseLimitCheck({
  variantWeightGrams,
  quantity,
}: CheckParams): LimitCheckResult {
  const { isAuthenticated } = useAuthStore();
  const { data: limits, isLoading } = usePurchaseLimit();

  // Guests: no limit enforcement client-side (server enforces on checkout)
  if (!isAuthenticated || !limits) {
    return {
      canAdd: true,
      remainingGrams: Infinity,
      warning: null,
      isLoading,
    };
  }

  const totalWeightToAdd = variantWeightGrams * quantity;
  const remainingGrams = limits.remaining.total;
  const canAdd = totalWeightToAdd <= remainingGrams;

  let warning: string | null = null;

  if (!canAdd) {
    warning = `Adding this quantity would exceed your daily purchase limit. You can add up to ${remainingGrams.toFixed(1)}g more today.`;
  } else if (remainingGrams - totalWeightToAdd < WARNING_THRESHOLD_GRAMS) {
    warning = `You're near your daily purchase limit. ${(remainingGrams - totalWeightToAdd).toFixed(1)}g remaining after this purchase.`;
  }

  return { canAdd, remainingGrams, warning, isLoading };
}
