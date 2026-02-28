import {
  UseMutationOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient, cartKeys, endpoints } from '../../api-client'; // Update the import path as needed

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  price: number;
  quantity: number;
  weight?: number;
  weightUnit?: string;
  imageUrl?: string;
  maxQuantity?: number;
}

interface CartState {
  items: CartItem[];
  promoCode: string | null;
  promoDiscount: number;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  applyPromo: (code: string, discount: number) => void;
  removePromo: () => void;
  clearCart: () => void;
}

// -------------------------------------------------------
// Store
// -------------------------------------------------------

export const useCartStore = create(
  persist<CartState>(
    (set) => ({
      items: [],
      promoCode: null,
      promoDiscount: 0,

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) =>
              i.productId === item.productId && i.variantId === item.variantId,
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId && i.variantId === item.variantId
                  ? {
                      ...i,
                      quantity: i.maxQuantity
                        ? Math.min(i.quantity + item.quantity, i.maxQuantity)
                        : i.quantity + item.quantity,
                    }
                  : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                ...item,
                id: `${item.productId}-${item.variantId}-${Date.now()}`,
              },
            ],
          };
        }),

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) =>
                  i.id === id
                    ? {
                        ...i,
                        quantity: i.maxQuantity
                          ? Math.min(quantity, i.maxQuantity)
                          : quantity,
                      }
                    : i,
                ),
        })),

      applyPromo: (code, discount) =>
        set({ promoCode: code, promoDiscount: discount }),

      removePromo: () => set({ promoCode: null, promoDiscount: 0 }),

      clearCart: () => set({ items: [], promoCode: null, promoDiscount: 0 }),
    }),
    { name: 'cannasaas-cart' },
  ),
);

// ----------------------------------------------------------
// Selectors
// Used as: const count = useCartStore(selectCartItemCount)
// ----------------------------------------------------------

export const selectCartItemCount = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);

export const selectIsCartEmpty = (state: CartState) => state.items.length === 0;

export const selectSubtotal = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export const selectPromoDiscount = (state: CartState) => state.promoDiscount;

export const selectPromoCode = (state: CartState) => state.promoCode;

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
    enabled: true,
    staleTime: 60 * 1000,
  });
}
