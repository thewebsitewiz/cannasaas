import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { DispensaryContextService } from '../tenant/dispensary-context.service';

const LEGACY_KEY = 'cs.storefront.cart';

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
 * Per-tenant, device-scoped cart.
 *
 * Identity is `variantId`. Persists to localStorage under
 * `cs.storefront.cart:{dispensaryId}` — keyed by the dispensary the
 * customer is currently browsing. Switching tenants (e.g. acme →
 * omega via subdomain or path-prefix) swaps the active key and loads
 * the cart bound to the new tenant. No merge — see sc-605 closeout.
 *
 * Pre-sc-605 carts under the legacy `cs.storefront.cart` key are
 * deleted once on first run to avoid leaving stale state.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly dispensary = inject(DispensaryContextService);

  private readonly _items = signal<readonly CartItem[]>([]);

  readonly items = this._items.asReadonly();
  readonly itemCount = computed(() =>
    this._items().reduce((sum, i) => sum + i.quantity, 0),
  );
  readonly subtotal = computed(() =>
    this._items().reduce((sum, i) => sum + i.price * i.quantity, 0),
  );
  readonly isEmpty = computed(() => this._items().length === 0);

  constructor() {
    // One-time cleanup of any pre-sc-605 single-key cart.
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(LEGACY_KEY);
      } catch {
        // SecurityError in private browsing on some Safari versions — ignore.
      }
    }
    // Swap the active cart whenever the tenant changes.
    effect(() => {
      const id = this.dispensary.entityId();
      this._items.set(id ? readItems(cartKey(id)) : []);
    });
  }

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
    const id = this.dispensary.entityId();
    if (!id) return;
    writeItems(cartKey(id), this._items());
  }
}

function cartKey(dispensaryId: string): string {
  return `cs.storefront.cart:${dispensaryId}`;
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
