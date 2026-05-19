import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { OrderSocketService } from '../core/order-socket/order-socket.service';
import { StockUpdatesService } from '../core/stock-updates/stock-updates.service';

/**
 * Thin pill shown when the storefront has lost its real-time WS feed
 * (sc-606). socket.io reconnects indefinitely now; this gives the
 * customer a visual cue that live stock + live order tracking aren't
 * working until the connection comes back.
 *
 * Latches on first connection — we don't flash on cold-start before
 * the first connect attempt resolves.
 */
@Component({
  selector: 'cs-connection-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showBanner()) {
      <div
        class="pointer-events-none fixed bottom-4 left-1/2 z-[55] -translate-x-1/2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 shadow-lg"
        role="status"
        aria-live="polite"
      >
        <p class="flex items-center gap-2 text-xs font-medium text-amber-900">
          <span
            class="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500"
            aria-hidden="true"
          ></span>
          Reconnecting — live updates paused
        </p>
      </div>
    }
  `,
})
export class ConnectionBanner {
  private readonly stock = inject(StockUpdatesService);
  private readonly orders = inject(OrderSocketService);

  private readonly hasEverConnected = signal(false);

  protected readonly showBanner = computed(() => {
    if (!this.hasEverConnected()) return false;
    return !this.stock.connected() || !this.orders.connected();
  });

  constructor() {
    effect(() => {
      if (this.stock.connected() || this.orders.connected()) {
        this.hasEverConnected.set(true);
      }
    });
  }
}
