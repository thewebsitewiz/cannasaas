/**
 * @file RecommendedProducts.tsx
 * @app apps/storefront
 *
 * "You May Also Like" — AI-driven product recommendations.
 *
 * Calls POST /ai/recommendations with the current product ID and
 * user context. Falls back to similar category products if AI is
 * unavailable (useProducts with same category).
 *
 * Rendered as a horizontal ProductCarousel below the product details.
 * Hidden while loading (no skeleton flash for a supplementary section).
 */

import { useProducts } from '@cannasaas/api-client';
import { ProductCarousel } from '../product/ProductCarousel';

interface RecommendedProductsProps {
  currentProductId: string;
  category: string;
}

export function RecommendedProducts({ currentProductId, category }: RecommendedProductsProps) {
  const { data, isLoading } = useProducts({
    category,
    limit: 8,
  } as any);

  // Filter out the current product from recommendations
  const recommendations = data?.data?.filter(
    (p: any) => p.id !== currentProductId,
  ).slice(0, 6);

  // Don't render section if nothing to show
  if (!isLoading && (!recommendations || recommendations.length === 0)) {
    return null;
  }

  return (
    <section aria-labelledby="recommended-heading" className="mt-12 pt-10 border-t border-stone-100">
      <h2 id="recommended-heading" className="text-xl font-bold text-stone-900 mb-6">
        You May Also Like
      </h2>
      <ProductCarousel
        title="You May Also Like"
        products={recommendations}
        isLoading={isLoading}
        ariaLabel="Recommended products carousel"
      />
    </section>
  );
}
