/**
 * @file CartSummary.tsx
 * @app apps/storefront
 *
 * Order summary panel — right column on the cart page.
 *
 * Shows:
 *   Subtotal
 *   Promo discount (if applied)
 *   Tax (server-calculated)
 *   Delivery fee (0 for pickup)
 *   ─────────────────────────
 *   Order total
 *
 *   PromoCodeInput
 *   "Proceed to Checkout" button
 *   Purchase limit warning (if near/over limit)
 *   Dispensary info (tax rate explanation)
 *
 * Accessibility:
 *   - <dl> (description list) for price breakdown (WCAG 1.3.1)
 *   - Total: aria-live="polite" updates when cart changes (WCAG 4.1.3)
 *   - Checkout button: descriptive aria-label with total amount
 *   - Warning banner: role="alert" (WCAG 4.1.3)
 */

import { selectIsCartEmpty, useCartStore } from '@cannasaas/stores';

import { Link } from 'react-router-dom';
import { PromoCodeInput } from './PromoCodeInput';
import { ROUTES } from '../../routes';
import { useAuthStore } from '@cannasaas/stores';
import { usePurchaseLimit } from '@cannasaas/api-client';

export function CartSummary() {
  const {
    subtotal,
    promoDiscount,
    tax,
    deliveryFee,
    total,
    exceedsPurchaseLimit,
  } = useCartStore();
  const isEmpty = useCartStore(selectIsCartEmpty);
  const { isAuthenticated } = useAuthStore();
  const { data: limits } = usePurchaseLimit();

  return (
    <aside
      aria-label="Order summary"
      className="bg-white rounded-2xl border border-stone-100 p-5 space-y-5"
    >
      <h2 className="text-base font-bold text-stone-900">Order Summary</h2>

      {/* Price breakdown */}
      <dl className="space-y-2.5" aria-label="Price breakdown">
        <div className="flex justify-between text-sm">
          <dt className="text-stone-600">Subtotal</dt>
          <dd className="font-medium text-stone-900">${subtotal.toFixed(2)}</dd>
        </div>

        {promoDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <dt className="text-green-600">Promo Discount</dt>
            <dd className="font-medium text-green-600">
              −${promoDiscount.toFixed(2)}
            </dd>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <dt className="text-stone-600">
            Estimated Tax
            <span className="text-xs text-stone-400 block">
              Calculated at checkout
            </span>
          </dt>
          <dd className="font-medium text-stone-900">
            {tax > 0 ? `$${tax.toFixed(2)}` : '—'}
          </dd>
        </div>

        {deliveryFee >= 0 && (
          <div className="flex justify-between text-sm">
            <dt className="text-stone-600">Delivery</dt>
            <dd className="font-medium text-stone-900">
              {deliveryFee === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                `$${deliveryFee.toFixed(2)}`
              )}
            </dd>
          </div>
        )}

        <div
          role="separator"
          aria-hidden="true"
          className="border-t border-stone-100 my-1"
        />

        <div className="flex justify-between">
          <dt className="font-bold text-stone-900">Total</dt>
          <dd>
            <output
              aria-live="polite"
              aria-label={`Order total: $${total.toFixed(2)}`}
              className="text-lg font-extrabold text-stone-900"
            >
              ${total.toFixed(2)}
            </output>
          </dd>
        </div>
      </dl>

      {/* Promo code input */}
      <PromoCodeInput />

      {/* Purchase limit warning */}
      {exceedsPurchaseLimit && (
        <div
          role="alert"
          className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 leading-relaxed"
        >
          <p className="font-semibold mb-0.5">⚠ Purchase Limit Exceeded</p>
          <p>
            Your cart exceeds your state-mandated daily purchase limit. Please
            reduce quantities to proceed.
            {limits?.remaining && (
              <> Remaining today: {limits.remaining.total.toFixed(1)}g</>
            )}
          </p>
        </div>
      )}

      {/* Checkout CTA */}
      {isAuthenticated ? (
        <Link
          to={ROUTES.checkout}
          aria-label={`Proceed to checkout — total $${total.toFixed(2)}`}
          aria-disabled={isEmpty || exceedsPurchaseLimit}
          className={[
            'block w-full text-center py-3.5 rounded-xl',
            'font-semibold text-sm text-white',
            'transition-all',
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2',
            isEmpty || exceedsPurchaseLimit
              ? 'bg-stone-200 text-stone-400 pointer-events-none'
              : 'bg-[hsl(var(--primary))] hover:brightness-110 active:scale-[0.99] shadow-lg shadow-[hsl(var(--primary)/0.3)]',
          ].join(' ')}
        >
          Proceed to Checkout
        </Link>
      ) : (
        <Link
          to={ROUTES.login}
          state={{ from: ROUTES.cart }}
          className={[
            'block w-full text-center py-3.5 rounded-xl',
            'font-semibold text-sm',
            'bg-stone-900 text-white',
            'hover:bg-stone-700 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900',
          ].join(' ')}
        >
          Sign In to Checkout
        </Link>
      )}

      <p className="text-[11px] text-center text-stone-400">
        🔒 Secure checkout · Cannabis sales are final per state law
      </p>
    </aside>
  );
}
