import {
  useQuery,
  useMutation,
  useQueryClient,
  UseMutationOptions,
  keepPreviousData,
} from '@tanstack/react-query';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import { cartKeys } from './useCart';
import type {
  Order,
  OrderFilters,
  CreateOrderRequest,
  PaginatedResponse,
} from '../types';

// ── Query Keys ──────────────────────────────────────────────────────────────
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: OrderFilters) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

// ── Queries ─────────────────────────────────────────────────────────────────

/** Paginated order list with filters */
export function useOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Order>>(
        endpoints.orders.list,
        { params: filters },
      );
      return data;
    },
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
}

/** Single order by ID */
export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Order>(
        endpoints.orders.detail(id),
      );
      return data;
    },
    enabled: !!id,
    // Orders can update quickly (status changes), shorter stale time
    staleTime: 15 * 1000,
  });
}

// ── Mutations ───────────────────────────────────────────────────────────────

/** Create an order (checkout — converts cart to order) */
export function useCreateOrder(
  options?: UseMutationOptions<Order, Error, CreateOrderRequest>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<Order>(
        endpoints.orders.create,
        payload,
      );
      return data;
    },
    onSuccess: (order, ...rest) => {
      // Clear cart after successful checkout
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      // Pre-populate the order detail cache
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      options?.onSuccess?.(order, ...rest);
    },
    ...options,
  });
}

/** Update order status (admin/manager) */
export function useUpdateOrderStatus(
  options?: UseMutationOptions<
    Order,
    Error,
    { id: string; status: string }
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await apiClient.patch<Order>(
        endpoints.orders.updateStatus(id),
        { status },
      );
      return data;
    },
    onSuccess: (order, ...rest) => {
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      options?.onSuccess?.(order, ...rest);
    },
    ...options,
  });
}

/** Cancel an order */
export function useCancelOrder(
  options?: UseMutationOptions<Order, Error, string>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await apiClient.post<Order>(
        endpoints.orders.cancel(id),
      );
      return data;
    },
    onSuccess: (order, ...rest) => {
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      options?.onSuccess?.(order, ...rest);
    },
    ...options,
  });
}

/** Refund an order */
export function useRefundOrder(
  options?: UseMutationOptions<Order, Error, string>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await apiClient.post<Order>(
        endpoints.orders.refund(id),
      );
      return data;
    },
    onSuccess: (order, ...rest) => {
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      options?.onSuccess?.(order, ...rest);
    },
    ...options,
  });
}
