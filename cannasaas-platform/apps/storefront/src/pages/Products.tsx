/**
 * @file Products.tsx
 * @app apps/storefront
 *
 * Products listing page — the core product browsing experience.
 *
 * Architecture: URL-driven state
 * All filter and pagination state lives in the URL search params.
 * This means:
 *   ✅ Shareable URLs: "Browse Flower under $60" → copy link
 *   ✅ Browser back/forward works correctly
 *   ✅ Page refresh preserves filters
 *   ✅ SEO-friendly (crawlers see filtered results)
 *
 * URL params used:
 *   q          — text search query
 *   category   — product category slug
 *   strainType — cannabis strain type
 *   minPrice   — minimum price in dollars
 *   maxPrice   — maximum price in dollars
 *   minThc     — minimum THC percentage
 *   maxThc     — maximum THC percentage
 *   inStock    — "true" to show only in-stock items
 *   sort       — sort order key
 *   page       — current page number (1-indexed)
 *
 * Component tree:
 *   ProductsPage
 *   ├── (desktop) FilterSidebar     ← sticky left panel, lg+
 *   ├── (mobile)  MobileFilterDrawer ← bottom sheet, <lg
 *   ├── Toolbar row
 *   │   ├── Result count + search echo
 *   │   ├── SortDropdown
 *   │   └── FilterChips (active filter pills)
 *   ├── ProductGrid                 ← main content
 *   └── Pagination                  ← page nav
 *
 * Accessibility:
 *   - document.title updated with filter context (WCAG 2.4.2)
 *   - <main> heading is <h1> ("Products" or "Results for X") (WCAG 2.4.6)
 *   - Filter changes: aria-live "polite" announces new result count
 *   - Loading state: aria-busy on grid (WCAG 4.1.3)
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '@cannasaas/api-client';
import { useDebounce } from '../hooks/useDebounce';
import { FilterSidebar } from '../components/products/FilterSidebar';
import { MobileFilterDrawer } from '../components/products/MobileFilterDrawer';
import { FilterChips } from '../components/products/FilterChips';
import { SortDropdown } from '../components/products/SortDropdown';
import { ProductGrid } from '../components/products/ProductGrid';
import { Pagination } from '../components/ui/Pagination';
import type { ProductQueryParams } from '@cannasaas/api-client';

// ── URL param ↔ filter state helpers ─────────────────────────────────────────

/** Read all filter values from URL search params */
function readFiltersFromUrl(params: URLSearchParams): Partial<ProductQueryParams> {
  return {
    search:    params.get('q') ?? undefined,
    category:  params.get('category') ?? undefined,
    strainType: params.get('strainType') as any ?? undefined,
    minPrice:  params.get('minPrice') ? Number(params.get('minPrice')) : undefined,
    maxPrice:  params.get('maxPrice') ? Number(params.get('maxPrice')) : undefined,
    minThc:    params.get('minThc')   ? Number(params.get('minThc'))   : undefined,
    maxThc:    params.get('maxThc')   ? Number(params.get('maxThc'))   : undefined,
    inStock:   params.get('inStock')  === 'true' ? true : undefined,
    sort:      params.get('sort') as any ?? 'popularity_desc',
    page:      params.get('page') ? Number(params.get('page')) : 1,
    limit:     20,
  };
}

/** Write filter values to URL search params */
function writeFiltersToUrl(filters: Partial<ProductQueryParams>): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search)    params.set('q',          filters.search);
  if (filters.category)  params.set('category',   filters.category);
  if (filters.strainType)params.set('strainType',  filters.strainType as string);
  if (filters.minPrice != null) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice != null) params.set('maxPrice', String(filters.maxPrice));
  if (filters.minThc   != null) params.set('minThc',   String(filters.minThc));
  if (filters.maxThc   != null) params.set('maxThc',   String(filters.maxThc));
  if (filters.inStock)   params.set('inStock', 'true');
  if (filters.sort && filters.sort !== 'popularity_desc') params.set('sort', filters.sort as string);
  if (filters.page && filters.page > 1) params.set('page', String(filters.page));
  return params;
}

