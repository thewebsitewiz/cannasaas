/**
 * @file src/components/products/ProductCard/ProductCard.tsx
 * @description Cannabis product card for the storefront grid.
 *
 * WCAG 2.1 AA compliance:
 *   - Product image has descriptive alt text (product name + category)
 *   - THC percentage is labelled: "THC: 24.5%" not just "24.5%"
 *   - "Add to Cart" button has aria-label including the product name
 *     so screen-reader users don't hear "Add to Cart, Add to Cart, Add to Cart"
 *   - Card is a <article> element — semantically meaningful landmark
 *   - Out-of-stock state communicated via aria-label and visual indicator
 *   - Price uses a semantic <span> with aria-label for context:
 *     "Price: $45.00" rather than the bare number
 *
 * Advanced React patterns:
 *   - React.memo — prevents re-render when parent re-renders but this
 *     product's data hasn't changed (critical in a grid of 20+ cards)
 *   - useCallback for event handlers — stable reference prevents child
 *     re-renders when the parent passes handlers as props
 *
 * @example
 * ```tsx
 * <ProductCard
 *   product={product}
 *   onAddToCart={(variantId, quantity) => addItem(product, variantId, quantity)}
 * />
 * ```
 */

import React, { memo, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button/Button';
import { formatCurrency, formatThc } from '@/utils/formatters';
import { cn } from '@/utils/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProductVariant {
  id: string;
  name: string;      // e.g. "1/8 oz"
  sku: string;
  weight: number;
  weightUnit: 'g' | 'mg' | 'oz';
  price: number;
  quantity: number;  // Current stock level
}

export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  strainType: string;
  thcContent: number | null;
  cbdContent: number | null;
  description: string;
  effects: string[];
  images: Array<{ url: string; isPrimary: boolean }>;
  variants: ProductVariant[];
}

export interface ProductCardProps {
  /** The product data to display */
  product: Product;

  /**
   * Called when the user clicks "Add to Cart".
   * The parent (ProductGrid / CartStore) handles the actual cart update.
   *
   * @param variantId  The selected variant's ID
   * @param quantity   Always 1 from the card; adjustable in the cart
   */
  onAddToCart: (variantId: string, quantity: number) => void | Promise<void>;

  /** Optional CSS class to merge onto the card container */
  className?: string;
}

// ---------------------------------------------------------------------------
// Strain type display names
// ---------------------------------------------------------------------------

