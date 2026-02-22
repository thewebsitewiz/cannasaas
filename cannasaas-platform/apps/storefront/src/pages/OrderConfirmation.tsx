/**
 * @file OrderConfirmation.tsx
 * @app apps/storefront
 *
 * Post-checkout order confirmation page.
 *
 * URL: /orders/:id/confirmation
 *
 * Shows:
 *   - Success animation / checkmark
 *   - Order number
 *   - Fulfillment details (pickup time / delivery estimate)
 *   - CTAs: "Track Order" (→ account/orders/:id) + "Continue Shopping"
 *
 * Calls useOrder(id) to get current status and fulfillment details.
 *
 * Accessibility:
 *   - role="status" on confirmation panel (WCAG 4.1.3)
 *   - <h1> "Order Confirmed" (WCAG 2.4.2)
 *   - aria-live region for order status polling
 */

import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useOrder } from '@cannasaas/api-client';
import { ROUTES } from '../routes';

export function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(id ?? '');

  useEffect(() => {
    document.title = 'Order Confirmed! | CannaSaas';
  }, []);

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      {/* Success animation */}
      <div
        aria-hidden="true"
        className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
      >
        <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div role="status">
        <h1 className="text-3xl font-extrabold text-stone-900 mb-3">Order Confirmed!</h1>
        <p className="text-stone-500 mb-2">
          Thank you for your order.
          {!isLoading && order?.orderNumber && (
            <> Your order number is <strong className="text-stone-900 font-mono">#{order.orderNumber}</strong>.</>
          )}
        </p>

        {!isLoading && order && (
          <div className="mt-4 p-4 bg-stone-50 rounded-2xl border border-stone-100 text-left">
            <p className="text-sm font-semibold text-stone-800 mb-1">
              {order.fulfillmentMethod === 'delivery' ? '🚚 Delivery' : '🏪 In-Store Pickup'}
            </p>
            <p className="text-sm text-stone-600">
              {order.fulfillmentMethod === 'delivery'
                ? 'Estimated delivery: 45–90 minutes'
                : 'Ready for pickup in approximately 30–60 minutes'}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-10 justify-center">
        <Link
          to={ROUTES.accountOrders}
          className={[
            'px-6 py-3 rounded-xl font-semibold text-sm',
            'bg-[hsl(var(--primary))] text-white',
            'hover:brightness-110 transition-all',
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2',
          ].join(' ')}
        >
          Track Order
        </Link>
        <Link
          to={ROUTES.products}
          className={[
            'px-6 py-3 rounded-xl font-medium text-sm',
            'border border-stone-200 text-stone-700',
            'hover:bg-stone-50 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300',
          ].join(' ')}
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
