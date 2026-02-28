// apps/storefront/src/pages/Home/HomePage.tsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useCurrentTenant } from '@cannasaas/stores';
import { HeroSection } from './sections/HeroSection';
import { FeaturedProductsSection } from './sections/FeaturedProductsSection';
import { CategoryCardsSection } from './sections/CategoryCardsSection';
import { SpecialsSection } from './sections/SpecialsSection';
import { DispensaryInfoSection } from './sections/DispensaryInfoSection';

export default function HomePage() {
  const tenant = useCurrentTenant();
  return (
    <>
      <Helmet>
        <title>{tenant?.dispensaryName ?? 'Shop'} | Cannabis Dispensary</title>
        <meta name="description"
          content={`Browse premium cannabis products at ${tenant?.dispensaryName ?? 'our dispensary'}. Order online for pickup or delivery.`} />
      </Helmet>

      <HeroSection />

      <section aria-labelledby="categories-heading" className="py-12 md:py-16 bg-[var(--color-bg-secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="categories-heading" className="text-[var(--p-text-2xl)] font-bold text-[var(--color-text)] mb-8">
            Shop by Category
          </h2>
          <CategoryCardsSection />
        </div>
      </section>

      <section aria-labelledby="featured-heading" className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 id="featured-heading" className="text-[var(--p-text-2xl)] font-bold text-[var(--color-text)]">
              Featured Products
            </h2>
          </div>
          <FeaturedProductsSection />
        </div>
      </section>

      <SpecialsSection />
      <DispensaryInfoSection />
    </>
  );
}
