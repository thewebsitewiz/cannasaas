// apps/storefront/src/pages/Products/ProductsPage.tsx
import React, { useState, useCallback, useTransition } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SlidersHorizontal, Grid2X2, List } from 'lucide-react';
import { useInfiniteProducts } from '@cannasaas/api-client';
import { ProductCard, Button, Skeleton } from '@cannasaas/ui';
import { useCartStore } from '@cannasaas/stores';
import { FilterSidebar } from './components/FilterSidebar';
import { FilterDrawer } from './components/FilterDrawer';
import { SortSelect } from './components/SortSelect';
import { ActiveFilters } from './components/ActiveFilters';
import type { Product, ProductVariant } from '@cannasaas/types';
import type { ProductFilters } from '@cannasaas/api-client';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [, startTransition] = useTransition();
  const addItem = useCartStore((s) => s.addItem);

  const filters: ProductFilters = {
    category:   searchParams.get('category')   ?? undefined,
    strainType: searchParams.get('strainType') ?? undefined,
    minThc:     searchParams.get('minThc')     ? Number(searchParams.get('minThc'))   : undefined,
    maxPrice:   searchParams.get('maxPrice')   ? Number(searchParams.get('maxPrice')) : undefined,
    sort:       (searchParams.get('sort') as ProductFilters['sort']) ?? 'newest',
    search:     searchParams.get('q')          ?? undefined,
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteProducts(filters);

  const products = data?.pages.flatMap((p) => p.data) ?? [];
  const totalCount = data?.pages[0]?.pagination.total ?? 0;

  const handleFilterChange = useCallback((key: string, value: string | undefined) => {
    startTransition(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) { next.set(key, value); } else { next.delete(key); }
        next.delete('page');
        return next;
      });
    });
  }, [setSearchParams]);

  const handleAddToCart = useCallback((product: Product, variant: ProductVariant) => {
    addItem(product, variant, 1);
  }, [addItem]);

  return (
    <>
      <Helmet>
        <title>
          {filters.category
            ? `${filters.category.charAt(0).toUpperCase() + filters.category.slice(1)} Products`
            : 'All Products'} | Shop
        </title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)]">
              {filters.category
                ? filters.category.charAt(0).toUpperCase() + filters.category.slice(1)
                : 'All Products'}
            </h1>
            {!isLoading && (
              <p className="text-[var(--color-text-secondary)] mt-1" aria-live="polite" aria-atomic="true">
                {totalCount} {totalCount === 1 ? 'product' : 'products'} found
              </p>
            )}
          </div>
        </div>

        <ActiveFilters filters={filters} onRemove={handleFilterChange} className="mb-4" />

        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0" aria-label="Product filters">
            <FilterSidebar currentFilters={filters} onFilterChange={handleFilterChange} />
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-6">
              <Button variant="outline" size="md" leftIcon={<SlidersHorizontal size={16} aria-hidden="true" />}
                onClick={() => setFilterDrawerOpen(true)} className="lg:hidden"
                aria-haspopup="dialog" aria-expanded={filterDrawerOpen}>
                Filters
              </Button>
              <SortSelect value={filters.sort ?? 'newest'} onChange={(val) => handleFilterChange('sort', val)} className="ml-auto" />
              <div role="group" aria-label="View mode"
                className="hidden sm:flex border border-[var(--color-border)] rounded-[var(--p-radius-md)] overflow-hidden">
                {(['grid', 'list'] as const).map((mode) => (
                  <button key={mode} type="button"
                    onClick={() => setViewMode(mode)}
                    aria-pressed={viewMode === mode}
                    aria-label={`${mode.charAt(0).toUpperCase() + mode.slice(1)} view`}
                    className={['p-2 transition-colors',
                      viewMode === mode
                        ? 'bg-[var(--color-brand)] text-[var(--color-text-on-brand)]'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]',
                    ].join(' ')}>
                    {mode === 'grid' ? <Grid2X2 size={18} aria-hidden="true" /> : <List size={18} aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </div>

            {isError && (
              <div role="alert" className="py-12 text-center">
                <p className="text-[var(--color-error)]">Failed to load products. Please try again.</p>
                <Button variant="outline" size="md" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
              </div>
            )}

            {!isError && (
              <>
                <div
                  className={viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6'
                    : 'flex flex-col gap-4'}
                  role="list" aria-label="Products" aria-busy={isLoading}>
                  {isLoading
                    ? Array.from({ length: 9 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-[3/4] rounded-[var(--p-radius-lg)]" aria-hidden="true" />
                      ))
                    : products.map((product) => (
                        <div key={product.id} role="listitem">
                          <ProductCard product={product} onAddToCart={handleAddToCart} />
                        </div>
                      ))}
                </div>

                {hasNextPage && (
                  <div className="flex justify-center mt-10">
                    <Button variant="outline" size="lg" onClick={() => fetchNextPage()}
                      isLoading={isFetchingNextPage} loadingText="Loading more…" aria-label="Load more products">
                      Load More Products
                    </Button>
                  </div>
                )}

                {!isLoading && products.length === 0 && (
                  <div className="py-16 text-center" role="status">
                    <p className="text-[var(--color-text-secondary)] text-[var(--p-text-lg)] mb-4">
                      No products found for your filters.
                    </p>
                    <Button variant="outline" onClick={() => setSearchParams({})}>Clear all filters</Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <FilterDrawer isOpen={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)}
        currentFilters={filters} onFilterChange={handleFilterChange} />
    </>
  );
}
