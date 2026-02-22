/**
 * @file CartLineItem.tsx
 * @app apps/storefront
 *
 * Individual cart line item row.
 *
 * Layout:
 *   [Product image] [Name + variant] [Qty stepper] [Price] [Remove]
 *
 * On mobile, layout stacks: image + info on one row, qty + price below.
 *
 * Interactions:
 *   - Quantity stepper: calls useUpdateCartItem + cartStore.updateQuantity
 *   - Remove button:    calls useRemoveCartItem + cartStore.removeItem
 *   - Optimistic updates: UI changes instantly, server syncs in background
 *
 * Accessibility:
 *   - <article> with aria-label: "Cart item: {productName}" (WCAG 1.3.1)
 *   - Quantity stepper: role="group" aria-label wrapping buttons + output
 *   - Remove button: aria-label "Remove {productName} from cart"
 *   - Price update: aria-live="polite" (WCAG 4.1.3)
 *   - Loading state: aria-busy
 *
 * This file supersedes the CartLineItem written in scaffold-components.sh.
 */

import { useRemoveCartItem, useUpdateCartItem } from '@cannasaas/api-client';

import type { CartItem } from '@cannasaas/types';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes';
import { useCartStore } from '@cannasaas/stores';
import { useState } from 'react';

interface CartLineItemProps {
  item: CartItem;
}

export function CartLineItem({ item }: CartLineItemProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const updateOptimistic = useCartStore((s) => s.updateQuantity);
  const removeOptimistic = useCartStore((s) => s.removeItem);

  const { mutate: updateServer, isPending: isUpdating } = useUpdateCartItem(
    item.id,
  );
  const { mutate: removeServer } = useRemoveCartItem(item.id);

  const handleQuantityChange = (newQty: number) => {
    updateOptimistic(item.id, newQty);
    updateServer({ quantity: newQty });
  };

  const handleRemove = () => {
    setIsRemoving(true);
    removeOptimistic(item.id);
    removeServer();
  };

  return (
    <article
      aria-label={`Cart item: ${item.productName}`}
      aria-busy={isUpdating}
      className={[
        'flex gap-4 p-4 bg-white rounded-2xl border border-stone-100',
        'transition-opacity duration-200',
        isRemoving ? 'opacity-50' : '',
      ].join(' ')}
    >
      {/* Product image */}
      <Link
        to={ROUTES.productDetail(item.productId)}
        tabIndex={-1}
        aria-hidden="true"
        className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-stone-50 focus:outline-none"
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="text-2xl">🌿</span>
          </div>
        )}
      </Link>

      {/* Item details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
        {/* Top row: name + remove */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              to={ROUTES.productDetail(item.productId)}
              className="text-sm font-semibold text-stone-900 hover:text-[hsl(var(--primary))] line-clamp-2 transition-colors focus-visible:outline-none focus-visible:underline"
            >
              {item.productName}
            </Link>
            <p className="text-xs text-stone-500 mt-0.5">{item.variantName}</p>
            {item.weight && (
              <p className="text-xs text-stone-400">
                {item.weight}
                {item.weightUnit}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleRemove}
            disabled={isRemoving}
            aria-label={`Remove ${item.productName} from cart`}
            className={[
              'flex-shrink-0 w-7 h-7 flex items-center justify-center',
              'text-stone-400 hover:text-red-500 hover:bg-red-50',
              'rounded-lg transition-colors',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400',
            ].join(' ')}
          >
            <svg
              aria-hidden="true"
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        {/* Bottom row: quantity + price */}
        <div className="flex items-center justify-between gap-3">
          {/* Quantity stepper */}
          <div
            role="group"
            aria-label={`Quantity for ${item.productName}`}
            className="flex items-center border border-stone-200 rounded-lg overflow-hidden"
          >
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={item.quantity <= 1 || isUpdating}
              className="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:text-stone-300 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--primary))]"
            >
              <svg
                aria-hidden="true"
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 12H4"
                />
              </svg>
            </button>

            <output
              aria-live="polite"
              aria-atomic="true"
              className="w-8 text-center text-sm font-semibold text-stone-900"
            >
              {item.quantity}
            </output>

            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={item.quantity >= 10 || isUpdating}
              className="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:text-stone-300 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--primary))]"
            >
              <svg
                aria-hidden="true"
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>

          {/* Line total */}
          <div className="text-right">
            <output
              aria-live="polite"
              aria-label={`Total for ${item.productName}: $${item.totalPrice.toFixed(2)}`}
              className="text-sm font-bold text-stone-900"
            >
              ${item.totalPrice.toFixed(2)}
            </output>
            {item.quantity > 1 && (
              <p className="text-[10px] text-stone-400">
                ${item.unitPrice.toFixed(2)} each
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
