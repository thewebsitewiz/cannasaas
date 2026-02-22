/**
 * @file CartPage.tsx
 * @description Full cart page — aggregates CartLineItem and CartSummary.
 *
 * Page Structure:
 *   <main>
 *     <h1> Shopping Cart
 *     <div>  (two-col grid on lg+)
 *       <section> Cart line items (ul > li)
 *       <aside>   Order summary + promo + checkout
 *
 * Accessibility:
 *   - <main> landmark with id="main-content" for skip link target
 *   - Page title set via document.title on mount
 *   - Empty cart state has a descriptive message and CTA
 *   - Loading state announced via aria-busy on the item list
 *   - All interactive elements meet 44×44px minimum touch target (WCAG 2.5.5)
 *
 * Data:
 *   - Reads cart from Zustand cartStore (optimistic updates)
 *   - Syncs to server via TanStack Query mutation (POST /cart/items)
 *   - Promo codes validated via POST /cart/promo
 *
 * @pattern Container (page-level) — orchestrates child presentational components
 */

import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartLineItem } from '../components/cart/CartLineItem';
import { CartSummary } from '../components/cart/CartSummary';
import type { Cart } from '@cannasaas/types';

// ── Mock / Replace with real store hooks ──────────────────────────────────────
// In the real app:
//   import { useCartStore } from '@cannasaas/stores';
//   import { useUpdateCartItem, useRemoveCartItem, useApplyPromo } from '@cannasaas/api-client';

// Placeholder cart for development until API hooks are wired
const MOCK_CART: Cart = {
  id: 'cart-1',
  userId: 'user-1',
  dispensaryId: 'disp-1',
  items: [
    {
      id: 'item-1',
      productId: 'prod-1',
      variantId: 'var-1',
      productName: 'Blue Dream',
      variantName: '1/8 oz',
      unitPrice: 45.00,
      quantity: 2,
      totalPrice: 90.00,
      weightGrams: 3.5,
      imageUrl: null,
    },
  ],
  subtotal: 90.00,
  appliedPromo: null,
  promoDiscount: 0,
  tax: 18.68,
  taxRate: 0.2075,
  deliveryFee: 0,
  total: 108.68,
  exceedsPurchaseLimit: false,
};

// ── CartPage ──────────────────────────────────────────────────────────────────

export function CartPage() {
  const navigate = useNavigate();

  /**
   * Set descriptive page title on mount.
   * Browsers read this in the tab and screen readers announce it on page load.
   * (WCAG 2.4.2 — Page Titled)
   */
  useEffect(() => {
    document.title = 'Shopping Cart — CannaSaas';
    return () => {
      document.title = 'CannaSaas';
    };
  }, []);

  // In real app: const cart = useCartStore(s => s) + mutation hooks
  const cart = MOCK_CART;
  const isLoading = false;

  const handleQuantityChange = useCallback((itemId: string, qty: number) => {
    // TODO: useCartStore.updateQuantity(itemId, qty) + server sync mutation
    console.log('Update quantity', itemId, qty);
  }, []);

  const handleRemove = useCallback((itemId: string) => {
    // TODO: useCartStore.removeItem(itemId) + server mutation
    console.log('Remove item', itemId);
  }, []);

  const handleApplyPromo = useCallback(async (code: string) => {
    // TODO: POST /cart/promo mutation
    console.log('Apply promo', code);
    return { success: false, error: 'Promo code not found.' };
  }, []);

  const handleRemovePromo = useCallback(() => {
    // TODO: DELETE /cart/promo mutation
    console.log('Remove promo');
  }, []);

  const handleCheckout = useCallback(() => {
    navigate('/checkout');
  }, [navigate]);

  // ── Empty State ─────────────────────────────────────────────────────────────
  if (!cart || cart.items.length === 0) {
    return (
      <main id="main-content" className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div aria-hidden="true" className="text-6xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h1>
        <p className="text-gray-500 mb-8">
          Add some products to get started.
        </p>
        <a
          href="/products"
          className={[
            'inline-flex items-center px-6 py-3 rounded-xl',
            'bg-[hsl(var(--primary))] text-white font-semibold',
            'hover:brightness-110 transition-all',
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2',
          ].join(' ')}
        >
          Browse Products
        </a>
      </main>
    );
  }

  // ── Cart With Items ──────────────────────────────────────────────────────────
  return (
    <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Page heading */}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
        Shopping Cart{' '}
        <span className="text-gray-400 font-normal text-xl">
          ({cart.items.reduce((s, i) => s + i.quantity, 0)} items)
        </span>
      </h1>

      {/*
       * Two-column layout on lg+:
       *   - Left: cart items (grows to fill available space)
       *   - Right: sticky summary (fixed 384px width)
       *
       * On mobile/tablet, columns stack vertically (summary below items).
       */}
      <div className="lg:grid lg:grid-cols-[1fr_24rem] lg:gap-8 space-y-6 lg:space-y-0">
        {/* ── Item List ────────────────────────────────────────────────────── */}
        <section aria-label="Cart items">
          {/*
           * aria-busy — announced while server is syncing cart changes.
           * The content remains visible (not replaced with a spinner) to
           * prevent layout shift (WCAG 3.2.2).
           */}
          <ul
            aria-busy={isLoading}
            aria-label={`${cart.items.length} items in your cart`}
            className="bg-white rounded-2xl border border-gray-100 px-6"
          >
            {cart.items.map((item) => (
              <CartLineItem
                key={item.id}
                item={item}
                onQuantityChange={handleQuantityChange}
                onRemove={handleRemove}
                isDisabled={isLoading}
              />
            ))}
          </ul>

          {/* Continue shopping link */}
          <a
            href="/products"
            className={[
              'inline-flex items-center gap-2 mt-4',
              'text-sm text-gray-500 hover:text-gray-900',
              'focus-visible:outline-none focus-visible:underline',
              'transition-colors',
            ].join(' ')}
          >
            <span aria-hidden="true">←</span> Continue shopping
          </a>
        </section>

        {/* ── Order Summary ─────────────────────────────────────────────────── */}
        <aside>
          <CartSummary
            cart={cart}
            onApplyPromo={handleApplyPromo}
            onRemovePromo={handleRemovePromo}
            onCheckout={handleCheckout}
            isLoading={isLoading}
          />
        </aside>
      </div>
    </main>
  );
}
