/**
 * @file SortDropdown.tsx
 * @app apps/storefront
 *
 * Sort order select dropdown for the Products page.
 *
 * Options:
 *   popularity_desc  — Most Popular
 *   newest           — Newest First
 *   price_asc        — Price: Low to High
 *   price_desc       — Price: High to Low
 *   name_asc         — Name: A–Z
 *
 * Accessibility:
 *   - Native <select> element for maximum accessibility compatibility
 *   - Explicit <label> linked via htmlFor (WCAG 1.3.1, 1.3.5)
 *   - onChange triggers URL param update (useOrderFilters pattern)
 */

import { useId } from 'react';

type SortOption = 'popularity_desc' | 'newest' | 'price_asc' | 'price_desc' | 'name_asc';

interface SortDropdownProps {
  value: SortOption | string;
  onChange: (value: string) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'popularity_desc', label: 'Most Popular' },
  { value: 'newest',          label: 'Newest First' },
  { value: 'price_asc',       label: 'Price: Low to High' },
  { value: 'price_desc',      label: 'Price: High to Low' },
  { value: 'name_asc',        label: 'Name: A–Z' },
];

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const id = useId();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm font-medium text-stone-600 whitespace-nowrap">
        Sort by
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          'text-sm text-stone-800 font-medium',
          'bg-white border border-stone-200 rounded-lg',
          'px-3 py-1.5 pr-8',
          'appearance-none',
          'focus:outline-none focus:border-[hsl(var(--primary)/0.5)]',
          'focus:ring-1 focus:ring-[hsl(var(--primary)/0.3)]',
          'cursor-pointer',
          // Custom arrow via background-image
          `bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")]`,
          'bg-no-repeat bg-[right_0.5rem_center]',
        ].join(' ')}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
