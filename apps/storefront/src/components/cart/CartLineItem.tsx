/**
 * @file CartLineItem.tsx
 * @description Renders a single item row in the shopping cart.
 *
 * Accessibility (WCAG 2.1 AA):
 *   - Each row is a <li> with aria-label identifying the product
 *   - Quantity stepper uses role="group" with labelled buttons
 *   - Remove button has aria-label="Remove [product] from cart"
 *   - Image has meaningful alt text (product name + variant)
 *   - Prices announced to screen readers via aria-live on subtotal
 *
 * Responsive:
 *   - Mobile: stacked layout (image top, details below)
 *   - sm+: horizontal layout with image left, controls right
 *
 * @pattern Controlled component — all state managed by cartStore
 */

import React, { memo, useCallback, useId } from 'react';
import type { CartItem } from '@/stores/cart.store';

// ── Props ─────────────────────────────────────────────────────────────────────

interface CartLineItemProps {
  item: CartItem;
  /** Called when the user changes quantity — parent updates store */
  onQuantityChange: (itemId: string, newQuantity: number) => void;
  /** Called when the user removes the item */
  onRemove: (itemId: string) => void;
  /** Whether the cart is in a loading/submitting state (disables controls) */
  isDisabled?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * CartLineItem — memoised to prevent re-renders when sibling items update.
 *
 * Uses `memo` with a custom comparator because CartItem objects are
 * reconstructed on every cartStore update. We compare by value fields
 * rather than reference.
 */
export const CartLineItem = memo(function CartLineItem({
  item,
  onQuantityChange,
  onRemove,
  isDisabled = false,
}: CartLineItemProps) {
  /**
   * Unique ID for the quantity group — required to associate the
   * <legend> with the stepper inputs (WCAG 1.3.1).
   */
  const quantityGroupId = useId();

  /**
   * Stable callback references prevent child button re-renders.
   * useCallback deps: [item.productId] — the identity of this line item.
   */
  const handleIncrement = useCallback(
    () => onQuantityChange(item.productId, item.quantity + 1),
    [item.productId, item.quantity, onQuantityChange],
  );

  const handleDecrement = useCallback(
    () => onQuantityChange(item.productId, Math.max(1, item.quantity - 1)),
    [item.productId, item.quantity, onQuantityChange],
  );

  const handleRemove = useCallback(
    () => onRemove(item.productId),
    [item.productId, onRemove],
  );

  /**
   * Format currency for display.
   * Using Intl.NumberFormat ensures correct locale-specific formatting.
   */
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    /**
     * <li> is the semantic list item — the parent <CartList> renders <ul>.
     * aria-label provides a full description for screen readers navigating
     * the list without visual context.
     */
    <li
      aria-label={`${item.name}, ${item.variantName} — ${formatCurrency((item.price * item.quantity))}`}
      className={[
        'flex flex-col sm:flex-row gap-4 py-6',
        'border-b border-gray-100 last:border-0',
        'transition-opacity duration-150',
        isDisabled ? 'opacity-50 pointer-events-none' : '',
      ].join(' ')}
    >
      {/* ── Product Image ─────────────────────────────────────────────────── */}
      <div className="flex-shrink-0">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            /**
             * Alt text is descriptive but concise.
             * Screen readers already announce the product name from aria-label
             * on the <li>, so we add variant context here (WCAG 1.1.1).
             */
            alt={`${item.name} — ${item.variantName}`}
            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
            loading="lazy"
            decoding="async"
          />
        ) : (
          /**
           * Placeholder — aria-hidden because the product name is already
           * announced via the parent li's aria-label.
           */
          <div
            aria-hidden="true"
            className={[
              'w-20 h-20 sm:w-24 sm:h-24 rounded-lg',
              'bg-gray-100 flex items-center justify-center',
              'text-gray-400 text-2xl',
            ].join(' ')}
          >
            🌿
          </div>
        )}
      </div>

      {/* ── Details ───────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* Product name + variant */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight">
              {item.name}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">{item.variantName}</p>
          </div>

          {/* Unit price — hidden on mobile (shown in subtotal area) */}
          <p
            aria-label={`Unit price: ${formatCurrency(item.price)}`}
            className="hidden sm:block text-sm text-gray-600 flex-shrink-0"
          >
            {formatCurrency(item.price)} each
          </p>
        </div>

        {/* ── Controls Row ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mt-4">
          {/*
           * Quantity stepper — wrapped in role="group" with an accessible
           * label so screen readers announce "Quantity for Blue Dream 1/8 oz:
           * 2, minus button, plus button" (WCAG 1.3.1, 4.1.2).
           */}
          <div
            role="group"
            aria-labelledby={quantityGroupId}
            className="flex items-center border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* Visually hidden label — read by SR before the group controls */}
            <span id={quantityGroupId} className="sr-only">
              Quantity for {item.name}
            </span>

            <button
              type="button"
              onClick={handleDecrement}
              disabled={isDisabled || item.quantity <= 1}
              aria-label={`Decrease quantity of ${item.name}`}
              className={[
                'w-9 h-9 flex items-center justify-center',
                'text-gray-600 hover:bg-gray-50 active:bg-gray-100',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-primary focus-visible:ring-inset',
                'transition-colors',
              ].join(' ')}
            >
              {/* aria-hidden — the button's accessible name is in aria-label */}
              <span aria-hidden="true">−</span>
            </button>

            {/*
             * Quantity display — role="status" and aria-live="polite" so
             * screen readers announce changes after each button press
             * without interrupting reading (WCAG 4.1.3).
             */}
            <span
              aria-live="polite"
              aria-atomic="true"
              className="w-10 text-center text-sm font-medium text-gray-900 select-none"
            >
              {item.quantity}
            </span>

            <button
              type="button"
              onClick={handleIncrement}
              disabled={isDisabled}
              aria-label={`Increase quantity of ${item.name}`}
              className={[
                'w-9 h-9 flex items-center justify-center',
                'text-gray-600 hover:bg-gray-50 active:bg-gray-100',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-primary focus-visible:ring-inset',
                'transition-colors',
              ].join(' ')}
            >
              <span aria-hidden="true">+</span>
            </button>
          </div>

          {/* Subtotal + remove */}
          <div className="flex items-center gap-4">
            {/*
             * aria-live so the updated price is announced after quantity
             * changes without a full page reload (WCAG 4.1.3).
             */}
            <p
              aria-live="polite"
              aria-label={`Subtotal for ${item.name}: ${formatCurrency((item.price * item.quantity))}`}
              className="font-semibold text-gray-900"
            >
              {formatCurrency((item.price * item.quantity))}
            </p>

            <button
              type="button"
              onClick={handleRemove}
              disabled={isDisabled}
              aria-label={`Remove ${item.name} from cart`}
              className={[
                'text-gray-400 hover:text-red-500',
                'transition-colors p-1 rounded',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-red-400',
                'disabled:opacity-40 disabled:cursor-not-allowed',
              ].join(' ')}
            >
              {/* SVG trash icon — aria-hidden, action described by button label */}
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </li>
  );
},
// Custom memo comparator — compare value fields, not object reference
(prev, next) =>
  prev.item.productId === next.item.productId &&
  prev.item.quantity === next.item.quantity &&
  prev.item.price * prev.item.quantity === next.item.price * next.item.quantity &&
  prev.isDisabled === next.isDisabled,
);

CartLineItem.displayName = 'CartLineItem';
