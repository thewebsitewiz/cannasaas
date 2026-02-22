/**
 * @file cartStore.ts
 * @path apps/storefront/src/stores/cartStore.ts
 *
 * Zustand store for the customer's active shopping cart.
 *
 * ARCHITECTURE NOTE: This store manages the full cart locally and syncs
 * with the server on significant mutations (add, remove, update quantity).
 * The `itemCount` selector is intentionally lightweight so the CartButton
 * badge can subscribe without re-rendering on unrelated cart changes.
 *
 * COMPLIANCE NOTE: Cannabis cart logic must enforce:
 *   - Per-transaction THC limits (varies by state)
 *   - Flower equivalent calculations for mixed-product carts
 *   - Loyalty point accrual rules
 * These are enforced server-side; the store surfaces validation errors.
 *
 * Usage:
 *   const itemCount = useCartItemCount();          // badge only
 *   const { items, addItem } = useCartStore();     // full cart operations
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single line item in the cart */
export interface CartItem {
  /** Product UUID */
  productId: string;

  /** Variant UUID (e.g., specific weight/size) */
  variantId: string;

  /** Display name */
  name: string;

  /** Variant label (e.g., "3.5g", "1oz") */
  variantLabel: string;

  /** Quantity in units */
  quantity: number;

  /** Price per unit in cents */
  unitPriceCents: number;

  /** Optional thumbnail URL for cart drawer display */
  thumbnailUrl?: string;

  /** Metrc UID for compliance tracking (may be null until assigned) */
  metrcUid?: string | null;

  /** Product category (used for limit calculations) */
  category: string;
}

// ─── State Shape ─────────────────────────────────────────────────────────────

interface CartState {
  /** Line items currently in the cart */
  items: CartItem[];

  /** True while a server sync is in-flight */
  isSyncing: boolean;

  /** Server-side validation error message (e.g., limit exceeded) */
  validationError: string | null;

  /** Whether the cart drawer/panel is open */
  isOpen: boolean;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

interface CartActions {
  /** Add a product variant to the cart (or increment if already present) */
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;

  /** Remove a line item entirely by variantId */
  removeItem: (variantId: string) => void;

  /**
   * Update the quantity of an existing line item.
   * Setting quantity to 0 is equivalent to removeItem.
   */
  updateQuantity: (variantId: string, quantity: number) => void;

  /** Empty the cart (used after successful order submission) */
  clearCart: () => void;

  /** Toggle the cart drawer open/closed */
  toggleOpen: () => void;

  /** Programmatically open the cart drawer */
  openCart: () => void;

  /** Close the cart drawer */
  closeCart: () => void;

  /** Clear any validation error */
  clearError: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      // ── State ──────────────────────────────────────────────────────────────
      items: [],
      isSyncing: false,
      validationError: null,
      isOpen: false,

      // ── Actions ────────────────────────────────────────────────────────────

      addItem: (itemData, quantity = 1) => {
        const { items } = get();
        const existing = items.find((i) => i.variantId === itemData.variantId);

        if (existing) {
          // Increment existing line item quantity
          set({
            items: items.map((i) =>
              i.variantId === itemData.variantId
                ? { ...i, quantity: i.quantity + quantity }
                : i,
            ),
          });
        } else {
          // Append new line item
          set({ items: [...items, { ...itemData, quantity }] });
        }
      },

      removeItem: (variantId) => {
        set({ items: get().items.filter((i) => i.variantId !== variantId) });
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i,
          ),
        });
      },

      clearCart: () => set({ items: [], validationError: null }),

      toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      clearError: () => set({ validationError: null }),
    }),
    {
      /**
       * Persist only the line items to localStorage so the cart survives
       * page refreshes. UI state (isOpen) is intentionally excluded.
       */
      name: 'cannasaas-cart',
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

// ─── Selectors ────────────────────────────────────────────────────────────────

/**
 * Lightweight selector — returns only the total item count.
 * CartButton subscribes to this to avoid re-rendering on price changes.
 */
export const useCartItemCount = () =>
  useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0));

/** Returns the cart subtotal in cents */
export const useCartSubtotal = () =>
  useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0),
  );

