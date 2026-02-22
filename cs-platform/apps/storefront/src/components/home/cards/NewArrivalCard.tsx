/**
 * ═══════════════════════════════════════════════════════════════════
 * NewArrivalCard
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/home/cards/NewArrivalCard.tsx
 *
 * Product card with a green "NEW" badge for the "Just Dropped"
 * section. Shows brand, product name, and price.
 *
 * Accessibility:
 *   - aria-label: "New: Blue Dream by Premium Farms — $45.00"
 *   - "NEW" badge uses bg-green-700 on white (meets 4.5:1 contrast)
 *   - focus-visible ring, lazy-loaded image, aspect-square for CLS
 */

import { Link } from 'react-router-dom';
import { Card, Badge } from '@cannasaas/ui';
import { formatCurrency } from '@cannasaas/utils';
import type { Product } from '@cannasaas/types';

interface NewArrivalCardProps {
  product: Product;
}

export function NewArrivalCard({ product }: NewArrivalCardProps) {
  const primaryVariant = product.variants?.[0];

  return (
    <Link
      to={`/products/${product.id}`}
      aria-label={`New: ${product.name}${product.brand ? ` by ${product.brand}` : ''} — ${primaryVariant ? formatCurrency(primaryVariant.price) : ''}`}
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

          {/* "NEW" badge — green-700 on white meets 4.5:1 contrast */}
          <Badge className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-green-700 text-white">
            NEW
          </Badge>
        </div>

        <div className="p-3 sm:p-4">
          {product.brand && (
            <p className="text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wide mb-0.5 sm:mb-1">
              {product.brand}
            </p>
          )}
          <h3 className="font-semibold text-xs sm:text-sm leading-tight line-clamp-2 mb-1.5 sm:mb-2">
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
