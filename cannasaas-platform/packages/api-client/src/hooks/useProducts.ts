import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  UseMutationOptions,
  keepPreviousData,
} from '@tanstack/react-query';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type {
  Product,
  ProductFilters,
  PaginatedResponse,
} from '../types';

// ── Query Keys ──────────────────────────────────────────────────────────────
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters) =>
    [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  search: (q: string) => [...productKeys.all, 'search', q] as const,
  byDispensary: (dispensaryId: string, filters?: ProductFilters) =>
    [...productKeys.all, 'dispensary', dispensaryId, filters] as const,
};

// ── Queries ─────────────────────────────────────────────────────────────────

/** Paginated product list with filters */
export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Product>>(
        endpoints.products.list,
        { params: filters },
      );
      return data;
    },
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });
}

/** Single product by ID or slug */
export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Product>(
        endpoints.products.detail(id),
      );
      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/** Search products (GET /products/search?q=...) */
export function useProductSearch(query: string) {
  return useQuery({
    queryKey: productKeys.search(query),
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Product>>(
        endpoints.products.search,
        { params: { q: query } },
      );
      return data;
    },
    enabled: query.length >= 2,
    staleTime: 30 * 1000,
  });
}

/** Products for a specific dispensary */
export function useDispensaryProducts(
  dispensaryId: string,
  filters: ProductFilters = {},
) {
  return useQuery({
    queryKey: productKeys.byDispensary(dispensaryId, filters),
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Product>>(
        endpoints.products.byDispensary(dispensaryId),
        { params: filters },
      );
      return data;
    },
    enabled: !!dispensaryId,
    placeholderData: keepPreviousData,
  });
}

/** Infinite-scroll product list */
export function useInfiniteProducts(filters: Omit<ProductFilters, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: [...productKeys.lists(), 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get<PaginatedResponse<Product>>(
        endpoints.products.list,
        { params: { ...filters, page: pageParam } },
      );
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
  });
}

// ── Mutations ───────────────────────────────────────────────────────────────

export function useCreateProduct(
  options?: UseMutationOptions<Product, Error, Partial<Product>>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<Product>(
        endpoints.products.create,
        payload,
      );
      return data;
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useUpdateProduct(
  options?: UseMutationOptions<
    Product,
    Error,
    { id: string; payload: Partial<Product> }
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await apiClient.patch<Product>(
        endpoints.products.update(id),
        payload,
      );
      return data;
    },
    onSuccess: (product, ...rest) => {
      queryClient.setQueryData(productKeys.detail(product.id), product);
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      options?.onSuccess?.(product, ...rest);
    },
    ...options,
  });
}

export function useDeleteProduct(
  options?: UseMutationOptions<void, Error, string>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(endpoints.products.delete(id));
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}
