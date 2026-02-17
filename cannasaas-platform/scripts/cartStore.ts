import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

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
  maxQuantity?: number; // inventory limit
}

interface CartState {
  items: CartItem[];
  promoCode: string | null;
  promoDiscount: number;

  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  applyPromo: (code: string, discount: number) => void;
  removePromo: () => void;
  clearCart: () => void;

  // Computed
  subtotal: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    immer((set, get) => ({
      items: [],
      promoCode: null,
      promoDiscount: 0,

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId && i.variantId === item.variantId,
          );
          if (existing) {
            existing.quantity += item.quantity;
            if (existing.maxQuantity) {
              existing.quantity = Math.min(existing.quantity, existing.maxQuantity);
            }
          } else {
            state.items.push({
              ...item,
              id: `${item.productId}-${item.variantId}-${Date.now()}`,
            });
          }
        }),

      removeItem: (id) =>
        set((state) => {
          state.items = state.items.filter((i) => i.id !== id);
        }),

      updateQuantity: (id, quantity) =>
        set((state) => {
          const item = state.items.find((i) => i.id === id);
          if (item) {
            if (quantity <= 0) {
              state.items = state.items.filter((i) => i.id !== id);
            } else {
              item.quantity = item.maxQuantity
                ? Math.min(quantity, item.maxQuantity)
                : quantity;
            }
          }
        }),

      applyPromo: (code, discount) =>
        set((state) => {
          state.promoCode = code;
          state.promoDiscount = discount;
        }),

      removePromo: () =>
        set((state) => {
          state.promoCode = null;
          state.promoDiscount = 0;
        }),

      clearCart: () =>
        set((state) => {
          state.items = [];
          state.promoCode = null;
          state.promoDiscount = 0;
        }),

      subtotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    })),
    {
      name: 'cannasaas-cart',
    },
  ),
);
