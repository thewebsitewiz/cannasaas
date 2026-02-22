/**
 * @file Pagination.tsx
 * @app apps/storefront
 *
 * Smart pagination component with ellipsis for large page counts.
 *
 * Behaviour:
 *   Always shows: First page, Last page, Current page, Current ± 1
 *   Ellipsis (...) fills gaps when pages are non-contiguous
 *
 *   Example (page 7 of 20):
 *   [1] [...] [6] [7] [8] [...] [20]
 *
 * Updates URL search params (via setPage callback from useOrderFilters
 * or similar) — enables browser back/forward navigation.
 *
 * Accessibility:
 *   - <nav> with aria-label="Pagination" (WCAG 1.3.1)
 *   - Current page: aria-current="page"
 *   - Previous/Next: descriptive aria-label
 *   - Ellipsis: aria-hidden="true" (not interactive)
 *   - Disabled buttons: aria-disabled="true" (WCAG 4.1.2)
 */

import { memo } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Generates the page numbers to display, inserting -1 as ellipsis markers.
 * Example: [1, -1, 5, 6, 7, -1, 12]
 */
function buildPageRange(current: number, total: number): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: number[] = [1];
  const rangeStart = Math.max(2, current - 1);
  const rangeEnd   = Math.min(total - 1, current + 1);

  if (rangeStart > 2) pages.push(-1);  // left ellipsis
  for (let p = rangeStart; p <= rangeEnd; p++) pages.push(p);
  if (rangeEnd < total - 1) pages.push(-1); // right ellipsis
  pages.push(total);

  return pages;
}

export const Pagination = memo(function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPageRange(currentPage, totalPages);
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  const btnBase = [
    'inline-flex items-center justify-center',
    'min-w-[2.25rem] h-9 px-2 rounded-lg text-sm font-medium',
    'transition-colors',
    'focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-[hsl(var(--primary))]',
  ].join(' ');

  return (
    <nav aria-label="Pagination navigation" className="flex items-center justify-center gap-1">
      {/* Previous */}
      <button
        type="button"
        onClick={() => canPrev && onPageChange(currentPage - 1)}
        aria-label="Go to previous page"
        aria-disabled={!canPrev}
        disabled={!canPrev}
        className={[
          btnBase,
          canPrev
            ? 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            : 'text-stone-300 cursor-not-allowed',
        ].join(' ')}
      >
        <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Page numbers */}
      {pages.map((page, i) => {
        if (page === -1) {
          return (
            <span
              key={`ellipsis-${i}`}
              aria-hidden="true"
              className="w-9 h-9 flex items-center justify-center text-stone-400 text-sm select-none"
            >
              …
            </span>
          );
        }

        const isCurrent = page === currentPage;
        return (
          <button
            key={page}
            type="button"
            onClick={() => !isCurrent && onPageChange(page)}
            aria-label={`Page ${page}`}
            aria-current={isCurrent ? 'page' : undefined}
            className={[
              btnBase,
              isCurrent
                ? 'bg-[hsl(var(--primary))] text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
            ].join(' ')}
          >
            {page}
          </button>
        );
      })}

      {/* Next */}
      <button
        type="button"
        onClick={() => canNext && onPageChange(currentPage + 1)}
        aria-label="Go to next page"
        aria-disabled={!canNext}
        disabled={!canNext}
        className={[
          btnBase,
          canNext
            ? 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            : 'text-stone-300 cursor-not-allowed',
        ].join(' ')}
      >
        <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
});

Pagination.displayName = 'Pagination';
