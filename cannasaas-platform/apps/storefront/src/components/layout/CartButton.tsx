/**
 * @file CartButton.tsx
 * @app apps/storefront
 *
 * Cart icon button with live item count badge.
 *
 * Reads item count from Zustand cartStore — updates instantly on every
 * add/remove action without server round-trips.
 *
 * Accessibility:
 *   - aria-label announces both the button action AND the count:
 *     "Shopping cart, 3 items" — so screen readers don't need to read the badge
 *   - The badge has aria-hidden="true" — it's supplementary to the aria-label
 *   - Count changes trigger aria-live announcement via a visually hidden span
 *     (WCAG 4.1.3 — Status Messages)
 *
 * Animation:
 *   - Badge pulses (scale animation) whenever count increases
 *   - CSS-only, no JS timer needed (driven by the key prop trick)
 */

import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore, selectCartItemCount } from '@cannasaas/stores';
import { ROUTES } from '../../routes';

export function CartButton() {
  const itemCount = useCartStore(selectCartItemCount);
  const prevCountRef = useRef(itemCount);
  const badgeKey = useRef(0); // Increment to re-trigger CSS animation

  useEffect(() => {
    if (itemCount > prevCountRef.current) {
      badgeKey.current += 1;
    }
    prevCountRef.current = itemCount;
  }, [itemCount]);

  return (
    <Link
      to={ROUTES.cart}
      aria-label={
        itemCount === 0
          ? 'Shopping cart, empty'
          : `Shopping cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`
      }
      className={[
        'relative flex-shrink-0 w-10 h-10',
        'flex items-center justify-center',
        'rounded-lg text-stone-600 hover:bg-stone-100',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-[hsl(var(--primary))]',
        'transition-colors',
      ].join(' ')}
    >
      {/* Cart bag SVG icon */}
      <svg
        aria-hidden="true"
        className="w-5 h-5"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>

      {/* Item count badge */}
      {itemCount > 0 && (
        <span
          key={badgeKey.current}  // Re-trigger animation on count increase
          aria-hidden="true"
          className={[
            'absolute -top-1 -right-1',
            'min-w-[18px] h-[18px] px-1',
            'flex items-center justify-center',
            'rounded-full text-[10px] font-bold leading-none text-white',
            'bg-[hsl(var(--primary))]',
            'animate-[badge-pop_0.2s_ease-out]',
          ].join(' ')}
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}

      {/*
       * Visually hidden live region announces count changes to screen readers.
       * Uses aria-live="polite" — doesn't interrupt reading (WCAG 4.1.3).
       */}
      <span aria-live="polite" className="sr-only">
        {itemCount > 0 ? `${itemCount} items in cart` : 'Cart is empty'}
      </span>
    </Link>
  );
}
