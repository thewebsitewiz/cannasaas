import { create } from 'zustand';

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  variantName: string;
  price: number;
  quantity: number;
  strainType?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  subtotal: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (item) => set((state) => {
    const existing = state.items.find((i) => i.variantId === item.variantId);
    if (existing) return { items: state.items.map((i) => i.variantId === item.variantId ? { ...i, quantity: i.quantity + 1 } : i) };
    return { items: [...state.items, { ...item, quantity: 1 }] };
  }),
  updateQuantity: (variantId, quantity) => set((state) => ({
    items: quantity <= 0 ? state.items.filter((i) => i.variantId !== variantId) : state.items.map((i) => i.variantId === variantId ? { ...i, quantity } : i),
  })),
  removeItem: (variantId) => set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) })),
  clearCart: () => set({ items: [] }),
  subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
  itemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
}));
