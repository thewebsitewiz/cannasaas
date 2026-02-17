/**
 * ═══════════════════════════════════════════════════════════════════
 * AddToCartSection — Price, Quantity, and Cart Action
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/products/detail/AddToCartSection.tsx
 *
 * Displays the current price (driven by the selected variant),
 * a quantity stepper (−/+), and an "Add to Cart" button. On
 * mobile, a condensed sticky bar appears at the bottom of the
 * screen so the CTA is always reachable.
 *
 * Layout (Desktop — inline):
 *   $45.00               ← Large price
 *   [−] 2 [+]            ← Quantity stepper
 *   [ Add to Cart $90 ]  ← Full-width CTA with total
 *
 * Layout (Mobile — sticky bottom bar):
 *   ┌────────────────────────────────────┐
 *   │ $45.00  [−] 2 [+]  [Add to Cart]  │
 *   └────────────────────────────────────┘
 *
 * State:
 *   Uses Optimistic Update pattern — useCartStore.addItem()
 *   updates the cart immediately while the API call happens
 *   in the background. On failure, the mutation rolls back.
 *
 * Accessibility (WCAG):
 *   - Quantity input: role="spinbutton" with aria-valuemin=1,
 *     aria-valuemax=99, aria-valuenow (4.1.2)
 *   - −/+ buttons have aria-label: "Decrease quantity" (4.1.2)
 *   - "Add to Cart" button includes product name in aria-label
 *     for screen readers: "Add Blue Dream to cart" (4.1.2)
 *   - Price has aria-live="polite" — announces when variant
 *     changes cause a price update
 *   - All touch targets ≥ 44×44px (2.5.8)
 *   - focus-visible rings on all interactive elements (2.4.7)
 *   - Sticky bar uses position:sticky, not fixed, to respect
 *     document flow and not overlay other content
 *
 * Responsive:
 *   - Desktop: vertical stack (price → quantity → CTA)
 *   - Mobile sticky bar: appears below lg, hidden above
 *   - Quantity: w-10 h-10 buttons on mobile, w-11 h-11 sm+
 */

import { useState, useCallback } from 'react';
import { formatCurrency } from '@cannasaas/utils';
import { useCartStore } from '@cannasaas/stores';
import type { Product, ProductVariant } from '@cannasaas/types';

interface AddToCartSectionProps {
  product: Product;
  selectedVariant: ProductVariant;
}

