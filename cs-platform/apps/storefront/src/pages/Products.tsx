/**
 * ═══════════════════════════════════════════════════════════════════
 * CannaSaas Storefront — Products Page (Orchestrator)
 * ═══════════════════════════════════════════════════════════════════
 *
 * File:   apps/storefront/src/pages/Products.tsx
 * Route:  /products
 *
 * The most complex storefront page. Thin orchestrator that:
 *   1. Reads all filter/sort/page state from URL search params
 *   2. Passes filters to the useProducts TanStack Query hook
 *   3. Composes the sidebar, toolbar, grid, and pagination
 *
 * ─── URL-DRIVEN STATE ───────────────────────────────────────────
 *
 * All filter state lives in URL search params via useProductFilters:
 *
 *   /products?search=blue&category=flower&strainType=sativa,hybrid
 *   &priceMin=20&priceMax=80&thcMin=15&thcMax=30&sort=price_asc&page=2
 *
 * Benefits: shareable links, browser back/forward, bookmarkable,
 * SSR-compatible, no state duplication.
 *
 * ─── LAYOUT STRUCTURE ───────────────────────────────────────────
 *
 *   Desktop (lg+):
 *   ┌──────────────────────────────────────────────┐
 *   │ Search Input                                  │
 *   ├──────────┬───────────────────────────────────┤
 *   │          │ Active Filters  |  Sort  | Count  │
 *   │  Filter  ├───────────────────────────────────┤
 *   │  Sidebar │                                   │
 *   │  (260px) │     Product Grid (3 col)          │
 *   │          │                                   │
 *   │          ├───────────────────────────────────┤
 *   │          │         Pagination                │
 *   └──────────┴───────────────────────────────────┘
 *
 *   Mobile (< lg):
 *   ┌──────────────────────┐
 *   │ Search Input          │
 *   ├──────────────────────┤
 *   │ [Filters] | Sort     │   ← "Filters" opens MobileFilterDrawer
 *   ├──────────────────────┤
 *   │ Active Filter Chips   │
 *   ├──────────────────────┤
 *   │ Product Grid (2 col)  │
 *   ├──────────────────────┤
 *   │     Pagination        │
 *   └──────────────────────┘
 *
 * ─── DATA FLOW ──────────────────────────────────────────────────
 *
 *   useProductFilters() → { filters, actions }
 *        │
 *        ├─→ useProducts(filters)  → { products, totalPages, totalCount }
 *        ├─→ FilterSidebar(filters, actions)
 *        ├─→ ActiveFilters(filters, actions)
 *        ├─→ SortDropdown(filters.sort, actions.setSort)
 *        ├─→ ProductGrid(products)
 *        └─→ Pagination(filters.page, totalPages, actions.setPage)
 *
 * ─── ERROR HANDLING ─────────────────────────────────────────────
 *
 * The grid and sidebar are wrapped in SectionErrorBoundary from the
 * layout components. A failed product fetch shows an error state
 * inside the grid area; the filters remain functional.
 *
 * ─── FILE MAP ───────────────────────────────────────────────────
 *
 *   hooks/
 *     useDebounce.ts           Delays value updates (search input)
 *     useProductFilters.ts     URL ↔ filter state bridge
 *
 *   components/products/
 *     SearchInput.tsx           Debounced search with clear button
 *     FilterAccordionItem.tsx   Collapsible <details>/<summary>
 *     CategoryFilter.tsx        Radio-style category selection
 *     RangeSlider.tsx           Dual-thumb slider (price & THC)
 *     StrainTypeFilter.tsx      Multi-select checkbox group
 *     ActiveFilters.tsx         Removable filter chip bar
 *     FilterSidebar.tsx         Composes all filter controls
 *     MobileFilterDrawer.tsx    <dialog>-based slide-in panel
 *     SortDropdown.tsx          Native <select> for sort order
 *     ProductCard.tsx           Grid card with Add to Cart
 *     ProductGrid.tsx           Responsive 2/3-col grid + empty state
 *     ProductGridSkeleton.tsx   Shimmer loading placeholder
 *     Pagination.tsx            Smart pagination with ellipsis
 */

import { useState } from 'react';
import { useProducts } from '@cannasaas/api-client';
import { useProductFilters } from '@/hooks';
import { SectionErrorBoundary } from '@/components/layout';
import {
  SearchInput,
  ActiveFilters,
  FilterSidebar,
  MobileFilterDrawer,
  SortDropdown,
  ProductGrid,
  Pagination,
} from '@/components/products';

/** Products per page */
const PAGE_SIZE = 12;

