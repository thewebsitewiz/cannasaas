import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { StockAlertsService } from '../../core/stock-alerts/stock-alerts.service';

export interface LowStockSeed {
  readonly variantId: string;
  readonly productName: string;
  readonly variantName?: string | null;
  readonly quantityAvailable: number;
}

interface DisplayRow {
  readonly key: string;
  readonly productName: string;
  readonly variantName?: string | null;
  readonly quantity: number;
  readonly type: 'low_stock' | 'out_of_stock';
  readonly live: boolean;
}

/**
 * Merges the bootstrapped `dashboard.lowStockItems` seed with live
 * `inventory:alert` events. Live entries override matching seed rows
 * by `productName` so a fresh `out_of_stock` for an existing low_stock
 * product replaces it. Caps at `limit` rows; newest first.
 */
@Component({
  selector: 'cs-low-stock-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
      <header class="mb-4 flex items-center justify-between">
        <h2 class="flex items-center gap-2 text-lg font-semibold text-(--color-text)">
          <span class="text-amber-500">⚠</span> Low Stock Alerts
        </h2>
        <span
          class="flex items-center gap-1 text-xs text-(--color-text-muted)"
          [attr.aria-label]="connected() ? 'Live updates connected' : 'Live updates offline'"
        >
          <span
            class="inline-block h-2 w-2 rounded-full"
            [class]="connected() ? 'bg-emerald-500 animate-pulse' : 'bg-(--color-text-muted)'"
          ></span>
          live
        </span>
      </header>

      @if (rows().length === 0) {
        <p class="py-8 text-center text-sm text-(--color-text-muted)">
          Stock levels look healthy — no alerts.
        </p>
      } @else {
        <ul class="divide-y divide-(--color-border)">
          @for (row of rows(); track row.key) {
            <li class="flex items-center justify-between py-2">
              <div class="flex min-w-0 items-center gap-2">
                <span
                  class="shrink-0"
                  [class]="row.type === 'out_of_stock' ? 'text-rose-500' : 'text-amber-500'"
                  aria-hidden="true"
                >
                  {{ row.type === 'out_of_stock' ? '✕' : '⚠' }}
                </span>
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-(--color-text)">
                    {{ row.productName }}
                  </p>
                  @if (row.variantName) {
                    <p class="truncate text-xs text-(--color-text-muted)">
                      {{ row.variantName }}
                    </p>
                  }
                </div>
              </div>
              <span
                class="text-sm font-semibold tabular-nums"
                [class]="row.type === 'out_of_stock' ? 'text-rose-500' : 'text-amber-500'"
              >
                {{ row.type === 'out_of_stock' ? 'Out' : row.quantity + ' left' }}
              </span>
            </li>
          }
        </ul>
      }

      <a
        routerLink="/inventory"
        class="mt-4 block text-sm text-(--color-primary) hover:text-(--color-primary-hover)"
      >
        View all inventory →
      </a>
    </section>
  `,
})
export class LowStockWidget {
  private readonly stockAlerts = inject(StockAlertsService);

  readonly seed = input<readonly LowStockSeed[]>([]);
  readonly limit = input<number>(8);

  protected readonly connected = this.stockAlerts.connected;

  protected readonly rows = computed<readonly DisplayRow[]>(() => {
    const live = this.stockAlerts.alerts();
    const limit = this.limit();
    const liveNames = new Set(live.map((a) => a.productName));
    const liveRows: DisplayRow[] = live.map((a) => ({
      key: 'live:' + a.productName + ':' + a.timestamp,
      productName: a.productName,
      quantity: a.quantity,
      type: a.type,
      live: true,
    }));
    const seedRows: DisplayRow[] = [];
    for (const item of this.seed()) {
      if (liveNames.has(item.productName)) continue;
      seedRows.push({
        key: 'seed:' + item.variantId,
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantityAvailable,
        type: item.quantityAvailable <= 0 ? 'out_of_stock' : 'low_stock',
        live: false,
      });
    }
    return [...liveRows, ...seedRows].slice(0, limit);
  });
}
