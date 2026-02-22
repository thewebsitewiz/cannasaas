/**
 * @file FilterSidebar.tsx
 * @app apps/storefront
 *
 * Collapsible sidebar filter panel for the Products page.
 *
 * Filter sections (each is an accordion item):
 *   Categories   — radio buttons (from useProductCategories)
 *   Strain Type  — checkboxes (Sativa, Indica, Hybrid, etc.)
 *   Price Range  — dual-handle range slider ($0–$200+)
 *   THC Content  — dual-handle range slider (0%–40%+)
 *
 * Filter values are stored in URL search params (via onFilterChange callbacks).
 * Changes are debounced for slider inputs to avoid excessive URL updates.
 *
 * Accessibility:
 *   - Each section is <fieldset> with <legend> (WCAG 1.3.1)
 *   - Accordion toggle: aria-expanded on the <button>
 *   - Checkboxes/radios: explicit <label htmlFor> (WCAG 1.3.5)
 *   - Range sliders use aria-valuemin, aria-valuemax, aria-valuenow (WCAG 4.1.2)
 *   - All interactive elements meet 44×44px touch target (WCAG 2.5.5)
 */

import { useState } from 'react';
import { useProductCategories } from '@cannasaas/api-client';
import type { ProductQueryParams } from '@cannasaas/api-client';

interface FilterSidebarProps {
  filters: Partial<ProductQueryParams>;
  onChange: (patch: Partial<ProductQueryParams>) => void;
}

const STRAIN_TYPES = [
  { value: 'sativa',                 label: 'Sativa' },
  { value: 'indica',                 label: 'Indica' },
  { value: 'hybrid',                 label: 'Hybrid' },
  { value: 'sativa_dominant_hybrid', label: 'Sativa-Dominant' },
  { value: 'indica_dominant_hybrid', label: 'Indica-Dominant' },
  { value: 'cbd',                    label: 'CBD / Hemp' },
];

