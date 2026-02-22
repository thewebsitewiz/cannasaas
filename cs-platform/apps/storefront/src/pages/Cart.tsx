/**
 * ═══════════════════════════════════════════════════════════════════
 * CannaSaas Storefront — Cart Page (Orchestrator)
 * ═══════════════════════════════════════════════════════════════════
 *
 * File:   apps/storefront/src/pages/Cart.tsx
 * Route:  /cart
 *
 * Thin orchestrator that reads from the Zustand cartStore, computes
 * derived totals via useCartTotals, and composes the cart UI.
 *
 * ─── DATA FLOW ─────────────────────────────────────────────────
 *
 *   cartStore (Zustand)
 *       │
 *       ├─→ items[]                → CartItemList → CartItemRow[]
 *       ├─→ appliedCoupon          → CouponInput (applied state)
 *       └─→ dispensaryTaxRate      ─┐
 *                                    ├→ useCartTotals() ─→ OrderSummary
 *       items + coupon + taxRate  ──┘                   ─→ PurchaseLimitWarning
 *
 *   User actions flow back INTO the store:
 *     CartItemRow  → updateQuantity(), removeItem()
 *     CouponInput  → setCoupon(), removeCoupon()
 *     CartItemList → clearCart()
 *     OrderSummary → navigate('/checkout')
 *
 * ─── LAYOUT ────────────────────────────────────────────────────
 *
 *   Desktop (lg+):
 *   ┌─────────────────────────────────────────────────────┐
 *   │ 🛒 Your Cart                                        │
 *   ├─────────────────────────────┬───────────────────────┤
 *   │                             │                       │
 *   │  [Purchase Limit Warning]   │  Order Summary        │
 *   │                             │  (sticky sidebar)     │
 *   │  Product  Price  Qty  Total │                       │
 *   │  ────────────────────────── │  Subtotal     $135.00 │
 *   │  [CartItemRow]              │  Discount     −$27.00 │
 *   │  [CartItemRow]              │  Est. Tax      $14.04 │
 *   │  [CartItemRow]              │  ──────────────────── │
 *   │                             │  Total        $122.04 │
 *   │                             │                       │
 *   │                             │  [Promo code?]        │
 *   │                             │  [Proceed to Checkout]│
 *   │                             │  or Continue Shopping  │
 *   └─────────────────────────────┴───────────────────────┘
 *
 *   Mobile (< lg): Same content stacked vertically.
 *   Warning → Items → Summary. Summary has the CTA.
 *
 * ─── EMPTY STATE ───────────────────────────────────────────────
 *
 *   When items.length === 0, the entire page is replaced by
 *   EmptyCart (illustration + "Browse Products" CTA).
 *
 * ─── SEO / HEAD ────────────────────────────────────────────────
 *
 *   <title>Cart — {dispensary.name}</title>
 *   noindex: cart pages should not be indexed.
 *
 * ─── FILE MAP ──────────────────────────────────────────────────
 *
 *   hooks/
 *     useCartTotals.ts              Derived totals + purchase limits
 *
 *   components/cart/
 *     EmptyCart.tsx                  Empty state illustration + CTA
 *     CartItemRow.tsx               Single line item with qty adjuster
 *     CartItemList.tsx              Sectioned list + Clear All + headers
 *     CouponInput.tsx               Expandable promo code (Sprint 5 API)
 *     PurchaseLimitWarning.tsx      Compliance alert banner
 *     OrderSummary.tsx              Totals sidebar + Checkout CTA
 */

import { useCartStore } from '@cannasaas/stores';
import { useCartTotals } from '@/hooks/useCartTotals';
import {
  EmptyCart,
  CartItemList,
  PurchaseLimitWarning,
  OrderSummary,
} from '@/components/cart';

export default function Cart() {
  const items = useCartStore((s) => s.items);
  const totals = useCartTotals();

  // ── Empty State ──
  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <EmptyCart />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* ══════════════════════════════════════════════════
          PAGE HEADER
          ══════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Your Cart
        </h1>
        <span className="text-sm text-muted-foreground">
          {totals.itemCount} item{totals.itemCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ══════════════════════════════════════════════════
          PURCHASE LIMIT WARNING
          ══════════════════════════════════════════════════
          Full-width above the 2-column layout so it's
          impossible to miss. Uses role="alert" for
          immediate screen reader announcement. */}
      {totals.exceedsLimits && (
        <div className="mb-6">
          <PurchaseLimitWarning warnings={totals.limitWarnings} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          MAIN LAYOUT — Items + Summary
          ══════════════════════════════════════════════════
          2-column on lg+: items left (flex-1), summary
          right (w-[360px] sticky). Stacked on mobile. */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
        {/* ── Left: Cart Items ── */}
        <div className="flex-1 min-w-0">
          <CartItemList />
        </div>

        {/* ── Right: Order Summary (sticky on lg+) ── */}
        <div className="w-full lg:w-[360px] flex-shrink-0">
          <OrderSummary totals={totals} />
        </div>
      </div>
    </main>
  );
}
