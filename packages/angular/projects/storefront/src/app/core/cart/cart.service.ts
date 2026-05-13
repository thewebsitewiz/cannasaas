import { Injectable, computed, signal } from '@angular/core';

const CART_KEY = 'cs.storefront.cart';

export interface CartItem {
  readonly productId: string;
  readonly variantId: string;
  readonly name: string;
  readonly variantName: string;
  readonly price: number;
  readonly quantity: number;
  readonly maxQuantity?: number;
  readonly strainType?: string;
  readonly imageUrl?: string;
}

export type NewCartItem = Omit<CartItem, 'quantity'>;

/**
 * Anonymous, device-scoped cart. Belongs to the browser, not the user.
 *
 * - Identity is `variantId`. Two variants of the same product are separate
 *   line items; adding the same variantId again increments quantity.
 * - The React store keyed `updateQuantity`/`removeItem` on productId — that
 *   would collapse multiple variants of one product. Treated as a React-side
 *   bug; not ported.
 * - Persists to localStorage under `cs.storefront.cart`. Single key — does
 *   not split per-tenant; storefront serves one dispensary per request.
 * - Not cleared on logout. The checkout flow calls `clear()` after a
 *   successful order placement.
 * - No client-side stock validation. The server enforces stock at order
 *   creation via `ProductVariantResolver.stockStatus` + `FOR UPDATE` locks.
 *   `addItem` does cap optimistically against `maxQuantity` for UX.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<readonly CartItem[]>(readItems(CART_KEY));

  readonly items = this._items.asReadonly();
  readonly itemCount = computed(() => this._items().reduce((sum, i) => sum + i.quantity, 0));
  readonly subtotal = computed(() =>
    this._items().reduce((sum, i) => sum + i.price * i.quantity, 0),
  );
  readonly isEmpty = computed(() => this._items().length === 0);

  addItem(item: NewCartItem): void {
    this._items.update((items) => {
      const existing = items.find((i) => i.variantId === item.variantId);
      if (existing) {
        const max = item.maxQuantity ?? existing.maxQuantity;
        const nextQty = max != null ? Math.min(existing.quantity + 1, max) : existing.quantity + 1;
        if (nextQty === existing.quantity) return items;
        return items.map((i) =>
          i.variantId === item.variantId ? { ...i, quantity: nextQty, maxQuantity: max } : i,
        );
      }
      return [...items, { ...item, quantity: 1 }];
    });
    this.persist();
  }

  updateQuantity(variantId: string, quantity: number): void {
    this._items.update((items) => {
      if (quantity <= 0) {
        return items.filter((i) => i.variantId !== variantId);
      }
      return items.map((i) => {
        if (i.variantId !== variantId) return i;
        const capped = i.maxQuantity != null ? Math.min(quantity, i.maxQuantity) : quantity;
        return { ...i, quantity: capped };
      });
    });
    this.persist();
  }

  removeItem(variantId: string): void {
    this._items.update((items) => items.filter((i) => i.variantId !== variantId));
    this.persist();
  }

  clear(): void {
    this._items.set([]);
    this.persist();
  }

  private persist(): void {
    writeItems(CART_KEY, this._items());
  }
}

function readItems(key: string): readonly CartItem[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeItems(key: string, items: readonly CartItem[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(items));
}