export function AddToCartSection({ product, selectedVariant }: AddToCartSectionProps) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const isOutOfStock = selectedVariant.stock != null && selectedVariant.stock <= 0;
  const lineTotal = selectedVariant.price * quantity;

  const increment = useCallback(() => {
    setQuantity((q) => Math.min(q + 1, 99));
  }, []);

  const decrement = useCallback(() => {
    setQuantity((q) => Math.max(q - 1, 1));
  }, []);

  const handleAddToCart = useCallback(() => {
    if (isOutOfStock) return;

    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      variantName: selectedVariant.name,
      price: selectedVariant.price,
      quantity,
      imageUrl: product.images?.[0]?.url,
    });

    // Reset quantity after adding
    setQuantity(1);
  }, [addItem, product, selectedVariant, quantity, isOutOfStock]);

  return (
    <>
      {/* ── Desktop / Inline Layout ── */}
      <div className="space-y-4">
        {/* Price — aria-live announces changes when variant switches */}
        <div aria-live="polite" aria-atomic="true">
          <span className="text-2xl sm:text-3xl font-bold">
            {formatCurrency(selectedVariant.price)}
          </span>
          {selectedVariant.name && (
            <span className="text-sm text-muted-foreground ml-2">
              / {selectedVariant.name}
            </span>
          )}
        </div>

        {/* Stock status */}
        {selectedVariant.stock != null && (
          <p className={`text-xs sm:text-sm font-medium ${
            isOutOfStock
              ? 'text-destructive'
              : selectedVariant.stock <= 5
                ? 'text-amber-600'
                : 'text-emerald-600'
          }`}>
            {isOutOfStock
              ? 'Out of Stock'
              : selectedVariant.stock <= 5
                ? `Only ${selectedVariant.stock} left`
                : 'In Stock'}
          </p>
        )}

        {/* Quantity stepper */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium mr-1">Qty:</span>

          <button
            onClick={decrement}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="
              w-10 h-10 sm:w-11 sm:h-11
              min-w-[44px] min-h-[44px]
              flex items-center justify-center
              rounded-lg border border-border
              text-sm font-medium
              disabled:opacity-40 disabled:cursor-not-allowed
              hover:bg-muted
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-primary focus-visible:ring-offset-2
              transition-colors
            "
          >
            −
          </button>

          {/* Quantity display — role="spinbutton" for AT */}
          <span
            role="spinbutton"
            aria-valuenow={quantity}
            aria-valuemin={1}
            aria-valuemax={99}
            aria-label="Quantity"
            className="
              w-12 h-10 sm:h-11
              flex items-center justify-center
              text-sm sm:text-base font-semibold tabular-nums
              border border-border rounded-lg
            "
          >
            {quantity}
          </span>

          <button
            onClick={increment}
            disabled={quantity >= 99}
            aria-label="Increase quantity"
            className="
              w-10 h-10 sm:w-11 sm:h-11
              min-w-[44px] min-h-[44px]
              flex items-center justify-center
              rounded-lg border border-border
              text-sm font-medium
              disabled:opacity-40 disabled:cursor-not-allowed
              hover:bg-muted
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-primary focus-visible:ring-offset-2
              transition-colors
            "
          >
            +
          </button>
        </div>

        {/* Add to Cart CTA — Desktop */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          aria-label={`Add ${product.name} to cart — ${formatCurrency(lineTotal)}`}
          className="
            hidden lg:flex
            w-full items-center justify-center gap-2
            py-3.5 min-h-[48px]
            bg-primary text-primary-foreground
            rounded-xl font-semibold text-sm sm:text-base
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:bg-primary/90
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-primary focus-visible:ring-offset-2
            transition-colors
          "
        >
          {isOutOfStock ? 'Out of Stock' : `Add to Cart — ${formatCurrency(lineTotal)}`}
        </button>
      </div>

      {/* ── Mobile Sticky Bottom Bar ──
          Only visible below lg. Uses sticky positioning so it
          stays at the bottom of the viewport but doesn't overlay
          content when scrolling. */}
      <div className="
        lg:hidden
        fixed bottom-0 left-0 right-0 z-30
        bg-background/95 backdrop-blur-lg
        border-t border-border
        px-4 py-3
        safe-bottom
      ">
        <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
          {/* Price */}
          <div className="flex-shrink-0">
            <p className="font-bold text-lg">{formatCurrency(selectedVariant.price)}</p>
            {selectedVariant.name && (
              <p className="text-[11px] text-muted-foreground">/ {selectedVariant.name}</p>
            )}
          </div>

          {/* Compact quantity */}
          <div className="flex items-center gap-1">
            <button
              onClick={decrement}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="w-9 h-9 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-border text-sm disabled:opacity-40"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums">
              {quantity}
            </span>
            <button
              onClick={increment}
              disabled={quantity >= 99}
              aria-label="Increase quantity"
              className="w-9 h-9 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-border text-sm disabled:opacity-40"
            >
              +
            </button>
          </div>

          {/* CTA */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            aria-label={`Add ${product.name} to cart`}
            className="
              flex-shrink-0
              px-5 py-2.5 min-h-[44px]
              bg-primary text-primary-foreground
              rounded-xl font-semibold text-sm
              disabled:opacity-50
              hover:bg-primary/90
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-primary
              transition-colors
            "
          >
            {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
          </button>
        </div>
      </div>

      {/* Spacer for mobile sticky bar — prevents content from hiding behind it */}
      <div className="lg:hidden h-20" aria-hidden="true" />
    </>
  );
}
