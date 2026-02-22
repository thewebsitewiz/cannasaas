/**
 * @file TrendingSection.tsx
 * @app apps/storefront
 *
 * "New Arrivals" carousel section.
 * Calls useProducts({ sort: 'newest', limit: 10 })
 */

import { useProducts } from '@cannasaas/api-client';
import { ProductCarousel } from '../product/ProductCarousel';

export function TrendingSection() {
  const { data, isLoading } = useProducts({ sort: 'newest', limit: 10 } as any);

  return (
    <section aria-labelledby="new-arrivals-heading" className="py-8 lg:py-10">
      <ProductCarousel
        title="New Arrivals"
        products={data?.data}
        isLoading={isLoading}
        ariaLabel="New arrivals carousel"
      />
    </section>
  );
}
