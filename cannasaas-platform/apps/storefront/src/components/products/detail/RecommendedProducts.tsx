/**
 * ═══════════════════════════════════════════════════════════════════
 * RecommendedProducts — "You May Also Like" Carousel
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/products/detail/RecommendedProducts.tsx
 *
 * Fetches and displays product recommendations from the Sprint 9
 * recommendations API. The API returns products based on:
 *   - Same strain type (Sativa → other Sativas)
 *   - Similar terpene profiles
 *   - Collaborative filtering ("customers also bought")
 *   - Same category fallback
 *
 * Uses the ProductCarousel render prop component from the Home page
 * for the horizontal scroll behavior, and a simplified card for
 * the recommendation context.
 *
 * Data fetching:
 *   - useRecommendations(productId) — TanStack Query hook
 *   - Deferred via enabled: !!productId (no fetch without a product)
 *   - staleTime: 5 minutes (recommendations don't change often)
 *   - Graceful degradation: if the API fails, the section is
 *     hidden entirely (not a critical page element)
 *
 * Accessibility (WCAG):
 *   - <section> with aria-labelledby heading (1.3.1)
 *   - Uses ProductCarousel's built-in list semantics (1.3.1)
 *   - Each card is a Link with descriptive aria-label (4.1.2)
 *   - Loading skeleton is accessible (role="status")
 *
 * Responsive:
 *   - Uses ProductCarousel's responsive card widths
 *   - Section padding matches other page sections
 */

import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useRecommendations } from '@cannasaas/api-client';
import { Card, Badge } from '@cannasaas/ui';
import { formatCurrency } from '@cannasaas/utils';
import { ProductCarousel } from '@/components/home/ProductCarousel';
import { ProductCarouselSkeleton } from '@/components/home/ProductCarouselSkeleton';
import type { Product } from '@cannasaas/types';

interface RecommendedProductsProps {
  productId: string;
  /** Current product's category — used as section subtitle */
  category?: string;
}

/** Simplified card for recommendations — lighter than ProductCard */
function RecommendedCard({ product }: { product: Product }) {
  const primaryVariant = product.variants?.[0];

  return (
    <Link
      to={`/products/${product.id}`}
      aria-label={[
        product.name,
        product.brand && `by ${product.brand}`,
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
            <div className="w-full h-full flex items-center justify-center text-4xl" aria-hidden="true">
              🌿
            </div>
          )}
          {product.strainType && (
            <Badge className="absolute top-2 left-2" variant="outline">
              {product.strainType}
            </Badge>
          )}
        </div>
        <div className="p-3">
          {product.brand && (
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{product.brand}</p>
          )}
          <h3 className="font-semibold text-xs sm:text-sm leading-tight line-clamp-2 mt-0.5">
            {product.name}
          </h3>
          {primaryVariant && (
            <p className="font-bold text-sm mt-1.5">{formatCurrency(primaryVariant.price)}</p>
          )}
        </div>
      </Card>
    </Link>
  );
}

export function RecommendedProducts({ productId, category }: RecommendedProductsProps) {
  const headingId = 'recommended-heading';

  const {
    data: recommendations = [],
    isLoading,
    isError,
  } = useRecommendations(productId, {
    limit: 10,
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Stable render callback for ProductCarousel
  const renderItem = useCallback(
    (product: Product) => <RecommendedCard product={product} />,
    [],
  );

  // Don't render the section at all if the API failed or returned nothing
  if (isError || (!isLoading && recommendations.length === 0)) return null;

  return (
    <section aria-labelledby={headingId} className="mt-12 sm:mt-16">
      <div className="flex items-end justify-between mb-4 sm:mb-6">
        <div>
          <h2 id={headingId} className="text-xl sm:text-2xl font-bold tracking-tight">
            You May Also Like
          </h2>
          {category && (
            <p className="text-sm text-muted-foreground mt-0.5 capitalize">
              More from {category}
            </p>
          )}
        </div>
        <Link
          to={`/products?category=${category ?? ''}`}
          className="
            text-sm font-medium text-primary hover:text-primary/80
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-primary focus-visible:ring-offset-2
            rounded-sm transition-colors
          "
        >
          View All<span className="sr-only"> similar products</span>
          <span aria-hidden="true"> →</span>
        </Link>
      </div>

      {isLoading ? (
        <ProductCarouselSkeleton />
      ) : (
        <ProductCarousel
          products={recommendations}
          ariaLabel="Recommended products"
          renderItem={renderItem}
        />
      )}
    </section>
  );
}
