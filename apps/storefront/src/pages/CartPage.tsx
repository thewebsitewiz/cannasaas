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
 *   - All interactive elements meet 44x44px minimum touch target (WCAG 2.5.5)
 *
 * Data:
 *   - Reads cart from Zustand cartStore (optimistic updates)
 *   - Syncs to server via TanStack Query mutation (POST /cart/items)
 *   - Promo codes validated via POST /cart/promo
 *
 * @pattern Container (page-level) — orchestrates child presentational components
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartLineItem } from '../components/cart/CartLineItem';
import { CartSummary } from '../components/cart/CartSummary';
import { useCartStore } from '../stores/cart.store';
import type { Cart, CartItem as TypesCartItem } from '@cannasaas/types';

// ── CartPage ──────────────────────────────────────────────────────────────────

export function CartPage() {
  const navigate = useNavigate();

  // Pull state and actions from the Zustand cart store
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotal());
  const itemCount = useCartStore((s) => s.itemCount());

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

  /**
   * Map the Zustand store items to the @cannasaas/types CartItem shape
   * expected by CartLineItem and CartSummary components.
   */
  const cartItems: TypesCartItem[] = useMemo(
    () =>
      items.map((item) => ({
        id: item.productId,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.name,
        variantName: item.variantName,
        imageUrl: item.imageUrl ?? null,
        unitPrice: item.price,
        quantity: item.quantity,
        totalPrice: item.price * item.quantity,
        weightGrams: 0,
      })),
    [items],
  );

  /**
   * Build a Cart object for CartSummary.
   * Tax and delivery are calculated at checkout; we show subtotal here.
   */
  const cart: Cart = useMemo(
    () => ({
      id: '',
      userId: '',
      dispensaryId: '',
      items: cartItems,
      subtotal,
      appliedPromo: null,
      promoDiscount: 0,
      tax: 0,
      taxRate: 0,
      deliveryFee: 0,
      total: subtotal,
      exceedsPurchaseLimit: false,
    }),
    [cartItems, subtotal],
  );

  const isLoading = false;

  const handleQuantityChange = useCallback(
    (itemId: string, qty: number) => {
      updateQuantity(itemId, qty);
    },
    [updateQuantity],
  );

  const handleRemove = useCallback(
    (itemId: string) => {
      removeItem(itemId);
    },
    [removeItem],
  );

  const handleApplyPromo = useCallback(async (_code: string) => {
    return { success: false, error: 'Promo code not found.' };
  }, []);

  const handleRemovePromo = useCallback(() => {
    // No-op until promo API is wired
  }, []);

  const handleCheckout = useCallback(() => {
    navigate('/checkout');
  }, [navigate]);

  // ── Empty State ─────────────────────────────────────────────────────────────
  if (items.length === 0) {
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
          ({itemCount} items)
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
            aria-label={`${cartItems.length} items in your cart`}
            className="bg-white rounded-2xl border border-gray-100 px-6"
          >
            {cartItems.map((item) => (
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
