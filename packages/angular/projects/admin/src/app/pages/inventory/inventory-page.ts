import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { DashboardService } from '../dashboard/dashboard.service';

/**
 * Admin Inventory page — KPI summary + low-stock table.
 *
 * Mirrors React parity: a read-only view of inventory health sourced
 * from the existing `dashboard` query (sc-624). Per-variant inventory
 * table, in/low/out filter, inline threshold edit, and live alert
 * highlighting were in the filed scope but not in the React admin —
 * deferred until a specific need surfaces. The dashboard's
 * `LowStockWidget` already covers the live-alert UX.
 */
@Component({
  selector: 'cs-inventory-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-6">
      <h1 class="text-2xl font-bold text-(--color-text)">Inventory</h1>

      @if (loading()) {
        <p
          class="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-sm text-(--color-text-muted)"
        >
          Loading inventory…
        </p>
      } @else if (error(); as err) {
        <div
          class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300"
          role="alert"
        >
          <h2 class="font-semibold">Failed to load inventory</h2>
          <p class="mt-1 text-sm">{{ errorMessage() }}</p>
        </div>
      } @else if (data(); as d) {
        <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
          <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
            <p class="mb-1 text-sm text-(--color-text-secondary)">Total variants</p>
            <p class="text-2xl font-bold text-(--color-text) tabular-nums">
              {{ d.inventory.totalVariants }}
            </p>
          </article>
          <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
            <p class="mb-1 text-sm text-(--color-text-secondary)">Units on hand</p>
            <p class="text-2xl font-bold text-(--color-text) tabular-nums">
              {{ d.inventory.totalUnitsOnHand }}
            </p>
          </article>
          <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
            <p class="mb-1 text-sm text-(--color-text-secondary)">Est. value</p>
            <p class="text-2xl font-bold text-(--color-text) tabular-nums">
              {{ formatMoney(d.inventory.estimatedInventoryValue) }}
            </p>
          </article>
          <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
            <p class="mb-1 text-sm text-(--color-text-secondary)">Low / Out of stock</p>
            <p class="text-2xl font-bold tabular-nums">
              <span
                [class]="d.inventory.lowStockCount > 0 ? 'text-amber-500' : 'text-(--color-text)'"
              >
                {{ d.inventory.lowStockCount }}
              </span>
              <span class="text-(--color-text-muted)"> / </span>
              <span
                [class]="d.inventory.outOfStockCount > 0 ? 'text-rose-500' : 'text-(--color-text)'"
              >
                {{ d.inventory.outOfStockCount }}
              </span>
            </p>
          </article>
        </div>

        @if (d.lowStockItems.length > 0) {
          <div
            class="overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface)"
          >
            <header class="border-b border-(--color-border) px-6 py-4">
              <h2 class="flex items-center gap-2 text-lg font-semibold text-(--color-text)">
                <span class="text-amber-500" aria-hidden="true">⚠</span> Low stock items
              </h2>
            </header>
            <table class="w-full text-sm">
              <thead class="border-b border-(--color-border) bg-(--color-bg)">
                <tr>
                  <th class="px-4 py-2 text-left font-medium text-(--color-text-secondary)">
                    Product
                  </th>
                  <th class="px-4 py-2 text-left font-medium text-(--color-text-secondary)">
                    Variant
                  </th>
                  <th class="px-4 py-2 text-right font-medium text-(--color-text-secondary)">
                    On hand
                  </th>
                  <th class="px-4 py-2 text-right font-medium text-(--color-text-secondary)">
                    Available
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-(--color-border)">
                @for (item of d.lowStockItems; track item.variantId) {
                  <tr>
                    <td class="px-4 py-3 text-(--color-text)">{{ item.productName }}</td>
                    <td class="px-4 py-3 text-(--color-text-secondary)">
                      {{ item.variantName }}
                    </td>
                    <td class="px-4 py-3 text-right tabular-nums text-(--color-text)">
                      {{ item.quantityOnHand }}
                    </td>
                    <td
                      class="px-4 py-3 text-right font-medium tabular-nums"
                      [class]="item.quantityAvailable <= 0 ? 'text-rose-500' : 'text-amber-500'"
                    >
                      {{ item.quantityAvailable }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <p
            class="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-sm text-(--color-text-muted)"
          >
            All variants are above their reorder threshold.
          </p>
        }
      }
    </section>
  `,
})
export class InventoryPage {
  private readonly dashboard = inject(DashboardService);

  protected readonly data = this.dashboard.data;
  protected readonly loading = this.dashboard.isLoading;
  protected readonly error = this.dashboard.error;

  protected readonly errorMessage = computed(() => {
    const err = this.error();
    return err instanceof Error ? err.message : 'Unable to load inventory.';
  });

  protected formatMoney(value: number): string {
    return (
      '$' +
      value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }
}
