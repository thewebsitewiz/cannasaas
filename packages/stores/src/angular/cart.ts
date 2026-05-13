import { Injectable, computed, effect, signal } from '@angular/core';

export interface CartItem {
  readonly productId: string;
  readonly variantId: string;
  readonly name: string;
  readonly variantName: string;
  readonly price: number;
  readonly quantity: number;
  readonly strainType?: string;
  readonly imageUrl?: string;
  /** Per-line stock ceiling; addItem refuses to push quantity above this. */
  readonly maxQuantity?: number;
}

export type AddCartItem = Omit<CartItem, 'quantity'>;

const KEY_PREFIX = 'cs.cart:';

/**
 * Storefront cart store. Signal-based, persisted to localStorage keyed by
 * the current tenant slug so different dispensaries on the same browser
 * don't bleed carts into one another.
 *
 * Tenant scoping: call `setTenant(slug)` once the dispensary is resolved.
 * Until then the store is in-memory only (`null` tenant means no persistence).
 */
@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly _tenant = signal<string | null>(null);
  private readonly _items = signal<CartItem[]>([]);

  readonly items = this._items.asReadonly();
  readonly tenant = this._tenant.asReadonly();
  readonly itemCount = computed(() =>
    this._items().reduce((sum, item) => sum + item.quantity, 0),
  );
  readonly subtotal = computed(() =>
    this._items().reduce((sum, item) => sum + item.price * item.quantity, 0),
  );
  readonly isEmpty = computed(() => this._items().length === 0);

  constructor() {
    effect(() => {
      const tenant = this._tenant();
      const items = this._items();
      if (!tenant) return;
      write(`${KEY_PREFIX}${tenant}`, JSON.stringify(items));
    });
  }

  setTenant(slug: string | null): void {
    this._tenant.set(slug);
    if (!slug) {
      this._items.set([]);
      return;
    }
    const raw = read(`${KEY_PREFIX}${slug}`);
    if (!raw) {
      this._items.set([]);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as CartItem[];
      this._items.set(Array.isArray(parsed) ? parsed : []);
    } catch {
      this._items.set([]);
    }
  }

  addItem(item: AddCartItem): void {
    this._items.update((items) => {
      const existing = items.find((i) => i.variantId === item.variantId);
      if (existing) {
        if (
          existing.maxQuantity != null &&
          existing.quantity >= existing.maxQuantity
        ) {
          return items;
        }
        return items.map((i) =>
          i.variantId === item.variantId
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [...items, { ...item, quantity: 1 }];
    });
  }

  updateQuantity(variantId: string, quantity: number): void {
    this._items.update((items) =>
      quantity <= 0
        ? items.filter((i) => i.variantId !== variantId)
        : items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i,
          ),
    );
  }

  removeItem(variantId: string): void {
    this._items.update((items) =>
      items.filter((i) => i.variantId !== variantId),
    );
  }

  clearCart(): void {
    this._items.set([]);
  }
}

function read(key: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(key);
}

function write(key: string, value: string | null): void {
  if (typeof localStorage === 'undefined') return;
  if (value === null) localStorage.removeItem(key);
  else localStorage.setItem(key, value);
}
