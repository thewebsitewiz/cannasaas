/**
 * @file VariantSelector.tsx
 * @app apps/storefront
 *
 * Product variant size/weight selector with live price updates.
 *
 * Renders each variant as a pill button showing weight and price.
 * Clicking selects that variant — the parent ProductDetail page
 * updates quantity, price display, and Add to Cart behaviour.
 *
 * Out-of-stock variants are shown but disabled with a strikethrough.
 *
 * Accessibility:
 *   - <fieldset> + <legend> wraps the option group (WCAG 1.3.1)
 *   - Each button: aria-pressed for selected state (WCAG 4.1.2)
 *   - Disabled: aria-disabled + visual strikethrough (WCAG 1.4.1)
 *   - Selected variant announced via aria-live region (WCAG 4.1.3)
 *   - "Only N left" stock warning is aria-live="polite"
 */

interface Variant {
  id: string;
  name: string;
  weight: number;
  weightUnit: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
}

interface VariantSelectorProps {
  variants: Variant[];
  selectedVariantId: string | null;
  onSelect: (variantId: string) => void;
}

const LOW_STOCK_THRESHOLD = 5;

export function VariantSelector({
  variants,
  selectedVariantId,
  onSelect,
}: VariantSelectorProps) {
  const selectedVariant = variants.find((v) => v.id === selectedVariantId);

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-stone-700 mb-3">
        Select Size / Weight
        {selectedVariant && (
          <span className="ml-2 text-sm font-normal text-stone-500">
            — {selectedVariant.name}
          </span>
        )}
      </legend>

      {/* Variant buttons */}
      <div role="list" className="flex flex-wrap gap-2.5">
        {variants.map((variant) => {
          const isSelected  = variant.id === selectedVariantId;
          const isOutOfStock = variant.quantity === 0;
          const isLowStock  = !isOutOfStock && variant.quantity <= LOW_STOCK_THRESHOLD;

          return (
            <button
              key={variant.id}
              type="button"
              role="listitem"
              aria-pressed={isSelected}
              aria-disabled={isOutOfStock}
              disabled={isOutOfStock}
              onClick={() => !isOutOfStock && onSelect(variant.id)}
              className={[
                'flex flex-col items-center px-4 py-2.5 rounded-xl',
                'border-2 text-sm font-medium',
                'transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-1',
                isSelected && !isOutOfStock
                  ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.06)] text-[hsl(var(--primary))]'
                  : isOutOfStock
                    ? 'border-stone-100 text-stone-300 cursor-not-allowed bg-stone-50'
                    : 'border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-50',
              ].join(' ')}
            >
              {/* Weight label */}
              <span
                className={[
                  'font-semibold leading-none',
                  isOutOfStock ? 'line-through' : '',
                ].join(' ')}
              >
                {variant.name}
              </span>

              {/* Price */}
              <span className="text-xs mt-0.5 leading-none">
                {isOutOfStock ? (
                  <span className="text-stone-400">Out of stock</span>
                ) : (
                  <>
                    ${variant.price.toFixed(2)}
                    {variant.compareAtPrice && variant.compareAtPrice > variant.price && (
                      <span className="ml-1 line-through text-stone-400">
                        ${variant.compareAtPrice.toFixed(2)}
                      </span>
                    )}
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Live stock warning for selected variant */}
      {selectedVariant && (
        <p aria-live="polite" className="text-xs mt-3">
          {selectedVariant.quantity === 0 ? (
            <span className="text-red-600 font-medium">⚠ Out of stock</span>
          ) : selectedVariant.quantity <= LOW_STOCK_THRESHOLD ? (
            <span className="text-amber-600 font-medium">
              🔥 Only {selectedVariant.quantity} left — order soon
            </span>
          ) : (
            <span className="text-green-600">✓ In stock ({selectedVariant.quantity} available)</span>
          )}
        </p>
      )}

      {/* Screen reader announcement of selection */}
      <p aria-live="polite" className="sr-only">
        {selectedVariant
          ? `Selected: ${selectedVariant.name}, $${selectedVariant.price.toFixed(2)}`
          : 'No size selected'}
      </p>
    </fieldset>
  );
}
