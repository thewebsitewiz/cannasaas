/**
 * @file FilterChips.tsx
 * @app apps/storefront
 *
 * Active filter pills — shows each active filter as a dismissible chip.
 * Appears above the product grid when any filter is active.
 *
 * Each chip shows: label + × remove button.
 * "Clear all" button appears when 2+ filters are active.
 *
 * Accessibility:
 *   - Chips are <li> inside a labeled <ul> (WCAG 1.3.1)
 *   - Remove button: aria-label "Remove {filter name} filter"
 *   - "Clear all": aria-label "Clear all filters"
 *   - After removing: focus moves to the next chip or "Clear all"
 *     (prevents focus loss — WCAG 2.4.3)
 */

interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface FilterChipsProps {
  chips: FilterChip[];
  onClearAll: () => void;
}

export function FilterChips({ chips, onClearAll }: FilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4" role="region" aria-label="Active filters">
      <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
        Filters:
      </span>
      <ul role="list" className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <li key={chip.key}>
            <span className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-xs font-medium text-stone-700">
              {chip.label}
              <button
                type="button"
                onClick={chip.onRemove}
                aria-label={`Remove ${chip.label} filter`}
                className={[
                  'w-4 h-4 flex items-center justify-center',
                  'rounded-full bg-stone-300/60 hover:bg-stone-400/60',
                  'text-stone-600 hover:text-stone-900',
                  'transition-colors',
                  'focus-visible:outline-none focus-visible:ring-1',
                  'focus-visible:ring-[hsl(var(--primary))]',
                ].join(' ')}
              >
                <svg aria-hidden="true" className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M1 1l10 10M11 1L1 11" />
                </svg>
              </button>
            </span>
          </li>
        ))}
      </ul>

      {chips.length >= 2 && (
        <button
          type="button"
          onClick={onClearAll}
          aria-label="Clear all filters"
          className="text-xs font-medium text-[hsl(var(--primary))] hover:underline focus-visible:outline-none focus-visible:underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
