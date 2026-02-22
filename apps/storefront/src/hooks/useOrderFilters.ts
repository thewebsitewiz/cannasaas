/**
 * @file useOrderFilters.ts
 * @description Custom hook for order list filtering and sorting.
 *
 * Encapsulates filter state in URL search params so that:
 *   - Filters survive page refresh
 *   - Users can share filtered URLs
 *   - Browser back/forward navigates filter history
 *
 * @pattern URL-driven state — uses React Router's useSearchParams
 */

import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { OrderStatus } from '@cannasaas/types';

export type OrderSortKey = 'createdAt_desc' | 'createdAt_asc' | 'total_desc' | 'total_asc';

export interface OrderFilters {
  status: OrderStatus | 'all';
  sort: OrderSortKey;
  page: number;
  search: string;
}

export interface OrderFilterActions {
  setStatus: (status: OrderFilters['status']) => void;
  setSort: (sort: OrderSortKey) => void;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  resetFilters: () => void;
}

const DEFAULTS: OrderFilters = {
  status: 'all',
  sort: 'createdAt_desc',
  page: 1,
  search: '',
};

/**
 * Returns the current filter values (from URL) and stable setter functions.
 *
 * The setters update URL params, which causes the component to re-render
 * with new filter values — no local state needed.
 */
export function useOrderFilters(): [OrderFilters, OrderFilterActions] {
  const [params, setParams] = useSearchParams();

  const filters: OrderFilters = {
    status: (params.get('status') ?? DEFAULTS.status) as OrderFilters['status'],
    sort: (params.get('sort') ?? DEFAULTS.sort) as OrderSortKey,
    page: Number(params.get('page') ?? DEFAULTS.page),
    search: params.get('search') ?? DEFAULTS.search,
  };

  /**
   * Helper — merges a partial update into existing params.
   * Resets to page 1 whenever a filter changes (not when navigating pages).
   */
  const update = useCallback(
    (updates: Partial<OrderFilters>, resetPage = true) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, value]) => {
          if (value === '' || value === DEFAULTS[key as keyof OrderFilters]) {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
        });
        if (resetPage && !('page' in updates)) {
          next.delete('page');
        }
        return next;
      });
    },
    [setParams],
  );

  const actions: OrderFilterActions = {
    setStatus: useCallback((status) => update({ status }), [update]),
    setSort: useCallback((sort) => update({ sort }), [update]),
    setPage: useCallback((page) => update({ page }, false), [update]),
    setSearch: useCallback((search) => update({ search }), [update]),
    resetFilters: useCallback(
      () => setParams(new URLSearchParams()),
      [setParams],
    ),
  };

  return [filters, actions];
}