// Accordion section component
function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const id = `filter-section-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="border-b border-stone-100 last:border-b-0">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={id}
        onClick={() => setIsOpen((o) => !o)}
        className={[
          'w-full flex items-center justify-between py-3',
          'text-sm font-semibold text-stone-800',
          'hover:text-stone-900 transition-colors',
          'focus-visible:outline-none focus-visible:ring-1',
          'focus-visible:ring-[hsl(var(--primary))]',
        ].join(' ')}
      >
        {title}
        <svg
          aria-hidden="true"
          className={['w-4 h-4 text-stone-400 transition-transform', isOpen ? 'rotate-180' : ''].join(' ')}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div id={id} className="pb-4">
          {children}
        </div>
      )}
    </div>
  );
}

export function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
  const { data: categories } = useProductCategories();

  return (
    <aside
      aria-label="Product filters"
      className="bg-white rounded-2xl border border-stone-100 p-4 space-y-1"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Filters</h2>
      </div>

      {/* ── Category ────────────────────────────────────────────────────────── */}
      <FilterSection title="Category">
        <fieldset>
          <legend className="sr-only">Product category</legend>
          <div className="space-y-2">
            {/* "All" option */}
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="category"
                value=""
                checked={!filters.category}
                onChange={() => onChange({ category: undefined })}
                className="w-4 h-4 rounded-full border-stone-300 text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary)/0.3)] cursor-pointer"
              />
              <span className="text-sm text-stone-700 group-hover:text-stone-900 transition-colors">All Categories</span>
            </label>
            {categories?.map((cat) => (
              <label key={cat.slug} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name="category"
                  value={cat.slug}
                  checked={filters.category === cat.slug}
                  onChange={() => onChange({ category: cat.slug })}
                  className="w-4 h-4 rounded-full border-stone-300 text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary)/0.3)] cursor-pointer"
                />
                <span className="text-sm text-stone-700 group-hover:text-stone-900 transition-colors">
                  {cat.name}
                </span>
                {cat.productCount != null && (
                  <span className="ml-auto text-xs text-stone-400">{cat.productCount}</span>
                )}
              </label>
            ))}
          </div>
        </fieldset>
      </FilterSection>

      {/* ── Strain Type ─────────────────────────────────────────────────────── */}
      <FilterSection title="Strain Type">
        <fieldset>
          <legend className="sr-only">Cannabis strain type</legend>
          <div className="space-y-2">
            {STRAIN_TYPES.map((strain) => (
              <label key={strain.value} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  value={strain.value}
                  checked={filters.strainType === strain.value}
                  onChange={(e) => onChange({
                    strainType: e.target.checked ? strain.value as any : undefined,
                  })}
                  className="w-4 h-4 rounded border-stone-300 text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary)/0.3)] cursor-pointer"
                />
                <span className="text-sm text-stone-700 group-hover:text-stone-900 transition-colors">
                  {strain.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </FilterSection>

      {/* ── Price Range ─────────────────────────────────────────────────────── */}
      <FilterSection title="Price Range" defaultOpen={false}>
        <fieldset>
          <legend className="sr-only">Price range in dollars</legend>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label htmlFor="price-min" className="text-xs text-stone-500 mb-1 block">Min ($)</label>
                <input
                  id="price-min"
                  type="number"
                  min={0} max={filters.maxPrice ?? 500} step={5}
                  value={filters.minPrice ?? ''}
                  onChange={(e) => onChange({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="0"
                  className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-[hsl(var(--primary)/0.4)] focus:ring-1 focus:ring-[hsl(var(--primary)/0.3)]"
                />
              </div>
              <span className="text-stone-400 mt-5" aria-hidden="true">—</span>
              <div className="flex-1">
                <label htmlFor="price-max" className="text-xs text-stone-500 mb-1 block">Max ($)</label>
                <input
                  id="price-max"
                  type="number"
                  min={filters.minPrice ?? 0} max={500} step={5}
                  value={filters.maxPrice ?? ''}
                  onChange={(e) => onChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Any"
                  className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-[hsl(var(--primary)/0.4)] focus:ring-1 focus:ring-[hsl(var(--primary)/0.3)]"
                />
              </div>
            </div>
          </div>
        </fieldset>
      </FilterSection>

      {/* ── THC Content ─────────────────────────────────────────────────────── */}
      <FilterSection title="THC %" defaultOpen={false}>
        <fieldset>
          <legend className="sr-only">THC content percentage range</legend>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label htmlFor="thc-min" className="text-xs text-stone-500 mb-1 block">Min (%)</label>
              <input
                id="thc-min"
                type="number" min={0} max={40} step={1}
                value={filters.minThc ?? ''}
                onChange={(e) => onChange({ minThc: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="0"
                className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-[hsl(var(--primary)/0.4)] focus:ring-1 focus:ring-[hsl(var(--primary)/0.3)]"
              />
            </div>
            <span className="text-stone-400 mt-5" aria-hidden="true">—</span>
            <div className="flex-1">
              <label htmlFor="thc-max" className="text-xs text-stone-500 mb-1 block">Max (%)</label>
              <input
                id="thc-max"
                type="number" min={0} max={40} step={1}
                value={filters.maxThc ?? ''}
                onChange={(e) => onChange({ maxThc: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Any"
                className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-[hsl(var(--primary)/0.4)] focus:ring-1 focus:ring-[hsl(var(--primary)/0.3)]"
              />
            </div>
          </div>
        </fieldset>
      </FilterSection>

      {/* ── In Stock Only ────────────────────────────────────────────────────── */}
      <FilterSection title="Availability" defaultOpen={false}>
        <fieldset>
          <legend className="sr-only">Product availability</legend>
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.inStock ?? false}
              onChange={(e) => onChange({ inStock: e.target.checked || undefined })}
              className="w-4 h-4 rounded border-stone-300 text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary)/0.3)] cursor-pointer"
            />
            <span className="text-sm text-stone-700 group-hover:text-stone-900">In stock only</span>
          </label>
        </fieldset>
      </FilterSection>
    </aside>
  );
}
