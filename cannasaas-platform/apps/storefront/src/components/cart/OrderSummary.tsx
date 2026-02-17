/**
 * ═══════════════════════════════════════════════════════════════════
 * OrderSummary — Totals Sidebar with Checkout CTA
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/cart/OrderSummary.tsx
 *
 * Displays the computed cart totals (subtotal, discount, tax, total),
 * embeds the CouponInput, and provides the checkout navigation CTA.
 * On desktop this is a sticky sidebar; on mobile it stacks below
 * the cart items.
 *
 * ─── LAYOUT ────────────────────────────────────────────────────
 *
 *   ┌─────────────────────────┐
 *   │ Order Summary           │
 *   │                         │
 *   │ Subtotal        $135.00 │
 *   │ Discount (20%)  −$27.00 │  ← only if coupon applied
 *   │ Est. Tax         $14.04 │
 *   │ ─────────────────────── │
 *   │ Total           $122.04 │
 *   │                         │
 *   │ [Have a promo code?]    │  ← CouponInput
 *   │                         │
 *   │ [ Proceed to Checkout ] │  ← disabled if limits exceeded
 *   │                         │
 *   │ or Continue Shopping →  │
 *   └─────────────────────────┘
 *
 * ─── STICKY BEHAVIOR ───────────────────────────────────────────
 *
 *   On lg+, the summary uses position: sticky so it floats as
 *   the user scrolls through long cart item lists. top-24 keeps
 *   it below the header.
 *
 * Accessibility (WCAG):
 *   - <section> with aria-labelledby heading (1.3.1)
 *   - All prices use tabular-nums for digit alignment
 *   - Discount line has sr-only "discount" label
 *   - Total is visually prominent (text-2xl bold)
 *   - Checkout button: aria-disabled + aria-describedby when
 *     purchase limits exceeded (explains WHY it's disabled)
 *   - "Continue Shopping" link has focus-visible ring (2.4.7)
 *   - Tax disclaimer uses <small> for de-emphasis
 *
 * Responsive:
 *   - Full-width card on mobile, sticky sidebar on lg+
 *   - Padding: p-4 mobile → p-5 sm → p-6 lg
 *   - Total text: text-xl mobile → text-2xl sm
 */

import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '@cannasaas/utils';
import { CouponInput } from './CouponInput';
import type { CartTotals } from '@/hooks/useCartTotals';

interface OrderSummaryProps {
  totals: CartTotals;
}

export function OrderSummary({ totals }: OrderSummaryProps) {
  const navigate = useNavigate();
  const {
    subtotal,
    discount,
    taxEstimate,
    total,
    itemCount,
    exceedsLimits,
  } = totals;

  const handleCheckout = () => {
    if (exceedsLimits) return;
    navigate('/checkout');
  };

  return (
    <section
      aria-labelledby="order-summary-heading"
      className="
        lg:sticky lg:top-24
        bg-background border border-border
        rounded-xl
        p-4 sm:p-5 lg:p-6
        space-y-4
      "
    >
      <h2 id="order-summary-heading" className="text-lg font-bold">
        Order Summary
      </h2>

      {/* ── Line items breakdown ── */}
      <dl className="space-y-2.5 text-sm">
        {/* Subtotal */}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})
          </dt>
          <dd className="font-medium tabular-nums">
            {formatCurrency(subtotal)}
          </dd>
        </div>

        {/* Discount — only shown when a coupon is applied */}
        {discount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <dt>
              Discount
              <span className="sr-only"> applied</span>
            </dt>
            <dd className="font-medium tabular-nums">
              −{formatCurrency(discount)}
            </dd>
          </div>
        )}

        {/* Tax estimate */}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Est. Tax</dt>
          <dd className="font-medium tabular-nums">
            {formatCurrency(taxEstimate)}
          </dd>
        </div>

        {/* Divider */}
        <hr className="border-border" aria-hidden="true" />

        {/* Total */}
        <div className="flex justify-between items-baseline">
          <dt className="text-base sm:text-lg font-bold">Total</dt>
          <dd className="text-xl sm:text-2xl font-bold tabular-nums">
            {formatCurrency(total)}
          </dd>
        </div>
      </dl>

      {/* Tax disclaimer */}
      <small className="block text-xs text-muted-foreground">
        Tax calculated at checkout. Final total may vary.
      </small>

      {/* ── Coupon Input ── */}
      <div className="pt-1">
        <CouponInput />
      </div>

      {/* ── Checkout CTA ── */}
      <button
        onClick={handleCheckout}
        disabled={exceedsLimits}
        aria-disabled={exceedsLimits || undefined}
        aria-describedby={exceedsLimits ? 'limit-warning-checkout' : undefined}
        className="
          w-full py-3.5 min-h-[48px]
          bg-primary text-primary-foreground
          rounded-xl font-semibold text-sm sm:text-base
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:bg-primary/90
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-primary focus-visible:ring-offset-2
          transition-colors
        "
      >
        {exceedsLimits ? 'Reduce Cart to Checkout' : 'Proceed to Checkout'}
      </button>

      {/* Hidden description for disabled state — screen readers only */}
      {exceedsLimits && (
        <p id="limit-warning-checkout" className="sr-only">
          Checkout is disabled because your cart exceeds state purchase limits.
          Please reduce quantities before proceeding.
        </p>
      )}

      {/* Continue Shopping */}
      <Link
        to="/products"
        className="
          block text-center text-sm font-medium
          text-muted-foreground hover:text-primary
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-primary focus-visible:ring-offset-1
          rounded-sm transition-colors
        "
      >
        or Continue Shopping
        <span aria-hidden="true"> →</span>
      </Link>
    </section>
  );
}
