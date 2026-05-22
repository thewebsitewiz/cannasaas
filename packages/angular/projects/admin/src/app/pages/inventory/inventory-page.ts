import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { type Dashboard, DashboardService } from '../dashboard/dashboard.service';

type LowStockItem = Dashboard['lowStockItems'][number];

/**
 * Admin Inventory page — KPI summary + low-stock table with inline
 * per-variant reorder-threshold editing (sc-674). The page sources
 * its KPIs from the `dashboard` query and writes back through
 * `DashboardService.setReorderThreshold` which refetches on success.
 */
@Component({
  selector: 'cs-inventory-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
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
              <p class="mt-1 text-xs text-(--color-text-muted)">
                Click a threshold to change it. Drops below the new threshold trigger an alert.
              </p>
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
                  <th class="px-4 py-2 text-right font-medium text-(--color-text-secondary)">
                    Reorder at
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-(--color-border)">
                @for (item of d.lowStockItems; track item.inventoryId) {
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
                    <td class="px-4 py-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        [attr.aria-label]="'Reorder threshold for ' + item.variantName"
                        [value]="thresholdDisplay(item)"
                        [disabled]="savingFor() === item.inventoryId"
                        (change)="onThresholdChange(item, $event)"
                        class="w-20 rounded-md border border-(--color-border) bg-(--color-bg) px-2 py-1 text-right text-sm text-(--color-text) tabular-nums"
                      />
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
  protected readonly savingFor = this.dashboard.savingThresholdFor;

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

  protected thresholdDisplay(item: LowStockItem): number | '' {
    return item.reorderThreshold == null ? '' : item.reorderThreshold;
  }

  protected async onThresholdChange(item: LowStockItem, event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const raw = target.value.trim();
    let next: number | null;
    if (raw === '') {
      next = null;
    } else {
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed < 0) {
        target.value = this.thresholdDisplay(item).toString();
        return;
      }
      next = parsed;
    }
    if (next === item.reorderThreshold) return;
    await this.dashboard.setReorderThreshold(item.inventoryId, next);
  }
}
