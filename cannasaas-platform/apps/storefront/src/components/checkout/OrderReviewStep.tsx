/**
 * @file OrderReviewStep.tsx
 * @app apps/storefront
 *
 * Checkout Step 3 — Order review + place order button.
 *
 * Shows a read-only summary of:
 *   - Cart items (name, variant, qty, price)
 *   - Fulfillment method + address / pickup location
 *   - Payment method
 *   - Price breakdown (subtotal, tax, total)
 *
 * "Place Order" triggers POST /orders, then POST /payments if card.
 *
 * On success: navigate to /orders/:id/confirmation
 * On error: show error banner with retry option
 *
 * Accessibility:
 *   - Review sections use <section> + <h3> hierarchy (WCAG 1.3.1)
 *   - Error: role="alert" (WCAG 4.1.3)
 *   - Processing state: aria-busy, descriptive aria-label (WCAG 4.1.2)
 */

import { useCartStore } from '@cannasaas/stores';
import type { FulfillmentFormValues } from './FulfillmentStep';

interface OrderReviewStepProps {
  fulfillmentData: FulfillmentFormValues;
  paymentMethod: 'card' | 'cash';
  onBack: () => void;
  onPlaceOrder: () => void;
  isPlacing: boolean;
  placeOrderError: string | null;
}

export function OrderReviewStep({
  fulfillmentData,
  paymentMethod,
  onBack,
  onPlaceOrder,
  isPlacing,
  placeOrderError,
}: OrderReviewStepProps) {
  const { items, subtotal, tax, deliveryFee, promoDiscount, total } = useCartStore();

  return (
    <div aria-label="Order review" className="space-y-6">
      {/* ── Items summary ─────────────────────────────────────────────────── */}
      <section aria-labelledby="review-items-heading">
        <h3 id="review-items-heading" className="text-sm font-bold text-stone-900 mb-3">
          Items ({items.length})
        </h3>
        <ul role="list" className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt=""
                    aria-hidden="true"
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="text-stone-800 font-medium line-clamp-1">{item.productName}</p>
                  <p className="text-xs text-stone-500">{item.variantName} × {item.quantity}</p>
                </div>
              </div>
              <p className="font-semibold text-stone-900 ml-3 flex-shrink-0">
                ${item.totalPrice.toFixed(2)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Fulfillment ───────────────────────────────────────────────────── */}
      <section aria-labelledby="review-fulfillment-heading" className="pt-4 border-t border-stone-100">
        <h3 id="review-fulfillment-heading" className="text-sm font-bold text-stone-900 mb-2">
          {fulfillmentData.method === 'delivery' ? 'Delivery Address' : 'Pickup Location'}
        </h3>
        {fulfillmentData.method === 'delivery' && 'address' in fulfillmentData ? (
          <address className="text-sm text-stone-600 not-italic">
            {fulfillmentData.address.street}{fulfillmentData.address.apt ? `, ${fulfillmentData.address.apt}` : ''}<br />
            {fulfillmentData.address.city}, {fulfillmentData.address.state} {fulfillmentData.address.zip}
          </address>
        ) : (
          <p className="text-sm text-stone-600">In-store pickup</p>
        )}
      </section>

      {/* ── Payment ───────────────────────────────────────────────────────── */}
      <section aria-labelledby="review-payment-heading" className="pt-4 border-t border-stone-100">
        <h3 id="review-payment-heading" className="text-sm font-bold text-stone-900 mb-2">
          Payment
        </h3>
        <p className="text-sm text-stone-600">
          {paymentMethod === 'card' ? '💳 Credit / Debit Card' : '💵 Cash'}
        </p>
      </section>

      {/* ── Price breakdown ───────────────────────────────────────────────── */}
      <section aria-labelledby="review-total-heading" className="pt-4 border-t border-stone-100">
        <h3 id="review-total-heading" className="sr-only">Price breakdown</h3>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between text-stone-600">
            <dt>Subtotal</dt><dd>${subtotal.toFixed(2)}</dd>
          </div>
          {promoDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <dt>Discount</dt><dd>−${promoDiscount.toFixed(2)}</dd>
            </div>
          )}
          <div className="flex justify-between text-stone-600">
            <dt>Tax</dt><dd>${tax.toFixed(2)}</dd>
          </div>
          {deliveryFee > 0 && (
            <div className="flex justify-between text-stone-600">
              <dt>Delivery</dt><dd>${deliveryFee.toFixed(2)}</dd>
            </div>
          )}
          <div className="flex justify-between font-bold text-stone-900 pt-2 border-t border-stone-100">
            <dt>Total</dt>
            <dd className="text-lg">${total.toFixed(2)}</dd>
          </div>
        </dl>
      </section>

      {/* Error message */}
      {placeOrderError && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <p className="font-semibold">Order failed</p>
          <p>{placeOrderError}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isPlacing}
          className="flex-1 py-3 rounded-xl font-medium text-sm border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 disabled:opacity-50"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onPlaceOrder}
          disabled={isPlacing}
          aria-busy={isPlacing}
          aria-label={isPlacing ? 'Placing your order…' : `Place order — $${total.toFixed(2)}`}
          className={[
            'flex-[2] py-3 rounded-xl font-bold text-sm text-white',
            'bg-[hsl(var(--primary))] hover:brightness-110',
            'disabled:opacity-70 disabled:cursor-wait',
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2',
            'transition-all active:scale-[0.99]',
            'shadow-xl shadow-[hsl(var(--primary)/0.4)]',
          ].join(' ')}
        >
          {isPlacing ? '⏳ Placing Order…' : `Place Order · $${total.toFixed(2)}`}
        </button>
      </div>

      <p className="text-[11px] text-center text-stone-400">
        By placing this order you agree to our Terms of Service.
        Cannabis sales are final per applicable state law.
        Must be 21+ to purchase.
      </p>
    </div>
  );
}
