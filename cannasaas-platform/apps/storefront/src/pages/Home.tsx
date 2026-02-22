/**
 * @file Home.tsx
 * @app apps/storefront
 *
 * Home page — the dispensary storefront landing page.
 *
 * Component composition:
 *   HeroBanner      — full-width promotional banner
 *   CategoryGrid    — 6-category icon navigation
 *   FeaturedSection — horizontal product carousel (featured=true)
 *   TrendingSection — horizontal product carousel (sort=newest)
 *
 * SEO: Sets document.title on mount (WCAG 2.4.2).
 * The page title includes the dispensary name from organizationStore.
 *
 * Performance: FeaturedSection and TrendingSection lazy-load their data
 * independently — the hero and category grid render instantly.
 */

import { useEffect } from 'react';
import { useOrganizationStore } from '@cannasaas/stores';
import { HeroBanner } from '../components/home/HeroBanner';
import { CategoryGrid } from '../components/home/CategoryGrid';
import { FeaturedSection } from '../components/home/FeaturedSection';
import { TrendingSection } from '../components/home/TrendingSection';

export function HomePage() {
  const { dispensary, organization } = useOrganizationStore();
  const name = dispensary?.name ?? organization?.name ?? 'CannaSaas';

  // WCAG 2.4.2 — Set descriptive page title on mount
  useEffect(() => {
    document.title = `${name} — Premium Cannabis`;
  }, [name]);

  return (
    <>
      {/* Hero banner — above the fold, highest visual priority */}
      <HeroBanner promotionText="Free delivery on orders over $75" />

      {/* Remaining sections in a contained max-width wrapper */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Category navigation grid */}
        <CategoryGrid />

        {/* Featured products carousel */}
        <FeaturedSection />

        {/* Divider */}
        <hr aria-hidden="true" className="border-stone-100 my-2" />

        {/* New arrivals / trending carousel */}
        <TrendingSection />

        {/* Bottom spacer */}
        <div className="h-16" />
      </div>
    </>
  );
}
