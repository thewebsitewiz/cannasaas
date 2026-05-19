import { Injectable, computed, signal } from '@angular/core';

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  variantName: string;
  price: number;
  quantity: number;
  strainType?: string;
}

export type AddCartItem = Omit<CartItem, 'quantity'>;

/**
 * Customer attached to the in-progress order via the /checkin phone-number
 * keypad. Lives alongside cart items so it gets cleared on the same lifecycle
 * events (idle/attract reset, order placed, manual Reset).
 *
 * Walk-ins leave this null — the API allows a null customerUserId on
 * createOrder and attaches the order to no customer.
 */
export interface CheckedInCustomer {
  customerId: string;
  firstName: string | null;
  lastName: string | null;
  loyaltyPoints: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<CartItem[]>([]);
  private readonly _customer = signal<CheckedInCustomer | null>(null);

  readonly items = this._items.asReadonly();
  readonly customer = this._customer.asReadonly();
  readonly itemCount = computed(() => this._items().reduce((sum, item) => sum + item.quantity, 0));
  readonly subtotal = computed(() =>
    this._items().reduce((sum, item) => sum + item.price * item.quantity, 0),
  );
  readonly isEmpty = computed(() => this._items().length === 0);

  addItem(item: AddCartItem): void {
    this._items.update((items) => {
      const existing = items.find((i) => i.variantId === item.variantId);
      if (existing) {
        return items.map((i) =>
          i.variantId === item.variantId ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...items, { ...item, quantity: 1 }];
    });
  }

  updateQuantity(variantId: string, quantity: number): void {
    this._items.update((items) =>
      quantity <= 0
        ? items.filter((i) => i.variantId !== variantId)
        : items.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)),
    );
  }

  removeItem(variantId: string): void {
    this._items.update((items) => items.filter((i) => i.variantId !== variantId));
  }

  setCustomer(customer: CheckedInCustomer | null): void {
    this._customer.set(customer);
  }

  clearCart(): void {
    this._items.set([]);
    this._customer.set(null);
  }
}
