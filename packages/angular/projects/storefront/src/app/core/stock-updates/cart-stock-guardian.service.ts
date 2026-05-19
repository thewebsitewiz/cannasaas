import { Injectable, Signal, computed, effect, inject, signal } from '@angular/core';
import { CartService } from '../cart/cart.service';
import { StockUpdatesService } from './stock-updates.service';

export interface StockEviction {
  readonly variantId: string;
  readonly name: string;
  readonly variantName: string;
  readonly timestamp: string;
}

/**
 * Removes cart line items when their variant goes out_of_stock via the
 * storefront WS feed and queues a short-lived eviction notice for the
 * UI to render as a toast.
 *
 * Why this is its own service:
 * - CartService stays pure (no WS dependency) so cart unit tests don't
 *   need to mock the socket service.
 * - StockUpdatesService stays a passive read model.
 * - This guardian owns the side-effect of mutating the cart based on a
 *   stock event. The App component injects it for eager bootstrap.
 */
@Injectable({ providedIn: 'root' })
export class CartStockGuardianService {
  private readonly cart = inject(CartService);
  private readonly stockUpdates = inject(StockUpdatesService);

  private readonly _evictions = signal<readonly StockEviction[]>([]);

  readonly evictions: Signal<readonly StockEviction[]> = this._evictions.asReadonly();
  readonly hasEvictions = computed(() => this._evictions().length > 0);

  constructor() {
    effect(() => {
      const liveStock = this.stockUpdates.updates();
      if (liveStock.size === 0) return;
      const items = this.cart.items();
      if (items.length === 0) return;

      const evicted: StockEviction[] = [];
      for (const item of items) {
        const live = liveStock.get(item.variantId);
        if (live?.status === 'out_of_stock') {
          evicted.push({
            variantId: item.variantId,
            name: item.name,
            variantName: item.variantName,
            timestamp: live.timestamp,
          });
        }
      }
      if (evicted.length === 0) return;

      for (const e of evicted) this.cart.removeItem(e.variantId);
      this._evictions.update((prev) => [...evicted, ...prev].slice(0, 5));
    });
  }

  dismiss(variantId: string): void {
    this._evictions.update((prev) => prev.filter((e) => e.variantId !== variantId));
  }
}
