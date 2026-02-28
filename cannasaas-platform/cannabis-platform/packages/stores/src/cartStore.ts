import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { CartItem, Product, ProductVariant } from '@cannasaas/types';

interface CartState {
  items: CartItem[];
  promoCode: string | null;
  promoDiscount: number;
  isSyncing: boolean;

  // Derived values (computed, not stored)
  itemCount: () => number;
  subtotal: () => number;

  // Actions
  addItem: (product: Product, variant: ProductVariant, qty: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, qty: number) => void;
  applyPromo: (code: string, discount: number) => void;
  removePromo: () => void;
  clearCart: () => void;
  setSyncing: (syncing: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    immer((set, get) => ({
      items: [],
      promoCode: null,
      promoDiscount: 0,
      isSyncing: false,

      itemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: () =>
        get().items.reduce(
          (sum, item) => sum + item.variant.price * item.quantity,
          0,
        ),

      addItem: (product, variant, qty) => {
        set((state) => {
          const existing = state.items.find((i) => i.variantId === variant.id);
          if (existing) {
            existing.quantity += qty;
          } else {
            state.items.push({
              id: `local-${Date.now()}`,
              productId: product.id,
              variantId: variant.id,
              productName: product.name,
              variantName: variant.name,
              quantity: qty,
              unitPrice: variant.price,
              totalPrice: variant.price * qty,
              weight: variant.weight ?? 0,
              weightUnit: variant.weightUnit ?? 'g',
              product,
              variant,
            });
          }
        });
      },

      removeItem: (itemId) => {
        set((state) => {
          state.items = state.items.filter((i) => i.id !== itemId);
        });
      },

      updateQuantity: (itemId, qty) => {
        set((state) => {
          const item = state.items.find((i) => i.id === itemId);
          if (item) {
            if (qty <= 0) {
              state.items = state.items.filter((i) => i.id !== itemId);
            } else {
              item.quantity = qty;
              item.totalPrice = item.unitPrice * qty;
            }
          }
        });
      },

      applyPromo: (code, discount) => {
        set((state) => {
          state.promoCode = code;
          state.promoDiscount = discount;
        });
      },

      removePromo: () => {
        set((state) => {
          state.promoCode = null;
          state.promoDiscount = 0;
        });
      },

      clearCart: () => {
        set((state) => {
          state.items = [];
          state.promoCode = null;
          state.promoDiscount = 0;
        });
      },

      setSyncing: (syncing) => {
        set((state) => {
          state.isSyncing = syncing;
        });
      },
    })),
    {
      name: 'cannasaas-cart',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
