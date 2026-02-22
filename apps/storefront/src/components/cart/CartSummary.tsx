/**
 * @file CartSummary.tsx
 * @description Order summary panel — subtotal, promo, tax, total.
 *
 * Accessibility:
 *   - Summary section uses <section> with aria-label="Order summary"
 *   - Total price announced via aria-live when cart updates
 *   - Promo code input has visible label + error role="alert"
 *   - Checkout button describes its action and disabled state
 *
 * Responsive:
 *   - Mobile: full-width below cart items (stacked)
 *   - lg+: sticky sidebar (position: sticky, top: 2rem)
 *
 * @pattern Presentational — receives data from CartPage, no direct store access
 */

import React, { useState, useId } from 'react';
import type { Cart } from '@cannasaas/types';

interface CartSummaryProps {
  cart: Cart;
  onApplyPromo: (code: string) => Promise<{ success: boolean; error?: string }>;
  onRemovePromo: () => void;
  onCheckout: () => void;
  isLoading?: boolean;
}

export function CartSummary({
  cart,
  onApplyPromo,
  onRemovePromo,
  onCheckout,
  isLoading = false,
}: CartSummaryProps) {
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const promoInputId = useId();
  const promoErrorId = useId();

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    setPromoError(null);
    setIsApplyingPromo(true);

    const result = await onApplyPromo(promoInput.trim().toUpperCase());

    setIsApplyingPromo(false);

    if (result.success) {
      setPromoInput('');
    } else {
      setPromoError(result.error ?? 'Invalid promo code. Please try again.');
    }
  };

  return (
    /**
     * <section> with aria-labelledby ties the heading to the region.
     * Screen readers announce "Order summary region" when navigating
     * by landmark (WCAG 1.3.1, 2.4.6).
     */
    <section
      aria-label="Order summary"
      className="bg-white rounded-2xl border border-gray-100 p-6 lg:sticky lg:top-8"
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>

      {/* ── Line Items ────────────────────────────────────────────────────── */}
      <dl className="space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <dt className="text-gray-600">
            Subtotal ({cart.items.reduce((sum, i) => sum + i.quantity, 0)} items)
          </dt>
          <dd className="font-medium text-gray-900">{formatCurrency(cart.subtotal)}</dd>
        </div>

        {/* Promo discount */}
        {cart.promoDiscount > 0 && cart.appliedPromo && (
          <div className="flex justify-between text-sm">
            <dt className="text-green-700 flex items-center gap-1">
              <span aria-hidden="true">🏷️</span>
              Promo: {cart.appliedPromo.code}
              <button
                type="button"
                onClick={onRemovePromo}
                aria-label={`Remove promo code ${cart.appliedPromo.code}`}
                className="ml-1 text-gray-400 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded"
              >
                <span aria-hidden="true">×</span>
              </button>
            </dt>
            <dd className="font-medium text-green-700">
              −{formatCurrency(cart.promoDiscount)}
            </dd>
          </div>
        )}

        {/* Delivery fee */}
        <div className="flex justify-between text-sm">
          <dt className="text-gray-600">Delivery fee</dt>
          <dd className="font-medium text-gray-900">
            {cart.deliveryFee === 0 ? (
              <span className="text-green-700">Free</span>
            ) : (
              formatCurrency(cart.deliveryFee)
            )}
          </dd>
        </div>

        {/* Tax */}
        <div className="flex justify-between text-sm">
          <dt className="text-gray-600">
            Tax ({(cart.taxRate * 100).toFixed(2)}%)
          </dt>
          <dd className="font-medium text-gray-900">{formatCurrency(cart.tax)}</dd>
        </div>

        {/* Divider */}
        <div
          role="separator"
          aria-hidden="true"
          className="border-t border-gray-100 my-2"
        />

        {/* Total */}
        <div className="flex justify-between">
          <dt className="font-semibold text-gray-900">Total</dt>
          {/*
           * aria-live="polite" — screen reader announces the new total
           * after promo codes or quantity changes update the cart
           * without interrupting other announcements (WCAG 4.1.3).
           */}
          <dd
            aria-live="polite"
            aria-label={`Order total: ${formatCurrency(cart.total)}`}
            className="font-bold text-xl text-gray-900"
          >
            {formatCurrency(cart.total)}
          </dd>
        </div>
      </dl>

      {/* ── Promo Code ────────────────────────────────────────────────────── */}
      {!cart.appliedPromo && (
        <form
          onSubmit={handlePromoSubmit}
          className="mt-6"
          noValidate
          aria-label="Apply a promo code"
        >
          <div>
            {/*
             * Explicit <label> with htmlFor — never use placeholder as label
             * (WCAG 1.3.1, 3.3.2).
             */}
            <label
              htmlFor={promoInputId}
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Promo code
            </label>

            <div className="flex gap-2">
              <input
                id={promoInputId}
                type="text"
                value={promoInput}
                onChange={(e) => {
                  setPromoInput(e.target.value.toUpperCase());
                  setPromoError(null);
                }}
                placeholder="SPRING20"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                disabled={isApplyingPromo || isLoading}
                /**
                 * aria-describedby links the input to the error message.
                 * Only set when there is an error (WCAG 3.3.1).
                 */
                aria-describedby={promoError ? promoErrorId : undefined}
                aria-invalid={promoError ? 'true' : undefined}
                className={[
                  'flex-1 min-w-0 px-3 py-2 text-sm border rounded-lg',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  'disabled:bg-gray-50 disabled:cursor-not-allowed',
                  promoError
                    ? 'border-red-400 focus:ring-red-400'
                    : 'border-gray-200',
                ].join(' ')}
              />

              <button
                type="submit"
                disabled={!promoInput.trim() || isApplyingPromo || isLoading}
                className={[
                  'px-4 py-2 text-sm font-medium rounded-lg',
                  'bg-gray-900 text-white',
                  'hover:bg-gray-700 active:bg-gray-800',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  'focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-gray-400',
                  'transition-colors whitespace-nowrap',
                ].join(' ')}
              >
                {isApplyingPromo ? 'Applying…' : 'Apply'}
              </button>
            </div>

            {/*
             * Error message uses role="alert" so it's announced immediately
             * by screen readers without waiting for focus (WCAG 3.3.1, 4.1.3).
             */}
            {promoError && (
              <p
                id={promoErrorId}
                role="alert"
                className="mt-1.5 text-sm text-red-600"
              >
                {promoError}
              </p>
            )}
          </div>
        </form>
      )}

      {/* ── Checkout CTA ──────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onCheckout}
        disabled={isLoading || cart.items.length === 0 || cart.exceedsPurchaseLimit}
        aria-describedby={cart.exceedsPurchaseLimit ? 'purchase-limit-warning' : undefined}
        className={[
          'mt-6 w-full py-3.5 px-6 rounded-xl',
          'font-semibold text-white text-base',
          'bg-[hsl(var(--primary))] hover:brightness-110 active:brightness-95',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2',
          'transition-all duration-150',
        ].join(' ')}
      >
        {isLoading ? 'Processing…' : 'Proceed to Checkout'}
      </button>

      {/* Purchase limit warning */}
      {cart.exceedsPurchaseLimit && (
        <p
          id="purchase-limit-warning"
          role="alert"
          className="mt-3 text-sm text-amber-700 bg-amber-50 rounded-lg p-3"
        >
          ⚠️ Your cart exceeds the daily cannabis purchase limit for your state.
          Please reduce quantities to continue.
        </p>
      )}

      {/* Legal notice */}
      <p className="mt-4 text-xs text-gray-400 text-center">
        Cannabis purchases are subject to applicable state and local taxes.
        Must be 21+ to purchase.
      </p>
    </section>
  );
}
