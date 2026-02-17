/**
 * ═══════════════════════════════════════════════════════════════════
 * CartItemList — Sectioned List of Cart Line Items
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/cart/CartItemList.tsx
 *
 * Wraps all CartItemRow components inside a semantic list with a
 * "Clear All" action and column labels on desktop.
 *
 * ─── COLUMN HEADERS (VISIBLE md+ ONLY) ─────────────────────────
 *
 *   Product        Price     Qty       Total
 *   ─────────────────────────────────────────
 *   [CartItemRow]
 *   [CartItemRow]
 *   [CartItemRow]
 *
 *   Column labels are aria-hidden decorative hints (not a data
 *   table) because each CartItemRow is a self-contained <article>
 *   with its own ARIA labels.
 *
 * Accessibility (WCAG):
 *   - <section> with aria-labelledby heading (1.3.1)
 *   - Heading includes dynamic item count via aria-live (4.1.3)
 *   - "Clear All" requires confirmation (prevents accidental loss)
 *   - role="list" / role="listitem" for semantic grouping (1.3.1)
 *
 * Responsive:
 *   - Column headers: hidden below md
 *   - Items render identically; CartItemRow handles its own layout
 */

import { useState, useCallback } from 'react';
import { useCartStore } from '@cannasaas/stores';
import { CartItemRow } from './CartItemRow';

export function CartItemList() {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = useCallback(() => {
    if (confirmClear) {
      clearCart();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => setConfirmClear(false), 3000);
    }
  }, [confirmClear, clearCart]);

  return (
    <section aria-labelledby="cart-items-heading">
      {/* Header row: title + clear all */}
      <div className="flex items-center justify-between mb-4">
        <h2
          id="cart-items-heading"
          className="text-lg sm:text-xl font-bold"
          aria-live="polite"
          aria-atomic="true"
        >
          Cart Items ({items.length})
        </h2>

        {items.length > 1 && (
          <button
            onClick={handleClear}
            aria-label={confirmClear ? 'Confirm: clear all items from cart' : 'Clear all items from cart'}
            className={`
              text-xs sm:text-sm font-medium rounded-lg
              px-3 py-1.5 min-h-[44px]
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-destructive focus-visible:ring-offset-1
              transition-colors
              ${confirmClear
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'}
            `}
          >
            {confirmClear ? 'Confirm Clear All?' : 'Clear All'}
          </button>
        )}
      </div>

      {/* Column headers — md+ only, decorative */}
      <div
        className="
          hidden md:flex items-center gap-4
          pb-2 border-b border-border
          text-xs font-medium text-muted-foreground uppercase tracking-wider
        "
        aria-hidden="true"
      >
        <div className="w-24 flex-shrink-0" />   {/* Thumbnail */}
        <div className="flex-1">Product</div>
        <div className="w-20 text-right">Price</div>
        <div className="w-[108px] text-center">Qty</div>
        <div className="w-24 text-right">Total</div>
        <div className="w-8" />                   {/* Remove */}
      </div>

      {/* Item list */}
      <div role="list">
        {items.map((item) => (
          <div role="listitem" key={item.variantId}>
            <CartItemRow item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
