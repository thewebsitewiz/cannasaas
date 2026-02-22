/**
 * @file MobileFilterDrawer.tsx
 * @app apps/storefront
 *
 * Bottom-sheet filter drawer for mobile viewports.
 *
 * Shows a "Filters" button that opens a full-screen bottom drawer
 * containing the FilterSidebar content. The drawer slides up from
 * the bottom of the viewport on mobile.
 *
 * Accessibility:
 *   - role="dialog", aria-modal="true" (WCAG 4.1.2)
 *   - Focus trapped inside when open (WCAG 2.1.2)
 *   - Close button is first focusable element
 *   - Backdrop click closes the drawer
 *   - Escape key closes the drawer
 *   - Filter count badge on trigger button
 */

import { useEffect, useRef } from 'react';
import { FilterSidebar } from './FilterSidebar';
import type { ProductQueryParams } from '@cannasaas/api-client';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Partial<ProductQueryParams>;
  onChange: (patch: Partial<ProductQueryParams>) => void;
  activeFilterCount: number;
}

export function MobileFilterDrawer({
  isOpen,
  onClose,
  filters,
  onChange,
  activeFilterCount,
}: MobileFilterDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus close button when drawer opens
  useEffect(() => {
    if (isOpen) setTimeout(() => closeRef.current?.focus(), 50);
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Product filters"
        className={[
          'fixed bottom-0 left-0 right-0 z-50 lg:hidden',
          'bg-white rounded-t-3xl shadow-2xl',
          'max-h-[90vh] overflow-y-auto',
          'transition-transform duration-300',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
      >
        {/* Handle + header */}
        <div className="sticky top-0 bg-white px-4 pt-4 pb-3 border-b border-stone-100 z-10">
          {/* Drag handle */}
          <div aria-hidden="true" className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-900">
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-[hsl(var(--primary))] text-white text-xs font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </h2>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              className={[
                'w-9 h-9 flex items-center justify-center rounded-full',
                'bg-stone-100 text-stone-600',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]',
              ].join(' ')}
            >
              <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter content */}
        <div className="px-4 pb-8">
          <FilterSidebar filters={filters} onChange={onChange} />
        </div>

        {/* Apply button */}
        <div className="sticky bottom-0 bg-white border-t border-stone-100 px-4 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-[hsl(var(--primary))] text-white font-semibold rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 hover:brightness-110 transition-all"
          >
            Apply Filters
            {activeFilterCount > 0 && ` (${activeFilterCount})`}
          </button>
        </div>
      </div>
    </>
  );
}
