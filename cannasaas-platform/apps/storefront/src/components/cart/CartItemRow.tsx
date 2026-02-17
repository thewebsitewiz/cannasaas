/**
 * ═══════════════════════════════════════════════════════════════════
 * CartItemRow — Single Line Item with Quantity Adjuster
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/cart/CartItemRow.tsx
 *
 * Renders one cart item: thumbnail, product name + variant, unit
 * price, quantity adjuster (−/+), line total, and remove button.
 *
 * ─── LAYOUT (DESKTOP md+) ──────────────────────────────────────
 *
 *   ┌────┬─────────────────────┬───────┬──────────┬────────┬───┐
 *   │ 🖼 │ Blue Dream          │ $45   │ [−] 2 [+]│ $90.00 │ ✕ │
 *   │    │ 3.5g · Pacific Roots│       │          │        │   │
 *   └────┴─────────────────────┴───────┴──────────┴────────┴───┘
 *
 * ─── LAYOUT (MOBILE < md) ──────────────────────────────────────
 *
 *   ┌────┬─────────────────────────────┐
 *   │ 🖼 │ Blue Dream               ✕  │
 *   │    │ 3.5g · Pacific Roots        │
 *   │    │ $45 × [−] 2 [+]   = $90.00 │
 *   └────┴─────────────────────────────┘
 *
 * ─── STATE ─────────────────────────────────────────────────────
 *
 *   Calls useCartStore.updateQuantity() and .removeItem() directly.
 *   These Zustand actions perform optimistic updates and sync with
 *   the Sprint 5 cart API in the background. Decrementing below 1
 *   triggers removeItem (the − button becomes a trash icon at qty=1).
 *
 * ─── ACCESSIBILITY (WCAG) ──────────────────────────────────────
 *
 *   - <article> wraps each item with aria-label for context (4.1.2)
 *   - Quantity: role="spinbutton" with aria-valuenow/min/max (4.1.2)
 *   - −/+ buttons: aria-label "Decrease quantity of Blue Dream" (4.1.2)
 *   - Remove: aria-label "Remove Blue Dream from cart" (4.1.2)
 *   - Line total: aria-live="polite" announces price changes
 *   - All touch targets: min-w-[44px] min-h-[44px] (2.5.8)
 *   - focus-visible rings on all interactive elements (2.4.7)
 *   - Thumbnail link is aria-hidden (decorative duplicate of name link)
 *   - tabular-nums on prices for consistent digit alignment
 *
 * ─── RESPONSIVE ────────────────────────────────────────────────
 *
 *   - Thumbnail: w-20 h-20 mobile → w-24 h-24 sm+
 *   - Stacked layout mobile, inline row on md+
 *   - Unit price column: hidden mobile, visible sm+
 *   - Remove button: icon-only always (space-efficient)
 */