export default function Products() {
  const { filters, actions } = useProductFilters();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // ── Data Fetching ──
  // TanStack Query hook — auto-injects tenant headers and refetches
  // whenever `filters` changes (URL params change → new object →
  // new query key → automatic refetch).
  const {
    data,
    isLoading,
  } = useProducts({
    search: filters.search,
    category: filters.category,
    strainTypes: filters.strainTypes,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
    thcMin: filters.thcMin,
    thcMax: filters.thcMax,
    sort: filters.sort,
    page: filters.page,
    limit: PAGE_SIZE,
  });

  const products = data?.products ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.totalCount ?? 0;

  // Categories for the sidebar filter
  const { data: categories = [] } = useProducts.categories();

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

      {/* ════════════════════════════════════════════════════════
          SEARCH BAR
          ════════════════════════════════════════════════════════
          Full width above the sidebar/grid split. Debounced at
          500ms — updates URL params after the user stops typing. */}
      <div className="py-6 sm:py-8">
        <SearchInput
          value={filters.search}
          onSearch={actions.setSearch}
        />
      </div>

      {/* ════════════════════════════════════════════════════════
          MAIN LAYOUT — Sidebar + Content
          ════════════════════════════════════════════════════════
          Desktop: flex row with fixed-width sidebar
          Mobile: single column (sidebar hidden behind drawer) */}
      <div className="flex gap-8 pb-12">

        {/* ── Desktop Sidebar (hidden below lg) ── */}
        <aside
          aria-label="Product filters"
          className="hidden lg:block w-[260px] flex-shrink-0"
        >
          <div className="sticky top-24">
            <SectionErrorBoundary>
              <FilterSidebar
                filters={filters}
                actions={actions}
                categories={categories}
              />
            </SectionErrorBoundary>
          </div>
        </aside>

        {/* ── Content Area ── */}
        <div className="flex-1 min-w-0">

          {/* ── Toolbar: Mobile filter button + Active filters + Sort + Count ── */}
          <div className="flex flex-col gap-3 sm:gap-4 mb-6">

            {/* Top row: filter button (mobile) + sort + count */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Mobile "Filters" button — opens MobileFilterDrawer.
                    Hidden on lg+ where the sidebar is visible. */}
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  aria-label="Open filters"
                  className="
                    lg:hidden
                    inline-flex items-center gap-1.5
                    px-3 py-2 min-h-[44px]
                    text-sm font-medium
                    border border-border rounded-lg
                    hover:border-primary/50 hover:bg-muted
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-primary focus-visible:ring-offset-2
                    transition-colors
                  "
                >
                  <span aria-hidden="true">☰</span>
                  Filters
                  {/* Badge showing active filter count */}
                  {actions.hasActiveFilters && (
                    <span className="
                      inline-flex items-center justify-center
                      min-w-[20px] h-5 px-1
                      text-[11px] font-semibold
                      bg-primary text-primary-foreground
                      rounded-full
                    ">
                      {/* Count all active individual filters */}
                      {[
                        filters.search ? 1 : 0,
                        filters.category ? 1 : 0,
                        filters.strainTypes.length,
                        (filters.priceMin !== null || filters.priceMax !== null) ? 1 : 0,
                        (filters.thcMin !== null || filters.thcMax !== null) ? 1 : 0,
                      ].reduce((a, b) => a + b, 0)}
                    </span>
                  )}
                </button>

                {/* Result count */}
                <p
                  className="text-sm text-muted-foreground"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {isLoading ? (
                    <span className="animate-pulse">Searching…</span>
                  ) : (
                    <>
                      <span className="font-medium text-foreground">{totalCount}</span>
                      {' '}product{totalCount !== 1 ? 's' : ''}
                    </>
                  )}
                </p>
              </div>

              {/* Sort dropdown */}
              <SortDropdown value={filters.sort} onChange={actions.setSort} />
            </div>

            {/* Active filter chips */}
            <ActiveFilters filters={filters} actions={actions} />
          </div>

          {/* ── Product Grid ── */}
          <SectionErrorBoundary
            fallback={
              <div role="alert" className="py-12 text-center text-muted-foreground">
                Something went wrong loading products. Please try refreshing.
              </div>
            }
          >
            <ProductGrid products={products} isLoading={isLoading} />
          </SectionErrorBoundary>

          {/* ── Pagination ── */}
          {!isLoading && totalPages > 1 && (
            <div className="mt-8 sm:mt-10">
              <Pagination
                currentPage={filters.page}
                totalPages={totalPages}
                onPageChange={(page) => {
                  actions.setPage(page);
                  // Scroll to top of the grid on page change
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          MOBILE FILTER DRAWER
          ════════════════════════════════════════════════════════
          Native <dialog> with slide-in animation. Reuses the
          same FilterSidebar component as the desktop sidebar. */}
      <MobileFilterDrawer
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        resultCount={totalCount}
      >
        <FilterSidebar
          filters={filters}
          actions={actions}
          categories={categories}
        />
      </MobileFilterDrawer>
    </main>
  );
}
