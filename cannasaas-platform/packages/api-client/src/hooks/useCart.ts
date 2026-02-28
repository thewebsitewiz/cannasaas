import {
  useQuery,
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from '@tanstack/react-query';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type {
  Cart,
  CartItem,
  AddToCartRequest,
  UpdateCartItemRequest,
} from '../types';

// ── Query Keys ──────────────────────────────────────────────────────────────
export const cartKeys = {
  all: ['cart'] as const,
  detail: () => [...cartKeys.all, 'detail'] as const,
};

// ── Queries ─────────────────────────────────────────────────────────────────

/** Get the current user's cart */
export function useCart() {
  return useQuery({
    queryKey: cartKeys.detail(),
    queryFn: async () => {
      const { data } = await apiClient.get<Cart>(endpoints.cart.get);
      return data;
    },
    staleTime: 30 * 1000,
  });
}

// ── Mutations ───────────────────────────────────────────────────────────────

/** Add an item to the cart */
export function useAddToCart(
  options?: UseMutationOptions<CartItem, Error, AddToCartRequest>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<CartItem>(
        endpoints.cart.addItem,
        payload,
      );
      return data;
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

/** Update item quantity in the cart (optimistic) */
export function useUpdateCartItem(
  options?: UseMutationOptions<
    CartItem,
    Error,
    { itemId: string; payload: UpdateCartItemRequest }
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, payload }) => {
      const { data } = await apiClient.patch<CartItem>(
        endpoints.cart.updateItem(itemId),
        payload,
      );
      return data;
    },
    // Optimistic update — immediately adjust quantity in the cache
    onMutate: async ({ itemId, payload }) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.detail() });
      const previousCart = queryClient.getQueryData<Cart>(cartKeys.detail());

      if (previousCart) {
        queryClient.setQueryData<Cart>(cartKeys.detail(), {
          ...previousCart,
          items: previousCart.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  quantity: payload.quantity,
                  totalPrice: item.unitPrice * payload.quantity,
                }
              : item,
          ),
        });
      }

      return { previousCart };
    },
    onError: (_err, _vars, context) => {
      // Rollback on failure
      if (context?.previousCart) {
        queryClient.setQueryData(cartKeys.detail(), context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
    ...options,
  });
}

/** Remove an item from the cart */
export function useRemoveCartItem(
  options?: UseMutationOptions<void, Error, string>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId) => {
      await apiClient.delete(endpoints.cart.removeItem(itemId));
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.detail() });
      const previousCart = queryClient.getQueryData<Cart>(cartKeys.detail());

      if (previousCart) {
        queryClient.setQueryData<Cart>(cartKeys.detail(), {
          ...previousCart,
          items: previousCart.items.filter((item) => item.id !== itemId),
        });
      }

      return { previousCart };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(cartKeys.detail(), context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
    ...options,
  });
}

/** Apply a promo code */
export function useApplyPromo(
  options?: UseMutationOptions<Cart, Error, { code: string }>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<Cart>(
        endpoints.cart.applyPromo,
        payload,
      );
      return data;
    },
    onSuccess: (updatedCart, ...rest) => {
      queryClient.setQueryData(cartKeys.detail(), updatedCart);
      options?.onSuccess?.(updatedCart, ...rest);
    },
    ...options,
  });
}

/** Clear the entire cart */
export function useClearCart(
  options?: UseMutationOptions<void, Error, void>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(endpoints.cart.clear);
    },
    onSuccess: (...args) => {
      queryClient.setQueryData<Cart>(cartKeys.detail(), undefined);
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

/** Remove an applied promo code */
export function useRemovePromo(
  options?: UseMutationOptions<Cart, Error, void>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.delete<Cart>(endpoints.cart.removePromo);
      return data;
    },
    onSuccess: (updatedCart, ...rest) => {
      queryClient.setQueryData(cartKeys.detail(), updatedCart);
      options?.onSuccess?.(updatedCart, ...rest);
    },
    ...options,
  });
}

/** Check remaining purchase limits for the current customer */
export function usePurchaseLimit(customerId?: string) {
  return useQuery({
    queryKey: ['compliance', 'purchase-limit', customerId],
    queryFn: async () => {
      const { data } = await apiClient.get(endpoints.compliance.purchaseLimit, {
        params: customerId ? { customerId } : undefined,
      });
      return data;
    },
    staleTime: 60 * 1000,
  });
}
