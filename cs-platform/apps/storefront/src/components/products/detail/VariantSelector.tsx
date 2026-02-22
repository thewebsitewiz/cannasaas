/**
 * ═══════════════════════════════════════════════════════════════════
 * VariantSelector — Size/Weight Picker with Dynamic Pricing
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/products/detail/VariantSelector.tsx
 *
 * Controlled component — parent owns selectedId state. When the
 * user taps a different weight (1g, 3.5g, 7g, 14g, 28g), the
 * price in AddToCartSection updates instantly.
 *
 * Visual:
 *   ┌──────┐  ┌──────┐  ┌────────────┐  ┌──────┐
 *   │  1g  │  │ 3.5g │  │ ▶ 7g  $45 ◀│  │ 14g  │
 *   │ $15  │  │ $35  │  │  selected   │  │ $80  │
 *   └──────┘  └──────┘  └────────────┘  └──────┘
 *
 * Accessibility (WCAG):
 *   - <fieldset> + <legend> groups the radios (1.3.1)
 *   - Real <input type="radio"> — screen readers announce
 *     "radio button, 3.5 grams, $35, 2 of 4, selected" (4.1.2)
 *   - aria-describedby links each option to its price
 *   - Arrow keys navigate, Space/Enter select (native radio behavior)
 *   - focus-visible ring (2.4.7)
 *   - Out-of-stock: disabled + visual + ARIA indication
 *   - Selected: checkmark + border (not color alone — 1.4.1)
 *   - Touch targets: min-w-[72px] (2.5.8)
 */

import { useId } from 'react';
import { formatCurrency } from '@cannasaas/utils';
import type { ProductVariant } from '@cannasaas/types';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedId: string;
  onSelect: (variantId: string) => void;
}

export function VariantSelector({ variants, selectedId, onSelect }: VariantSelectorProps) {
  const groupId = useId();

  if (variants.length <= 1) return null;

  return (
    <fieldset className="space-y-2.5">
      <legend className="text-sm sm:text-base font-semibold">Select Size</legend>

      <div className="flex flex-wrap gap-2 sm:gap-2.5">
        {variants.map((variant) => {
          const isSelected = variant.id === selectedId;
          const isOutOfStock = variant.stock != null && variant.stock <= 0;
          const priceId = `${groupId}-price-${variant.id}`;

          return (
            <label
              key={variant.id}
              className={`
                relative flex flex-col items-center justify-center
                min-w-[72px] sm:min-w-[80px]
                px-3 py-2.5 sm:px-4 sm:py-3
                rounded-xl border-2 cursor-pointer
                transition-all duration-200
                focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2
                ${isOutOfStock
                  ? 'opacity-50 cursor-not-allowed border-border bg-muted'
                  : isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'}
              `}
            >
              <input
                type="radio"
                name={`variant-${groupId}`}
                value={variant.id}
                checked={isSelected}
                disabled={isOutOfStock}
                onChange={() => onSelect(variant.id)}
                aria-describedby={priceId}
                className="sr-only"
              />

              <span className="text-xs sm:text-sm font-semibold">{variant.name}</span>
              <span id={priceId} className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {formatCurrency(variant.price)}
              </span>

              {isOutOfStock && (
                <span className="text-[10px] text-destructive font-medium mt-0.5">Out of Stock</span>
              )}

              {/* Checkmark — non-color indicator of selection (1.4.1) */}
              {isSelected && !isOutOfStock && (
                <span
                  aria-hidden="true"
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shadow-sm"
                >
                  ✓
                </span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
