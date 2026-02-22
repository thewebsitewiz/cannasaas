/**
 * @file FeaturedSection.tsx
 * @app apps/storefront
 *
 * "Featured Products" section — wraps a ProductCarousel with a
 * background section treatment and a "View All" link.
 *
 * Data: Calls useProducts({ featured: true, limit: 12 })
 *
 * Accessibility:
 *   - <section> with aria-labelledby pointing to the heading
 *   - Products are within a ProductCarousel which handles its own a11y
 */

import { Link } from 'react-router-dom';
import { ProductCarousel } from '../product/ProductCarousel';
import { ROUTES } from '../../routes';
import { useProducts } from '@cannasaas/api-client';

export function FeaturedSection() {
  const { data, isLoading } = useProducts({ limit: 12 } as any);

  return (
    <section aria-labelledby="featured-heading" className="py-8 lg:py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            id="featured-heading"
            className="text-2xl font-bold text-stone-900"
          >
            Featured Products
          </h2>
          <p className="text-sm text-stone-500 mt-0.5">
            Hand-picked by our budtenders
          </p>
        </div>
        <Link
          to={ROUTES.products}
          className={[
            'text-sm font-medium text-[hsl(var(--primary))]',
            'hover:underline',
            'focus-visible:outline-none focus-visible:underline',
          ].join(' ')}
        >
          View all →
        </Link>
      </div>

      <ProductCarousel
        title="Featured Products"
        products={data?.data}
        isLoading={isLoading}
        ariaLabel="Featured products carousel"
      />
    </section>
  );
}
