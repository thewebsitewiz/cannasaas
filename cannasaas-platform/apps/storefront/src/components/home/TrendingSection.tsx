/**
 * ═══════════════════════════════════════════════════════════════════
 * TrendingSection — Lazy-Loaded
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/home/TrendingSection.tsx
 *
 * Below-the-fold optimization: the TanStack Query API call is
 * deferred via the `enabled` flag until the IntersectionObserver
 * fires. rootMargin "200px" means the observer triggers 200px
 * before the section enters the viewport, so data usually arrives
 * by the time the user scrolls there.
 *
 * This saves one API round-trip and its payload on initial page
 * load for users who never scroll past "Featured Products".
 *
 * Once visible, TanStack Query caches the result — scrolling away
 * and back doesn't re-fetch (cache is still warm).
 */

import { useProducts } from '@cannasaas/api-client';
import { useIntersectionObserver } from '@/hooks';
import { Section } from '@/components/layout/Section';
import { ProductCarousel } from './ProductCarousel';
import { ProductCarouselSkeleton } from './ProductCarouselSkeleton';
import { TrendingProductCard } from './cards/TrendingProductCard';

export function TrendingSection() {
  const [ref, isVisible] = useIntersectionObserver({ rootMargin: '200px' });

  // `enabled: isVisible` prevents the query from firing until the
  // IntersectionObserver triggers.
  const { data: trending = [], isLoading } = useProducts({
    sort: 'trending',
    limit: 10,
    enabled: isVisible,
  });

  return (
    <div ref={ref}>
      <Section>
        <Section.Content>
          <Section.Header
            title="Trending Now 🔥"
            subtitle="Most popular this week"
            viewAllHref="/products?sort=trending"
          />
          {isLoading ? (
            <ProductCarouselSkeleton />
          ) : (
            <ProductCarousel
              products={trending}
              ariaLabel="Trending products"
              renderItem={(product, index) => (
                <TrendingProductCard product={product} rank={index + 1} />
              )}
            />
          )}
        </Section.Content>
      </Section>
    </div>
  );
}
