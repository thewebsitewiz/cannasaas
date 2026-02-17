import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type {
  AnalyticsDateRange,
  AnalyticsOverview,
  ProductAnalytics,
} from '../types';

// ── Query Keys ──────────────────────────────────────────────────────────────
export const analyticsKeys = {
  all: ['analytics'] as const,
  overview: (dispensaryId: string, range: AnalyticsDateRange) =>
    [...analyticsKeys.all, 'overview', dispensaryId, range] as const,
  products: (dispensaryId: string, range: AnalyticsDateRange) =>
    [...analyticsKeys.all, 'products', dispensaryId, range] as const,
  customers: (dispensaryId: string, range: AnalyticsDateRange) =>
    [...analyticsKeys.all, 'customers', dispensaryId, range] as const,
};

// ── Queries ─────────────────────────────────────────────────────────────────

/** Dashboard overview — revenue, orders, customers, top products */
export function useAnalyticsOverview(
  dispensaryId: string,
  range: AnalyticsDateRange,
) {
  return useQuery({
    queryKey: analyticsKeys.overview(dispensaryId, range),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: AnalyticsOverview }>(
        endpoints.analytics.overview(dispensaryId),
        { params: range },
      );
      return data.data;
    },
    enabled: !!dispensaryId && !!range.startDate && !!range.endDate,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // Analytics don't change second-to-second
  });
}

/** Per-product analytics — views, conversion, revenue */
export function useAnalyticsProducts(
  dispensaryId: string,
  range: AnalyticsDateRange & { sort?: string; limit?: number },
) {
  return useQuery({
    queryKey: analyticsKeys.products(dispensaryId, range),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: ProductAnalytics[] }>(
        endpoints.analytics.products(dispensaryId),
        { params: range },
      );
      return data.data;
    },
    enabled: !!dispensaryId,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}

/** Customer analytics — retention, segments */
export function useAnalyticsCustomers(
  dispensaryId: string,
  range: AnalyticsDateRange,
) {
  return useQuery({
    queryKey: analyticsKeys.customers(dispensaryId, range),
    queryFn: async () => {
      const { data } = await apiClient.get(
        endpoints.analytics.customers(dispensaryId),
        { params: range },
      );
      return data;
    },
    enabled: !!dispensaryId,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}
