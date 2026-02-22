/**
 * @file ProductGrid.tsx
 * @app apps/storefront
 *
 * Responsive product grid with skeleton loading state.
 *
 * Grid layout:
 *   - 2 columns on mobile (xs–sm)
 *   - 3 columns on md–lg
 *   - 4 columns on xl+
 *
 * States:
 *   - Loading: 8 SkeletonCard placeholders (prevents layout shift)
 *   - Empty: illustrated empty state with clear-filters CTA
 *   - Error: friendly error message with retry button
 *   - Success: ProductCard grid
 *
 * Accessibility:
 *   - <ul role="list"> wraps all cards
 *   - aria-busy="true" while loading (WCAG 4.1.3)
 *   - Empty state has role="status" to announce to screen readers
 *   - Result count announced via aria-live region
 */

import { ProductCard } from '../product/ProductCard';
import { SkeletonCard } from '../ui/SkeletonCard';
import type { Product } from '../../types/storefront';

interface ProductGridProps {
  products: Product[] | undefined;
  isLoading: boolean;
  isError: boolean;
  totalCount?: number;
  onRetry?: () => void;
  onClearFilters?: () => void;
}

export function ProductGrid({
  products,
  isLoading,
  isError,
  totalCount,
  onRetry,
  onClearFilters,
}: ProductGridProps) {
  const gridClasses = 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5';

  // ── Loading state ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading products">
        <div className={gridClasses} role="list">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} role="listitem">
              <SkeletonCard />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div role="alert" className="text-center py-16">
        <p className="text-3xl mb-3" aria-hidden="true">⚠️</p>
        <h3 className="text-lg font-semibold text-stone-800 mb-2">Something went wrong</h3>
        <p className="text-sm text-stone-500 mb-5">We couldn't load the products. Please try again.</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 bg-[hsl(var(--primary))] text-white text-sm font-medium rounded-lg hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] transition-all"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!products || products.length === 0) {
    return (
      <div role="status" className="text-center py-16">
        <p className="text-4xl mb-4" aria-hidden="true">🌿</p>
        <h3 className="text-lg font-semibold text-stone-800 mb-2">No products found</h3>
        <p className="text-sm text-stone-500 mb-5">Try adjusting your filters or search term.</p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="px-4 py-2 border border-stone-200 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  // ── Success state ───────────────────────────────────────────────────────────
  return (
    <div>
      {/* Live count announcement for screen readers */}
      {totalCount != null && (
        <p aria-live="polite" className="sr-only">
          {totalCount} product{totalCount !== 1 ? 's' : ''} found
        </p>
      )}

      <ul role="list" className={gridClasses}>
        {products.map((product, i) => (
          <li key={product.id}>
            {/* Mark first 4 cards as priority (above fold on desktop) */}
            <ProductCard product={product} priority={i < 4} />
          </li>
        ))}
      </ul>
    </div>
  );
}