import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '@cannasaas/stores';
import { formatCurrency } from '@cannasaas/utils';
import type { CartItem } from '@cannasaas/types';

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const lineTotal = item.price * item.quantity;

  const increment = useCallback(() => {
    updateQuantity(item.variantId, Math.min(item.quantity + 1, 99));
  }, [updateQuantity, item.variantId, item.quantity]);

  const decrement = useCallback(() => {
    if (item.quantity <= 1) {
      removeItem(item.variantId);
    } else {
      updateQuantity(item.variantId, item.quantity - 1);
    }
  }, [updateQuantity, removeItem, item.variantId, item.quantity]);

  const handleRemove = useCallback(() => {
    removeItem(item.variantId);
  }, [removeItem, item.variantId]);

  return (
    <article
      aria-label={`${item.name}, ${item.variantName ?? ''}, quantity ${item.quantity}`}
      className="
        flex gap-3 sm:gap-4
        py-4 sm:py-5
        border-b border-border last:border-b-0
      "
    >
      {/* ── Thumbnail ──
          aria-hidden + tabIndex=-1: the product name link below
          is the accessible way to navigate; the thumbnail is a
          decorative shortcut for sighted mouse users. */}
      <Link
        to={`/products/${item.productId}`}
        className="
          flex-shrink-0
          w-20 h-20 sm:w-24 sm:h-24
          rounded-xl overflow-hidden bg-muted
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-primary focus-visible:ring-offset-2
        "
        tabIndex={-1}
        aria-hidden="true"
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            width={96}
            height={96}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl" aria-hidden="true">
            🌿
          </div>
        )}
      </Link>

      {/* ── Details Container ── */}
      <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">

        {/* Name + variant + brand */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link
              to={`/products/${item.productId}`}
              className="
                font-semibold text-sm sm:text-base leading-tight
                hover:text-primary transition-colors
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-primary focus-visible:ring-offset-1
                rounded-sm line-clamp-2
              "
            >
              {item.name}
            </Link>

            {/* Remove — mobile: positioned top-right of name block */}
            <button
              onClick={handleRemove}
              aria-label={`Remove ${item.name} from cart`}
              className="
                md:hidden flex-shrink-0
                w-8 h-8 min-w-[44px] min-h-[44px]
                flex items-center justify-center rounded-lg
                text-muted-foreground hover:text-destructive hover:bg-destructive/10
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-destructive focus-visible:ring-offset-1
                transition-colors
              "
            >
              <span aria-hidden="true" className="text-sm">✕</span>
            </button>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {[item.variantName, item.brand].filter(Boolean).join(' · ')}
          </p>

          {/* Unit price — mobile only (inline with name) */}
          <p className="text-xs text-muted-foreground mt-1 md:hidden">
            {formatCurrency(item.price)} each
          </p>
        </div>

        {/* Unit price — desktop column */}
        <div className="hidden md:block w-20 text-right flex-shrink-0">
          <span className="text-sm text-muted-foreground tabular-nums">
            {formatCurrency(item.price)}
          </span>
        </div>

        {/* ── Quantity Adjuster ── */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={decrement}
            aria-label={
              item.quantity <= 1
                ? `Remove ${item.name} from cart`
                : `Decrease quantity of ${item.name}`
            }
            className="
              w-8 h-8 min-w-[44px] min-h-[44px]
              flex items-center justify-center
              rounded-lg border border-border
              text-xs font-medium
              hover:bg-muted
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-primary focus-visible:ring-offset-1
              transition-colors
            "
          >
            {/* Trash icon at quantity 1, minus otherwise */}
            {item.quantity <= 1 ? '🗑' : '−'}
          </button>

          <span
            role="spinbutton"
            aria-valuenow={item.quantity}
            aria-valuemin={1}
            aria-valuemax={99}
            aria-label={`Quantity of ${item.name}`}
            className="
              w-10 h-8
              flex items-center justify-center
              text-sm font-semibold tabular-nums
              border border-border rounded-lg
            "
          >
            {item.quantity}
          </span>

          <button
            onClick={increment}
            disabled={item.quantity >= 99}
            aria-label={`Increase quantity of ${item.name}`}
            className="
              w-8 h-8 min-w-[44px] min-h-[44px]
              flex items-center justify-center
              rounded-lg border border-border
              text-xs font-medium
              disabled:opacity-40 disabled:cursor-not-allowed
              hover:bg-muted
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-primary focus-visible:ring-offset-1
              transition-colors
            "
          >
            +
          </button>
        </div>

        {/* ── Line Total ── */}
        <div
          className="w-24 text-right flex-shrink-0"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="text-sm sm:text-base font-bold tabular-nums">
            {formatCurrency(lineTotal)}
          </span>
        </div>

        {/* ── Remove — Desktop (hidden on mobile, shown above) ── */}
        <button
          onClick={handleRemove}
          aria-label={`Remove ${item.name} from cart`}
          className="
            hidden md:flex flex-shrink-0
            w-8 h-8 min-w-[44px] min-h-[44px]
            items-center justify-center rounded-lg
            text-muted-foreground hover:text-destructive hover:bg-destructive/10
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-destructive focus-visible:ring-offset-1
            transition-colors
          "
        >
          <span aria-hidden="true" className="text-sm">✕</span>
        </button>
      </div>
    </article>
  );
}
