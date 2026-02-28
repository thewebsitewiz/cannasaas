import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { apiClient } from '../client';
import type { Product, PaginatedResponse } from '@cannasaas/types';

// ── Query Key Factory ─────────────────────────────────────────────────────────
// Centralized key management prevents stale data and makes
// invalidation surgical and predictable.
export const productKeys = {
  all:      ['products'] as const,
  lists:    () => [...productKeys.all,    'list']          as const,
  list:     (filters: ProductFilters) =>
              [...productKeys.lists(),    filters]         as const,
  details:  () => [...productKeys.all,    'detail']        as const,
  detail:   (id: string) =>
              [...productKeys.details(),  id]              as const,
  featured: () => [...productKeys.all,    'featured']      as const,
  lowStock: () => [...productKeys.all,    'low-stock']     as const,
};

export interface ProductFilters {
  category?:    string;
  strainType?:  string;
  minThc?:      number;
  maxThc?:      number;
  minPrice?:    number;
  maxPrice?:    number;
  sort?:        'price_asc' | 'price_desc' | 'thc_desc' | 'newest';
  page?:        number;
  limit?:       number;
  search?:      string;
  dispensaryId?: string;
}

// ── List Products ─────────────────────────────────────────────────────────────
export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Product>>(
        '/products',
        { params: filters },
      );
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes — aligns with Redis TTL
    placeholderData: (previousData) => previousData, // Keeps previous results while refetching
  });
}

// ── Infinite Scroll Variant ───────────────────────────────────────────────────
export function useInfiniteProducts(filters: Omit<ProductFilters, 'page'>) {
  return useInfiniteQuery({
    queryKey: [...productKeys.lists(), 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get<PaginatedResponse<Product>>(
        '/products',
        { params: { ...filters, page: pageParam, limit: 20 } },
      );
      return data;
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
  });
}

// ── Single Product ────────────────────────────────────────────────────────────
export function useProduct(
  id: string,
  options?: Partial<UseQueryOptions<Product>>,
) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Product }>(
        `/products/${id}`,
      );
      return data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

// ── Create Product Mutation ───────────────────────────────────────────────────
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<Product>) => {
      const { data } = await apiClient.post<{ data: Product }>(
        '/products',
        payload,
      );
      return data.data;
    },
    onSuccess: (newProduct) => {
      // Invalidate all product lists so they refetch with the new item
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      // Pre-populate the detail cache to avoid a network request on navigation
      queryClient.setQueryData(productKeys.detail(newProduct.id), newProduct);
    },
  });
}

// ── Update Product Mutation with Optimistic Update ────────────────────────────
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<Product> & { id: string }) => {
      const { data } = await apiClient.put<{ data: Product }>(
        `/products/${id}`,
        payload,
      );
      return data.data;
    },
    onMutate: async ({ id, ...updates }) => {
      // Cancel any outgoing refetches for this product
      await queryClient.cancelQueries({ queryKey: productKeys.detail(id) });

      // Snapshot the current value for rollback
      const previous = queryClient.getQueryData<Product>(
        productKeys.detail(id),
      );

      // Optimistically update the cache
      queryClient.setQueryData<Product>(productKeys.detail(id), (old) =>
        old ? { ...old, ...updates } : old,
      );

      return { previous, id };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previous && context.id) {
        queryClient.setQueryData(
          productKeys.detail(context.id),
          context.previous,
        );
      }
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      });
    },
  });
}

// ── Low Stock Alert ───────────────────────────────────────────────────────────
export function useLowStockProducts() {
  return useQuery({
    queryKey: productKeys.lowStock(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Product[] }>(
        '/products/low-stock',
      );
      return data.data;
    },
    staleTime: 1000 * 60 * 2,      // 2 minutes — stock changes frequently
    refetchInterval: 1000 * 60 * 5, // Poll every 5 minutes
  });
}
