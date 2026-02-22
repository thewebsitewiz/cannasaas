/**
 * ═══════════════════════════════════════════════════════════════════
 * CannaSaas Storefront — Home Page (Orchestrator)
 * ═══════════════════════════════════════════════════════════════════
 *
 * File:   apps/storefront/src/pages/Home.tsx
 * Route:  /
 *
 * This is a thin orchestrator that composes all homepage sections.
 * It owns data fetching and passes results to presentational
 * components. No layout or rendering logic lives here — that's
 * delegated to the component tree below.
 *
 * ─── DATA FETCHING STRATEGY ─────────────────────────────────────
 *
 *   Immediate (above the fold):
 *     • usePromotions({ active: true })     → HeroBanner
 *     • useProducts({ featured: true })     → Featured carousel
 *     • useProducts.categories()            → CategoryGrid
 *     • useProducts({ sort: 'newest' })     → New Arrivals carousel
 *
 *   Deferred (below the fold):
 *     • TrendingSection internally calls useProducts({ sort: 'trending' })
 *       only when it enters the viewport via IntersectionObserver.
 *
 * ─── ERROR ISOLATION ────────────────────────────────────────────
 *
 *   Each section is wrapped in <SectionErrorBoundary>. A failed
 *   promotions API call doesn't prevent products from rendering.
 *   The hero fallback is `null` (silent removal). Product section
 *   fallbacks could show a retry prompt in production.
 *
 * ─── SEMANTIC STRUCTURE ─────────────────────────────────────────
 *
 *   <main>                         ← Primary landmark
 *     <div>  Hero Banner  </div>   ← Full-bleed, no max-width
 *     <section> Categories </section>
 *     <section> Featured   </section>
 *     <section> Trending   </section>   ← Lazy-loaded
 *     <section> New Arrivals </section>
 *   </main>
 *
 *   Combined with the "Skip to main content" link in MainLayout.tsx
 *   (WCAG 2.4.1), keyboard users bypass the global nav in one key.
 *
 * ─── FILE MAP ───────────────────────────────────────────────────
 *
 *   hooks/
 *     useReducedMotion.ts        OS motion preference
 *     useMediaQuery.ts           Generic CSS media query
 *     useIntersectionObserver.ts Viewport detection (fire-once)
 *     useAutoplay.ts             Auto-advance timer with pause
 *
 *   components/layout/
 *     Section.tsx                Compound: Section + Header + Content
 *     SectionErrorBoundary.tsx   Per-section error isolation
 *
 *   components/home/
 *     HeroBanner.tsx             Promotions carousel
 *     HeroBannerSkeleton.tsx     Loading placeholder
 *     CategoryGrid.tsx           Category navigation tiles (memo'd)
 *     ProductCarousel.tsx        Render-prop horizontal scroll
 *     ProductCarouselSkeleton.tsx Loading placeholder
 *     TrendingSection.tsx        Lazy-loaded trending wrapper
 *     cards/
 *       FeaturedProductCard.tsx  Staff Pick badge + potency
 *       TrendingProductCard.tsx  Rank number badge
 *       NewArrivalCard.tsx       "NEW" badge
 */

import { useCallback } from 'react';
import { useProducts, usePromotions } from '@cannasaas/api-client';
import { useOrganizationStore } from '@cannasaas/stores';
import { Section, SectionErrorBoundary } from '@/components/layout';
import {
  HeroBanner,
  HeroBannerSkeleton,
  CategoryGrid,
  ProductCarousel,
  ProductCarouselSkeleton,
  TrendingSection,
  FeaturedProductCard,
  NewArrivalCard,
} from '@/components/home';
import type { Product } from '@cannasaas/types';

export default function Home() {
  const { dispensary } = useOrganizationStore();

  // ── Data Fetching ──
  // TanStack Query wrappers that auto-inject tenant context headers
  // (X-Organization-Id, X-Dispensary-Id) from the organization store.

  const { data: promotions = [], isLoading: promosLoading } = usePromotions({
    active: true,
  });

  const { data: featured = [], isLoading: featuredLoading } = useProducts({
    featured: true,
    limit: 10,
  });

  const { data: newArrivals = [], isLoading: newArrivalsLoading } = useProducts({
    sort: 'newest',
    limit: 10,
  });

  const { data: categories = [] } = useProducts.categories();

  // ── Stable render callbacks ──
  // useCallback preserves referential identity so ProductCarousel
  // doesn't re-render when unrelated state (promotions, etc.) updates.
  // Empty dependency arrays are correct — these receive data via args.

  const renderFeaturedItem = useCallback(
    (product: Product) => <FeaturedProductCard product={product} />,
    [],
  );

  const renderNewArrivalItem = useCallback(
    (product: Product) => <NewArrivalCard product={product} />,
    [],
  );

  return (
    <main>
      {/* 1. HERO BANNER — Full-bleed promotions carousel.
             Fallback: null (silent removal on error). */}
      <SectionErrorBoundary fallback={null}>
        {promosLoading ? (
          <HeroBannerSkeleton />
        ) : (
          <HeroBanner promotions={promotions} />
        )}
      </SectionErrorBoundary>

      {/* 2. CATEGORY GRID — <nav> landmark, memo'd. */}
      <SectionErrorBoundary>
        <Section>
          <Section.Content>
            <Section.Header
              title="Shop by Category"
              subtitle={`Browse ${dispensary?.name ?? 'our'} collection`}
            />
            <CategoryGrid categories={categories} />
          </Section.Content>
        </Section>
      </SectionErrorBoundary>

      {/* 3. FEATURED PRODUCTS — Staff picks with potency info.
             bg-muted/30 alternates background for visual rhythm. */}
      <SectionErrorBoundary>
        <Section className="bg-muted/30">
          <Section.Content>
            <Section.Header
              title="Featured Products"
              subtitle="Hand-picked by our staff"
              viewAllHref="/products?featured=true"
            />
            {featuredLoading ? (
              <ProductCarouselSkeleton />
            ) : (
              <ProductCarousel
                products={featured}
                ariaLabel="Featured products"
                renderItem={renderFeaturedItem}
              />
            )}
          </Section.Content>
        </Section>
      </SectionErrorBoundary>

      {/* 4. TRENDING — Lazy-loaded (API deferred until in viewport). */}
      <SectionErrorBoundary>
        <TrendingSection />
      </SectionErrorBoundary>

      {/* 5. NEW ARRIVALS — Fetched immediately (conversion driver). */}
      <SectionErrorBoundary>
        <Section>
          <Section.Content>
            <Section.Header
              title="Just Dropped 🆕"
              subtitle="Fresh additions to the menu"
              viewAllHref="/products?sort=newest"
            />
            {newArrivalsLoading ? (
              <ProductCarouselSkeleton />
            ) : (
              <ProductCarousel
                products={newArrivals}
                ariaLabel="New arrival products"
                renderItem={renderNewArrivalItem}
              />
            )}
          </Section.Content>
        </Section>
      </SectionErrorBoundary>
    </main>
  );
}
