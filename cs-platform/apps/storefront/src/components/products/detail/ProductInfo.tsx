/**
 * ═══════════════════════════════════════════════════════════════════
 * ProductInfo — Product Header / Identity Block
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/products/detail/ProductInfo.tsx
 *
 * The product's core identity: strain badge, rating, brand, name (h1),
 * description, and genetics lineage. This is the first thing users
 * read after seeing the gallery.
 *
 * Layout:
 *   [Sativa Badge]  [⭐ 4.5 (128 reviews)]
 *   GREENLEAF
 *   Blue Dream                            ← h1
 *   A classic sativa-dominant hybrid…     ← description
 *   Genetics: Blueberry × Haze           ← lineage
 *
 * Accessibility (WCAG):
 *   - <h1> for product name — one per page (1.3.1)
 *   - Star rating: visual stars are aria-hidden, sr-only text
 *     reads "4.5 out of 5 stars" (1.1.1)
 *   - Strain/category badges use text labels, not just color (1.4.1)
 *   - Description uses proper <p> with line-height (1.4.12)
 *
 * Responsive:
 *   - Name: text-2xl → sm:text-3xl → md:text-4xl
 *   - Badge + rating wrap on narrow viewports (flex-wrap)
 *   - Description max-w-2xl for comfortable reading width
 */

import { Badge } from '@cannasaas/ui';
import type { Product } from '@cannasaas/types';

function StarRating({ rating, count }: { rating: number; count: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.3;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <div className="flex items-center gap-1.5">
      <span aria-hidden="true" className="text-sm tracking-wider text-amber-500">
        {'★'.repeat(full)}{half && '½'}{'☆'.repeat(empty)}
      </span>
      <span className="sr-only">{rating.toFixed(1)} out of 5 stars</span>
      <span className="text-xs sm:text-sm text-muted-foreground">
        {rating.toFixed(1)} ({count} review{count !== 1 ? 's' : ''})
      </span>
    </div>
  );
}

interface ProductInfoProps {
  product: Product;
}

export function ProductInfo({ product }: ProductInfoProps) {
  return (
    <div className="space-y-3">
      {/* Top row: badges + rating */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {product.strainType && (
          <Badge variant="outline">{product.strainType}</Badge>
        )}
        {product.category && (
          <Badge variant="secondary" className="capitalize">{product.category}</Badge>
        )}
        {product.averageRating != null && product.reviewCount != null && (
          <StarRating rating={product.averageRating} count={product.reviewCount} />
        )}
      </div>

      {/* Brand */}
      {product.brand && (
        <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-widest font-medium">
          {product.brand}
        </p>
      )}

      {/* Product name — the single h1 for this page */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">
        {product.name}
      </h1>

      {/* Description */}
      {product.description && (
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
          {product.description}
        </p>
      )}

      {/* Genetics lineage */}
      {product.genetics && (
        <p className="text-xs sm:text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Genetics:</span> {product.genetics}
        </p>
      )}
    </div>
  );
}
