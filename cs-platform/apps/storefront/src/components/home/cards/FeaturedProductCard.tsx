/**
 * ═══════════════════════════════════════════════════════════════════
 * FeaturedProductCard
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/home/cards/FeaturedProductCard.tsx
 *
 * Richest card variant — shows:
 *   • "⭐ Staff Pick" badge (top-left)
 *   • Strain type badge (top-right): Indica / Sativa / Hybrid
 *   • Brand name (uppercase muted label)
 *   • Product name (2-line clamp)
 *   • THC/CBD potency percentages with <abbr> tags
 *   • Price + variant name
 *
 * Used in the "Featured Products" carousel via the render prop pattern.
 *
 * Accessibility:
 *   - Entire card is a single <Link> — one Tab stop per card (2.1.1)
 *   - aria-label provides a structured name: "Blue Dream — by Premium
 *     Farms — Sativa — $45.00" (4.1.2)
 *   - focus-visible ring on the Link (2.4.7)
 *   - Image has descriptive alt text, or placeholder is aria-hidden (1.1.1)
 *   - <abbr title="Tetrahydrocannabinol"> for THC/CBD acronyms (1.3.1)
 *   - aspect-square + explicit width/height prevent layout shift
 *
 * Responsive:
 *   - Badge position: top-2 mobile → top-3 sm+
 *   - Padding: p-3 mobile → p-4 sm+
 *   - Font sizes scale with [11px]/xs → xs/sm breakpoints
 */

import { Link } from 'react-router-dom';
import { Card, Badge } from '@cannasaas/ui';
import { formatCurrency } from '@cannasaas/utils';
import type { Product } from '@cannasaas/types';

interface FeaturedProductCardProps {
  product: Product;
}

export function FeaturedProductCard({ product }: FeaturedProductCardProps) {
  const primaryVariant = product.variants?.[0];

  return (
    <Link
      to={`/products/${product.id}`}
      /* Structured accessible name for screen readers:
         "Blue Dream — by Premium Farms — Sativa — $45.00"
         Undefined segments are filtered out with .filter(Boolean) */
      aria-label={[
        product.name,
        product.brand && `by ${product.brand}`,
        product.strainType,
        primaryVariant && formatCurrency(primaryVariant.price),
      ]
        .filter(Boolean)
        .join(' — ')}
      className="
        block h-full rounded-xl
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-primary focus-visible:ring-offset-2
      "
    >
      <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-200">
        {/* Image — aspect-square reserves space to prevent CLS */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product.images?.[0] ? (
            <img
              src={product.images[0].url}
              alt={`${product.name}${product.brand ? ` by ${product.brand}` : ''}`}
              className="w-full h-full object-cover"
              loading="lazy"
              width={280}
              height={280}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-4xl bg-muted"
              aria-hidden="true"
            >
              🌿
            </div>
          )}

          {/* Staff Pick badge — top left */}
          <Badge className="absolute top-2 left-2 sm:top-3 sm:left-3" variant="default">
            <span aria-hidden="true">⭐ </span>Staff Pick
          </Badge>

          {/* Strain type badge — top right */}
          {product.strainType && (
            <Badge className="absolute top-2 right-2 sm:top-3 sm:right-3" variant="outline">
              {product.strainType}
            </Badge>
          )}
        </div>

        {/* Card body */}
        <div className="p-3 sm:p-4">
          {/* Brand */}
          {product.brand && (
            <p className="text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wide mb-0.5 sm:mb-1">
              {product.brand}
            </p>
          )}

          {/* Product name — clamped to 2 lines */}
          <h3 className="font-semibold text-xs sm:text-sm leading-tight line-clamp-2 mb-1.5 sm:mb-2">
            {product.name}
          </h3>

          {/* Potency — <abbr> for screen reader clarity */}
          {(product.thcContent != null || product.cbdContent != null) && (
            <div className="flex gap-2 sm:gap-3 text-[11px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">
              {product.thcContent != null && (
                <span>
                  <abbr title="Tetrahydrocannabinol" className="no-underline">THC</abbr>
                  {' '}{product.thcContent.toFixed(1)}%
                </span>
              )}
              {product.cbdContent != null && (
                <span>
                  <abbr title="Cannabidiol" className="no-underline">CBD</abbr>
                  {' '}{product.cbdContent.toFixed(1)}%
                </span>
              )}
            </div>
          )}

          {/* Price + variant name */}
          {primaryVariant && (
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-base sm:text-lg font-bold">
                {formatCurrency(primaryVariant.price)}
              </span>
              {primaryVariant.name && (
                <span className="text-[11px] sm:text-xs text-muted-foreground truncate">
                  {primaryVariant.name}
                </span>
              )}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
