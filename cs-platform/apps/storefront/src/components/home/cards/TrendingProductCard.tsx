/**
 * ═══════════════════════════════════════════════════════════════════
 * TrendingProductCard
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/home/cards/TrendingProductCard.tsx
 *
 * Compact card with a rank number badge (1, 2, 3…) in the top-left.
 * No potency info — keeps the card visually lighter since the
 * trending section is about popularity, not product details.
 *
 * Accessibility:
 *   - aria-label includes rank: "Number 1 trending: Blue Dream — $45.00"
 *   - Rank badge is aria-hidden (redundant with aria-label)
 *   - focus-visible ring, lazy-loaded image, aspect-square for CLS
 */

import { Link } from 'react-router-dom';
import { Card } from '@cannasaas/ui';
import { formatCurrency } from '@cannasaas/utils';
import type { Product } from '@cannasaas/types';

interface TrendingProductCardProps {
  product: Product;
  /** 1-based rank number displayed on the badge */
  rank: number;
}

export function TrendingProductCard({ product, rank }: TrendingProductCardProps) {
  const primaryVariant = product.variants?.[0];

  return (
    <Link
      to={`/products/${product.id}`}
      aria-label={`Number ${rank} trending: ${product.name} — ${primaryVariant ? formatCurrency(primaryVariant.price) : ''}`}
      className="
        block h-full rounded-xl
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-primary focus-visible:ring-offset-2
      "
    >
      <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-200">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product.images?.[0] ? (
            <img
              src={product.images[0].url}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
              width={280}
              height={280}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-4xl"
              aria-hidden="true"
            >
              🌿
            </div>
          )}

          {/* Rank badge — high contrast circle. aria-hidden because
              the rank is already in the Link's aria-label. */}
          <div
            aria-hidden="true"
            className="
              absolute top-2 left-2 sm:top-3 sm:left-3
              w-7 h-7 sm:w-8 sm:h-8 rounded-full
              bg-primary text-primary-foreground
              flex items-center justify-center
              text-xs sm:text-sm font-bold
            "
          >
            {rank}
          </div>
        </div>

        <div className="p-3 sm:p-4">
          <h3 className="font-semibold text-xs sm:text-sm leading-tight line-clamp-2 mb-1">
            {product.name}
          </h3>
          {primaryVariant && (
            <span className="text-sm sm:text-base font-bold">
              {formatCurrency(primaryVariant.price)}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
