/**
 * @file CartButton.tsx
 * @path apps/storefront/src/layouts/StorefrontLayout/components/Header/components/CartButton/CartButton.tsx
 *
 * Header cart icon button displaying an animated item-count badge.
 *
 * ─── WCAG 2.1 AA COMPLIANCE ────────────────────────────────────────────────
 *   • aria-label includes the live item count so screen readers announce it.
 *   • Badge count is wrapped in aria-hidden – the count is conveyed by aria-label.
 *   • aria-live="off" on the button; count changes are announced by the
 *     status region in CartStore (global pattern, avoids double-announcing).
 *   • Minimum 44×44px touch target.
 *   • Focus ring passes 3:1 contrast ratio against both light and dark surfaces.
 *
 * ─── ADVANCED REACT PATTERNS ───────────────────────────────────────────────
 *   • Subscribes to `useCartItemCount()` – a pinpoint selector that only
 *     re-renders when the count integer changes, not on any cart mutation.
 *   • Badge visibility is CSS-driven (opacity + scale) to allow transitions
 *     without mounting/unmounting (avoids layout thrash during animation).
 *   • useCartStore().openCart() is called on click – keeps cart open/close
 *     logic inside the store, not scattered across components.
 */

import React, { useEffect, useRef } from 'react';
import { useCartItemCount, useCartStore } from '../../../../../../stores/cartStore';
import styles from './CartButton.module.css';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CartButtonProps {
  /** Additional class for positioning within the header flex row */
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CartButton
 *
 * Renders a shopping bag icon button with an animated badge showing the
 * current cart item count. Clicking opens the cart drawer via cartStore.
 *
 * The badge "pops" (scale bounce) whenever the count increases, giving the
 * user clear visual feedback that an item was added.
 *
 * @example
 * <CartButton className={styles.cartButton} />
 */
export function CartButton({ className }: CartButtonProps) {
  // Pinpoint selector — only re-renders when the integer changes
  const itemCount = useCartItemCount();
  const openCart = useCartStore((s) => s.openCart);

  // Track previous count to detect increases (triggers badge bounce)
  const prevCountRef = useRef(itemCount);
  const badgeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (itemCount > prevCountRef.current && badgeRef.current) {
      // Remove and re-add the animation class to re-trigger it
      badgeRef.current.classList.remove(styles.badgeBounce);
      // Force reflow to allow re-adding the class
      void badgeRef.current.offsetWidth;
      badgeRef.current.classList.add(styles.badgeBounce);
    }
    prevCountRef.current = itemCount;
  }, [itemCount]);

  const hasItems = itemCount > 0;

  return (
    <button
      type="button"
      className={`${styles.cartButton} ${className ?? ''}`}
      onClick={openCart}
      aria-label={
        hasItems
          ? `Open cart, ${itemCount} item${itemCount !== 1 ? 's' : ''}`
          : 'Open cart, cart is empty'
      }
    >
      {/* ── Shopping Bag Icon ───────────────────────────────────────── */}
      <span className={styles.iconWrapper} aria-hidden="true">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={styles.icon}
        >
          <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>

        {/*
         * Badge
         * Rendered always; visibility toggled via CSS so transitions
         * play correctly on appearance (opacity + scale vs display:none).
         * aria-hidden because the count is expressed in the button's aria-label.
         */}
        <span
          ref={badgeRef}
          aria-hidden="true"
          className={`${styles.badge} ${hasItems ? styles.badgeVisible : ''}`}
        >
          {/* Cap display at 99+ to avoid badge overflow */}
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      </span>

      {/* Visible label — hidden on narrow screens via CSS */}
      <span className={styles.label}>Cart</span>
    </button>
  );
}

