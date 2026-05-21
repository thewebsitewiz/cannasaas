import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { InventoryAdjustmentsService } from './inventory-adjustments.service';
import { InventoryTransfersPanel } from './inventory-transfers-panel';

type Tab = 'adjustments' | 'transfers' | 'receiving';

interface TabSpec {
  readonly key: Tab;
  readonly label: string;
}

const TABS: readonly TabSpec[] = [
  { key: 'adjustments', label: 'Adjustments' },
  { key: 'transfers', label: 'Transfers' },
  { key: 'receiving', label: 'Receiving' },
];

/**
 * Inventory Control — three-tab shell. Only the Adjustments tab is
 * implemented in this story (sc-643); Transfers (sc-649) and
 * Receiving (sc-650) render a "Coming soon" placeholder until they
 * ship.
 *
 * Adjustments tab itself is an **approval queue**, mirroring the React
 * `InventoryControlPage`: a read-only audit log with an Approve action
 * on pending rows. Adjustment *creation* happens elsewhere (physical
 * counts, register flow) — a dedicated create UI can be a follow-up if
 * needed.
 */
@Component({
  selector: 'cs-inventory-control-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InventoryTransfersPanel],
  template: `
    <section class="space-y-6">
      <h1 class="text-2xl font-bold text-(--color-text)">Inventory Control</h1>

      <nav
        class="flex gap-1 border-b border-(--color-border)"
        role="tablist"
        aria-label="Inventory Control sections"
      >
        @for (t of tabs; track t.key) {
          <button
            type="button"
            role="tab"
            [attr.aria-selected]="active() === t.key"
            [attr.aria-controls]="'tab-' + t.key"
            (click)="setActive(t.key)"
            class="-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors"
            [class]="
              active() === t.key
                ? 'border-(--color-primary) text-(--color-text)'
                : 'border-transparent text-(--color-text-secondary) hover:text-(--color-text)'
            "
          >
            {{ t.label }}
          </button>
        }
      </nav>

      @switch (active()) {
        @case ('adjustments') {
          <div id="tab-adjustments" role="tabpanel" aria-labelledby="adjustments">
            @if (isLoading()) {
              <p
                class="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-sm text-(--color-text-muted)"
              >
                Loading adjustments…
              </p>
            } @else if (error(); as err) {
              <div
                class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300"
                role="alert"
              >
                <h2 class="font-semibold">Failed to load adjustments</h2>
                <p class="mt-1 text-sm">{{ errorMessage() }}</p>
              </div>
            } @else if (adjustments().length === 0) {
              <p
                class="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-sm text-(--color-text-muted)"
              >
                No adjustments found.
              </p>
            } @else {
              <div
                class="overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface)"
              >
                <header class="border-b border-(--color-border) px-6 py-4">
                  <h2 class="text-lg font-semibold text-(--color-text)">Adjustment Log</h2>
                </header>
                <table class="w-full text-sm">
                  <thead class="border-b border-(--color-border) bg-(--color-bg)">
                    <tr>
                      <th class="px-4 py-2 text-left font-medium text-(--color-text-secondary)">
                        Product
                      </th>
                      <th class="px-4 py-2 text-right font-medium text-(--color-text-secondary)">
                        Change
                      </th>
                      <th class="px-4 py-2 text-right font-medium text-(--color-text-secondary)">
                        Before
                      </th>
                      <th class="px-4 py-2 text-right font-medium text-(--color-text-secondary)">
                        After
                      </th>
                      <th class="px-4 py-2 text-left font-medium text-(--color-text-secondary)">
                        Notes
                      </th>
                      <th class="px-4 py-2 text-center font-medium text-(--color-text-secondary)">
                        Status
                      </th>
                      <th class="px-4 py-2 text-right font-medium text-(--color-text-secondary)">
                        Date
                      </th>
                      <th class="px-4 py-2 text-center font-medium text-(--color-text-secondary)">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-(--color-border)">
                    @for (adj of adjustments(); track adj.adjustmentId) {
                      <tr>
                        <td class="px-4 py-3 font-medium text-(--color-text)">
                          {{ adj.productName }}
                        </td>
                        <td
                          class="px-4 py-3 text-right font-semibold tabular-nums"
                          [class]="adj.quantityChange > 0 ? 'text-emerald-500' : 'text-rose-500'"
                        >
                          {{ adj.quantityChange > 0 ? '+' : '' }}{{ adj.quantityChange }}
                        </td>
                        <td class="px-4 py-3 text-right tabular-nums text-(--color-text-secondary)">
                          {{ adj.quantityBefore }}
                        </td>
                        <td class="px-4 py-3 text-right tabular-nums text-(--color-text)">
                          {{ adj.quantityAfter }}
                        </td>
                        <td
                          class="max-w-[200px] truncate px-4 py-3 text-xs text-(--color-text-muted)"
                          [attr.title]="adj.notes ?? ''"
                        >
                          {{ adj.notes ?? '—' }}
                        </td>
                        <td class="px-4 py-3 text-center">
                          <span
                            class="rounded-full px-2 py-0.5 text-xs"
                            [class]="statusBadgeClass(adj.status)"
                          >
                            {{ adj.status }}
                          </span>
                        </td>
                        <td class="px-4 py-3 text-right text-xs text-(--color-text-muted)">
                          {{ formatDate(adj.created_at) }}
                        </td>
                        <td class="px-4 py-3 text-center">
                          @if (adj.status === 'pending') {
                            <button
                              type="button"
                              (click)="onApprove(adj.adjustmentId)"
                              [disabled]="approvingId() === adj.adjustmentId"
                              class="rounded bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                              [attr.aria-label]="'Approve adjustment ' + adj.productName"
                            >
                              @if (approvingId() === adj.adjustmentId) {
                                Approving…
                              } @else {
                                Approve
                              }
                            </button>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }
        @case ('transfers') {
          <div id="tab-transfers" role="tabpanel">
            <cs-inventory-transfers-panel />
          </div>
        }
        @case ('receiving') {
          <div
            id="tab-receiving"
            role="tabpanel"
            class="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-sm text-(--color-text-muted)"
          >
            Receiving + variance reconciliation lands in sc-650.
          </div>
        }
      }
    </section>
  `,
})
export class InventoryControlPage {
  private readonly svc = inject(InventoryAdjustmentsService);

  protected readonly tabs = TABS;
  protected readonly active = signal<Tab>('adjustments');

  protected readonly adjustments = this.svc.adjustments;
  protected readonly isLoading = this.svc.isLoading;
  protected readonly error = this.svc.error;
  protected readonly approvingId = this.svc.approvingId;

  protected readonly errorMessage = computed(() => {
    const err = this.error();
    return err instanceof Error ? err.message : 'Unable to load adjustments.';
  });

  protected setActive(tab: Tab): void {
    this.active.set(tab);
  }

  protected statusBadgeClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'pending':
        return 'bg-amber-500/10 text-amber-500';
      case 'rejected':
        return 'bg-rose-500/10 text-rose-500';
      default:
        return 'bg-(--color-surface-hover) text-(--color-text-secondary)';
    }
  }

  protected formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString();
  }

  protected onApprove(adjustmentId: string): void {
    void this.svc.approve(adjustmentId);
  }
}