const STRAIN_TYPE_LABELS: Record<string, string> = {
  sativa: 'Sativa',
  indica: 'Indica',
  hybrid: 'Hybrid',
  sativa_dominant_hybrid: 'Sativa Hybrid',
  indica_dominant_hybrid: 'Indica Hybrid',
  cbd: 'CBD',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ProductCard — memoised to avoid unnecessary re-renders in the product grid.
 * React.memo performs a shallow equality check on props. Since `onAddToCart`
 * is a function, callers MUST wrap it in useCallback to benefit from memoisation.
 */
export const ProductCard = memo(function ProductCard({
  product,
  onAddToCart,
  className,
}: ProductCardProps) {
  /** Index of the currently selected variant (defaults to first/cheapest) */
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  /** Tracks async "adding to cart" state per-card */
  const [isAdding, setIsAdding] = useState(false);

  const selectedVariant = product.variants[selectedVariantIdx];
  const primaryImage = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const isOutOfStock = selectedVariant?.quantity === 0;

  /**
   * useCallback: stable reference so a parent using React.memo or
   * useMemo on the grid doesn't re-render just because we declared a
   * new function instance.
   */
  const handleAddToCart = useCallback(async () => {
    if (!selectedVariant || isOutOfStock) return;

    setIsAdding(true);
    try {
      await onAddToCart(selectedVariant.id, 1);
    } finally {
      setIsAdding(false);
    }
  }, [selectedVariant, isOutOfStock, onAddToCart]);

  const strainLabel = STRAIN_TYPE_LABELS[product.strainType] ?? product.strainType;

  return (
    /**
     * <article> is the correct HTML5 landmark for a self-contained,
     * independently distributable piece of content — a product card fits
     * this definition. Screen readers announce "article" so users know
     * they're navigating discrete items.
     */
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-border',
        'bg-card text-card-foreground shadow-sm',
        'transition-shadow duration-200 hover:shadow-md',
        className,
      )}
      /**
       * aria-label gives the article a unique accessible name in the landmark
       * list so screen-reader users can tell products apart when navigating
       * by landmark (VoiceOver rotor, NVDA elements list).
       */
      aria-label={`${product.name} by ${product.brand}`}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Product image                                                        */}
      {/* ------------------------------------------------------------------ */}
      <Link
        to={`/products/${product.id}`}
        /**
         * The link wraps the image — using tabIndex on the image itself would
         * create a redundant tab stop. The "View details" text below provides
         * the accessible name for keyboard/AT users navigating the link.
         */
        aria-label={`View details for ${product.name}`}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          {primaryImage ? (
            <img
              src={primaryImage.url}
              /**
               * Descriptive alt text: product name + category so a screen-reader
               * user understands what they're looking at without reading the
               * surrounding text. "Decorative" alt="" would be wrong here — the
               * image adds meaningful context about the product's appearance.
               */
              alt={`${product.name} — ${product.category}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              /**
               * loading="lazy" defers off-screen image fetches.
               * The first few cards should use loading="eager" (via a prop)
               * to avoid LCP regression — not implemented here for brevity.
               */
              loading="lazy"
              width={400}
              height={400}
            />
          ) : (
            /* Placeholder when no image is available */
            <div
              className="flex h-full w-full items-center justify-center text-muted-foreground"
              aria-label="No image available"
              role="img"
            >
              <span className="text-4xl" aria-hidden="true">🌿</span>
            </div>
          )}

          {/* Out-of-stock badge */}
          {isOutOfStock && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-background/70"
              aria-hidden="true" /* announced via button's aria-label */
            >
              <span className="rounded-md bg-destructive px-3 py-1 text-sm font-semibold text-destructive-foreground">
                Out of Stock
              </span>
            </div>
          )}

          {/* Strain type badge */}
          <div
            className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium"
            aria-hidden="true" /* this info is also in the card text */
          >
            {strainLabel}
          </div>
        </div>
      </Link>

      {/* ------------------------------------------------------------------ */}
      {/* Card body                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Brand name */}
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {product.brand}
        </p>

        {/* Product name — heading level 3 assumes the page has h1/h2 above */}
        <h3 className="text-base font-semibold leading-tight">
          <Link
            to={`/products/${product.id}`}
            className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {product.name}
          </Link>
        </h3>

        {/* Cannabinoid content */}
        <div className="flex items-center gap-3 text-sm">
          {product.thcContent !== null && (
            <span>
              {/* Explicit label for screen readers — "THC: 24.5%" */}
              <span className="sr-only">THC: </span>
              <span aria-hidden="true" className="font-medium text-emerald-700 dark:text-emerald-400">
                THC
              </span>{' '}
              <span className="font-semibold">{formatThc(product.thcContent)}</span>
            </span>
          )}
          {product.cbdContent !== null && product.cbdContent > 0 && (
            <span>
              <span className="sr-only">CBD: </span>
              <span aria-hidden="true" className="font-medium text-blue-600 dark:text-blue-400">
                CBD
              </span>{' '}
              <span className="font-semibold">{formatThc(product.cbdContent)}</span>
            </span>
          )}
        </div>

        {/* Variant selector — weight/size options */}
        {product.variants.length > 1 && (
          <fieldset className="mt-1">
            <legend className="sr-only">Select size for {product.name}</legend>
            <div className="flex flex-wrap gap-1.5" role="group">
              {product.variants.map((variant, idx) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariantIdx(idx)}
                  className={cn(
                    'rounded border px-2 py-0.5 text-xs font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                    idx === selectedVariantIdx
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary hover:text-primary',
                    variant.quantity === 0 && 'opacity-40 line-through',
                  )}
                  /**
                   * aria-pressed communicates the selected state to screen readers.
                   * This pattern is appropriate because these buttons act as a
                   * single-select group (like radio buttons but styled as pills).
                   */
                  aria-pressed={idx === selectedVariantIdx}
                  /**
                   * Communicate stock status in the accessible name so
                   * screen-reader users don't select an out-of-stock option.
                   */
                  aria-label={`${variant.name}${variant.quantity === 0 ? ' — out of stock' : ''}`}
                >
                  {variant.name}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {/* Spacer pushes price + button to the bottom of the card */}
        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between gap-2">
            {/* Price */}
            <p className="text-lg font-bold">
              {/* aria-label provides full context: "Price: $45.00" */}
              <span className="sr-only">Price: </span>
              {selectedVariant ? formatCurrency(selectedVariant.price) : '—'}
            </p>

            {/* Add to Cart button */}
            <Button
              size="sm"
              onClick={handleAddToCart}
              loading={isAdding}
              disabled={isOutOfStock}
              /**
               * Unique accessible name per card — screen-reader users navigating
               * by button hear "Add to Cart, Blue Dream" not just "Add to Cart".
               */
              aria-label={
                isOutOfStock
                  ? `${product.name} is out of stock`
                  : `Add ${product.name} — ${selectedVariant?.name} to cart`
              }
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
});

ProductCard.displayName = 'ProductCard';
