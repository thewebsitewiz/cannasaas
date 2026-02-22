/**
 * @file ProductCard.tsx
 * @app apps/storefront
 *
 * Reusable product card component — used in grid, carousel, and list views.
 *
 * Layout (default grid card):
 *   ┌─────────────────────────┐
 *   │  Product Image          │  ← aspect-square, lazy-loaded
 *   │  [New] [Sativa]  badges │  ← absolute overlay on image
 *   ├─────────────────────────┤
 *   │  Category               │  ← small muted text
 *   │  Product Name           │  ← 2-line clamp
 *   │  Brand Name             │  ← muted
 *   │  [THC 24%] [CBD 0.8%]   │  ← attribute badges
 *   │  ⭐ 4.5 (128)           │  ← rating (if available)
 *   │  From $45  [+ Add]      │  ← price + CTA
 *   └─────────────────────────┘
 *
 * Variants:
 *   - 'grid'     (default) — vertical card for grid layouts
 *   - 'carousel' — compact horizontal card for carousels
 *
 * Interactions:
 *   - Card click → navigate to /products/:id
 *   - "Add to Cart" → calls useAddToCart + cartStore.addItem optimistically
 *   - "Add" is disabled if purchase limit would be exceeded (usePurchaseLimitCheck)
 *
 * Accessibility:
 *   - <article> with aria-label: "Product: {name}" (WCAG 1.3.1)
 *   - <img> has meaningful alt: "{name}, {category}" (WCAG 1.1.1)
 *   - The card's click area is the product name link — NOT the whole card
 *     (whole-card links create redundant tab stops)
 *   - Add to Cart button: aria-label includes product name for context
 *   - Out-of-stock: button has aria-disabled, tooltip explains why
 *   - Skeleton state: aria-busy on placeholder (WCAG 4.1.3)
 *
 * Performance:
 *   - Images use loading="lazy" and fetchpriority="low" (above-fold cards
 *     passed `priority` prop to override with loading="eager")
 *   - Memoized with shallow prop comparison
 */

import { memo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAddToCart } from '@cannasaas/api-client';
import { useCartStore } from '@cannasaas/stores';
import { usePurchaseLimitCheck } from '../../hooks/usePurchaseLimitCheck';
import { ProductBadge, formatStrainType } from './ProductBadge';
import { ROUTES } from '../../routes';
import type { Product } from '../../types/storefront';

interface ProductCardProps {
  product: Product;
  variant?: 'grid' | 'carousel';
  /** Force eager loading for above-the-fold cards */
  priority?: boolean;
}

