/**
 * @file Cart.tsx
 * @app apps/storefront
 *
 * Shopping cart page.
 *
 * URL: /cart
 *
 * Layout:
 *   Desktop (lg+): two-column
 *     Left (flex-1):  heading + CartLineItem list
 *     Right (w-80):   CartSummary (sticky)
 *   Mobile (<lg):     heading + items + CartSummary stacked
 *
 * Data sources:
 *   - cartStore (Zustand): items, totals (client-state, instant)
 *   - useCart() (TanStack Query): server-sync for accurate tax/limits
 *
 * On mount, the cart is synced with the server if the user is authenticated.
 * Guests see local cart — they'll be prompted to log in at checkout.
 *
 * Accessibility:
 *   - <h1> "Shopping Cart" with live item count (WCAG 2.4.2)
 *   - Items list: <ul> with role="list" (WCAG 1.3.1)
 *   - Empty state: role="status" (WCAG 4.1.3)
 *   - "Continue Shopping" link (WCAG 2.4.6)
 *   - All totals use aria-live for real-time updates
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore, selectCartItemCount } from '@cannasaas/stores';
import { useCart } from '@cannasaas/api-client';
import { CartLineItem } from '../components/cart/CartLineItem';
import { CartSummary } from '../components/cart/CartSummary';
import { CartEmpty } from '../components/cart/CartEmpty';
import { ROUTES } from '../routes';

export function CartPage() {
  const { items, syncFromServer } = useCartStore();
  const itemCount = useCartStore(selectCartItemCount);

  // Sync with server cart on mount — gets accurate tax, purchase limits
  const { data: serverCart } = useCart();

  useEffect(() => {
    if (serverCart) {
      syncFromServer(serverCart);
    }
  }, [serverCart, syncFromServer]);

  // Update page title
  useEffect(() => {
    document.title = itemCount > 0
      ? `Cart (${itemCount}) | CannaSaas`
      : 'Cart | CannaSaas';
  }, [itemCount]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-stone-900">
          Shopping Cart
          {itemCount > 0 && (
            <span
              aria-live="polite"
              className="ml-2 text-base font-normal text-stone-500"
            >
              ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </span>
          )}
        </h1>

        {items.length > 0 && (
          <Link
            to={ROUTES.products}
            className="text-sm text-[hsl(var(--primary))] hover:underline focus-visible:outline-none focus-visible:underline"
          >
            ← Continue Shopping
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <CartEmpty />
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* ── Cart items list ──────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-3">
            <ul role="list" aria-label="Cart items">
              {items.map((item) => (
                <li key={item.id}>
                  <CartLineItem item={item} />
                </li>
              ))}
            </ul>

            {/* Cart actions */}
            <div className="flex items-center justify-between pt-2">
              <Link
                to={ROUTES.products}
                className={[
                  'flex items-center gap-1.5 text-sm text-stone-600',
                  'hover:text-stone-900 transition-colors',
                  'focus-visible:outline-none focus-visible:underline',
                ].join(' ')}
              >
                <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* ── Order summary sidebar ────────────────────────────────────────── */}
          <div className="w-full lg:w-80 xl:w-96 lg:sticky lg:top-24">
            <CartSummary />
          </div>
        </div>
      )}
    </div>
  );
}