// ── ProductsPage ──────────────────────────────────────────────────────────────

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Derive filter state from URL params
  const filters = useMemo(() => readFiltersFromUrl(searchParams), [searchParams]);

  // Local search input value (debounced before updating URL)
  const [searchInput, setSearchInput] = useState(filters.search ?? '');
  const debouncedSearch = useDebounce(searchInput, 500);

  // Sync debounced search to URL
  useEffect(() => {
    const current = searchParams.get('q') ?? '';
    if (debouncedSearch !== current) {
      updateFilters({ search: debouncedSearch || undefined, page: 1 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Build query for the API
  const queryFilters: ProductQueryParams = {
    ...filters,
    limit: 20,
  };

  const { data, isLoading, isError, refetch } = useProducts(queryFilters);
  const products   = data?.data ?? [];
  const pagination = data?.pagination;
  const totalCount = pagination?.total ?? 0;

  // WCAG 2.4.2 — Update page title with filter context
  useEffect(() => {
    const ctx = filters.search
      ? `"${filters.search}" — `
      : filters.category
        ? `${filters.category} — `
        : '';
    document.title = `${ctx}Products | CannaSaas`;
  }, [filters.search, filters.category]);

  // ── Filter mutation helpers ─────────────────────────────────────────────────

  const updateFilters = useCallback(
    (patch: Partial<ProductQueryParams>) => {
      const next = { ...filters, ...patch };
      // Reset to page 1 on any filter change (except explicit page change)
      if (!('page' in patch)) next.page = 1;
      setSearchParams(writeFiltersToUrl(next), { replace: true });
    },
    [filters, setSearchParams],
  );

  const clearAllFilters = useCallback(() => {
    setSearchInput('');
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  // ── Active filter chips ─────────────────────────────────────────────────────

  const activeChips = useMemo(() => {
    const chips = [];
    if (filters.search)    chips.push({ key: 'search',    label: `"${filters.search}"`, onRemove: () => { setSearchInput(''); updateFilters({ search: undefined }); } });
    if (filters.category)  chips.push({ key: 'category',  label: filters.category,      onRemove: () => updateFilters({ category: undefined }) });
    if (filters.strainType)chips.push({ key: 'strain',    label: String(filters.strainType), onRemove: () => updateFilters({ strainType: undefined }) });
    if (filters.minPrice != null || filters.maxPrice != null) {
      const label = [filters.minPrice ? `$${filters.minPrice}` : '$0', filters.maxPrice ? `$${filters.maxPrice}` : '+'].join('–');
      chips.push({ key: 'price', label, onRemove: () => updateFilters({ minPrice: undefined, maxPrice: undefined }) });
    }
    if (filters.minThc != null || filters.maxThc != null) {
      const label = [filters.minThc ? `${filters.minThc}%` : '0%', filters.maxThc ? `${filters.maxThc}%` : '+'].join('–') + ' THC';
      chips.push({ key: 'thc', label, onRemove: () => updateFilters({ minThc: undefined, maxThc: undefined }) });
    }
    if (filters.inStock) chips.push({ key: 'inStock', label: 'In Stock', onRemove: () => updateFilters({ inStock: undefined }) });
    return chips;
  }, [filters, updateFilters]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page heading row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            {filters.search ? `Results for "${filters.search}"` : 'Products'}
          </h1>
          <p aria-live="polite" className="text-sm text-stone-500 mt-0.5">
            {isLoading ? 'Loading…' : `${totalCount.toLocaleString()} products`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile filter button */}
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(true)}
            aria-label={`Open filters${activeChips.length > 0 ? `, ${activeChips.length} active` : ''}`}
            className={[
              'lg:hidden flex items-center gap-2 px-3 py-2',
              'border border-stone-200 rounded-lg text-sm font-medium',
              'text-stone-700 hover:bg-stone-50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]',
              'transition-colors',
            ].join(' ')}
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M7 12h10M11 18h2" />
            </svg>
            Filters
            {activeChips.length > 0 && (
              <span className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-[hsl(var(--primary))] text-white text-[10px] font-bold">
                {activeChips.length}
              </span>
            )}
          </button>

          {/* Sort dropdown — always visible */}
          <SortDropdown
            value={filters.sort ?? 'popularity_desc'}
            onChange={(sort) => updateFilters({ sort: sort as any })}
          />
        </div>
      </div>

      {/* Search input */}
      <div className="relative mb-5">
        <label htmlFor="product-search" className="sr-only">Search products</label>
        <svg
          aria-hidden="true"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          id="product-search"
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name, strain, effect…"
          autoComplete="off"
          className={[
            'w-full pl-9 pr-4 py-2.5 text-sm',
            'bg-white border border-stone-200 rounded-xl',
            'placeholder:text-stone-400 text-stone-900',
            'focus:outline-none focus:border-[hsl(var(--primary)/0.4)]',
            'focus:ring-1 focus:ring-[hsl(var(--primary)/0.3)]',
            'transition-all',
          ].join(' ')}
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => { setSearchInput(''); updateFilters({ search: undefined }); }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus-visible:outline-none"
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Active filter chips */}
      <FilterChips chips={activeChips} onClearAll={clearAllFilters} />

      {/* Main content: sidebar + grid */}
      <div className="flex gap-8">
        {/* Desktop filter sidebar — sticky */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24">
            <FilterSidebar filters={filters} onChange={updateFilters} />
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          <ProductGrid
            products={products}
            isLoading={isLoading}
            isError={isError}
            totalCount={totalCount}
            onRetry={refetch}
            onClearFilters={clearAllFilters}
          />

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-10">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(page) => {
                  updateFilters({ page });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <MobileFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onChange={(patch) => { updateFilters(patch); }}
        activeFilterCount={activeChips.length}
      />
    </div>
  );
}