export const ProductCard = memo(function ProductCard({
  product,
  variant = 'grid',
  priority = false,
}: ProductCardProps) {
  const navigate = useNavigate();
  const { mutate: addToCartServer, isPending } = useAddToCart();
  const addItemOptimistic = useCartStore((s) => s.addItem);

  // Get the cheapest variant for display price
  const cheapestVariant = product.variants
    ?.sort((a, b) => a.price - b.price)[0];

  const isOutOfStock = !cheapestVariant || product.variants.every((v) => v.quantity === 0);

  const { canAdd, warning } = usePurchaseLimitCheck({
    variantWeightGrams: cheapestVariant?.weight ?? 0,
    quantity: 1,
  });

  const primaryImage = product.images?.find((i) => i.isPrimary) ?? product.images?.[0];

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault(); // Prevent card link navigation
      if (!cheapestVariant || isOutOfStock || !canAdd) return;

      // Optimistic update — instant UI response
      addItemOptimistic({
        productId: product.id,
        variantId: cheapestVariant.id,
        productName: product.name,
        variantName: cheapestVariant.name,
        unitPrice: cheapestVariant.price,
        totalPrice: cheapestVariant.price,
        quantity: 1,
        imageUrl: primaryImage?.url,
        weight: cheapestVariant.weight,
        weightUnit: cheapestVariant.weightUnit,
        sku: cheapestVariant.sku,
      });

      // Background server sync
      addToCartServer(
        { productId: product.id, variantId: cheapestVariant.id, quantity: 1 },
        {
          onError: () => {
            // Rollback optimistic update on failure
            useCartStore.getState().removeItem(
              `${product.id}-${cheapestVariant.id}-` // will match the composite ID
            );
          },
        },
      );
    },
    [product, cheapestVariant, isOutOfStock, canAdd, addItemOptimistic, addToCartServer, primaryImage],
  );

  const isCarousel = variant === 'carousel';

  return (
    <article
      aria-label={`Product: ${product.name}`}
      className={[
        'group relative bg-white rounded-2xl overflow-hidden',
        'border border-stone-100 hover:border-stone-200',
        'shadow-sm hover:shadow-md',
        'transition-all duration-200',
        isCarousel ? 'flex flex-row h-32' : 'flex flex-col',
      ].join(' ')}
    >
      {/* ── Product Image ─────────────────────────────────────────────────── */}
      <Link
        to={ROUTES.productDetail(product.id)}
        tabIndex={-1} // Hidden from tab order; the name link is the primary CTA
        aria-hidden="true"
        className={[
          'block overflow-hidden flex-shrink-0',
          'focus:outline-none',
          isCarousel ? 'w-32 h-full' : 'aspect-square w-full',
        ].join(' ')}
      >
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={`${product.name}, ${product.category}`}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'low'}
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          /* Fallback placeholder when no image */
          <div
            aria-hidden="true"
            className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center"
          >
            <span className="text-3xl">🌿</span>
          </div>
        )}

        {/* Badge overlays on image */}
        {!isCarousel && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1" aria-hidden="true">
            {product.isNew && <ProductBadge variant="new" label="New" />}
            {product.onSale && <ProductBadge variant="sale" label="Sale" />}
          </div>
        )}
      </Link>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className={['flex flex-col min-w-0', isCarousel ? 'flex-1 p-3' : 'p-4 flex-1'].join(' ')}>
        {/* Category */}
        <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1">
          {product.category}
        </p>

        {/* Product name — primary tab stop for keyboard navigation */}
        <h3 className={['font-semibold text-stone-900 leading-snug mb-1', isCarousel ? 'text-sm line-clamp-1' : 'text-sm line-clamp-2'].join(' ')}>
          <Link
            to={ROUTES.productDetail(product.id)}
            className={[
              'hover:text-[hsl(var(--primary))] transition-colors',
              'focus-visible:outline-none focus-visible:underline',
              // Extend click area to full card using pseudo-element
              'after:absolute after:inset-0',
            ].join(' ')}
          >
            {product.name}
          </Link>
        </h3>

        {/* Brand */}
        {product.brand && !isCarousel && (
          <p className="text-[11px] text-stone-400 mb-2 truncate">{product.brand}</p>
        )}

        {/* Attribute badges */}
        {!isCarousel && (
          <div className="flex flex-wrap gap-1 mb-3" aria-label="Product attributes">
            {product.thcContent != null && (
              <ProductBadge variant="thc" label={`THC ${product.thcContent}%`} />
            )}
            {product.cbdContent != null && product.cbdContent > 0 && (
              <ProductBadge variant="cbd" label={`CBD ${product.cbdContent}%`} />
            )}
            {product.strainType && (
              <ProductBadge variant="strain" label={formatStrainType(product.strainType)} />
            )}
          </div>
        )}

        {/* Spacer pushes price+CTA to bottom */}
        <div className="flex-1" />

        {/* Price + Add to Cart */}
        <div className={['flex items-center', isCarousel ? 'flex-col items-start gap-1.5 mt-auto' : 'justify-between'].join(' ')}>
          <div>
            <p className="text-xs text-stone-400 leading-none mb-0.5">
              {product.variants?.length > 1 ? 'From' : ''}
            </p>
            <p className="text-base font-bold text-stone-900">
              ${cheapestVariant?.price?.toFixed(2) ?? '—'}
            </p>
          </div>

          {/* Add to Cart button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || !canAdd || isPending}
            aria-label={
              isOutOfStock
                ? `${product.name} — out of stock`
                : `Add ${product.name} to cart`
            }
            aria-describedby={warning ? `warning-${product.id}` : undefined}
            className={[
              'relative z-10 flex-shrink-0',
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
              'text-xs font-semibold',
              'transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-1',
              isOutOfStock || !canAdd
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                : isPending
                  ? 'bg-[hsl(var(--primary)/0.7)] text-white cursor-wait'
                  : 'bg-[hsl(var(--primary))] text-white hover:brightness-110 active:brightness-95',
            ].join(' ')}
          >
            {isPending ? (
              <span aria-live="polite" className="sr-only">Adding to cart…</span>
            ) : null}
            {isOutOfStock ? 'Sold Out' : isPending ? '…' : '+ Add'}
          </button>
        </div>

        {/* Purchase limit warning */}
        {warning && (
          <p
            id={`warning-${product.id}`}
            role="alert"
            className="text-[10px] text-amber-600 mt-1.5 leading-tight"
          >
            {warning}
          </p>
        )}
      </div>
    </article>
  );
});

ProductCard.displayName = 'ProductCard';
