import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { AuthService } from '../../core/auth/auth.service';
import {
  InventoryTransfersService,
  type InventoryTransfer,
  type TransferDirection,
} from './inventory-transfers.service';

const DIRECTIONS: ReadonlyArray<{ key: TransferDirection; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'incoming', label: 'Incoming' },
  { key: 'outgoing', label: 'Outgoing' },
];

/**
 * Transfers tab content. Lists inter-dispensary transfers; expand a
 * row to lazy-load its `transferItems`. Approve + Ship buttons are
 * role-gated — only `org_admin` and `super_admin` see them since
 * transfer approvals cross dispensary boundaries (matches the React
 * `InventoryControlPage` mutation usage).
 *
 * Create-transfer UX is intentionally out of scope: the React admin
 * doesn't have one either; this slice mirrors approval-queue parity.
 */
@Component({
  selector: 'cs-inventory-transfers-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="flex items-center gap-2" role="group" aria-label="Direction filter">
        @for (d of directions; track d.key) {
          <button
            type="button"
            (click)="setDirection(d.key)"
            class="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
            [class]="
              direction() === d.key
                ? 'border-(--color-primary) bg-(--color-primary)/10 text-(--color-primary)'
                : 'border-(--color-border) text-(--color-text-secondary) hover:text-(--color-text)'
            "
            [attr.aria-pressed]="direction() === d.key"
          >
            {{ d.label }}
          </button>
        }
      </div>

      @if (isLoading()) {
        <p
          class="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-sm text-(--color-text-muted)"
        >
          Loading transfers…
        </p>
      } @else if (error(); as err) {
        <div
          class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300"
          role="alert"
        >
          <h2 class="font-semibold">Failed to load transfers</h2>
          <p class="mt-1 text-sm">{{ errorMessage() }}</p>
        </div>
      } @else if (transfers().length === 0) {
        <p
          class="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-sm text-(--color-text-muted)"
        >
          No transfers found.
        </p>
      } @else {
        <div class="overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface)">
          <table class="w-full text-sm">
            <thead class="border-b border-(--color-border) bg-(--color-bg)">
              <tr>
                <th class="px-4 py-2 text-left font-medium text-(--color-text-secondary)">
                  Direction
                </th>
                <th class="px-4 py-2 text-left font-medium text-(--color-text-secondary)">
                  Partner Dispensary
                </th>
                <th class="px-4 py-2 text-center font-medium text-(--color-text-secondary)">
                  Status
                </th>
                <th class="px-4 py-2 text-left font-medium text-(--color-text-secondary)">Notes</th>
                <th class="px-4 py-2 text-right font-medium text-(--color-text-secondary)">
                  Created
                </th>
                <th class="px-4 py-2 text-center font-medium text-(--color-text-secondary)">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-(--color-border)">
              @for (t of transfers(); track t.transferId) {
                <tr
                  class="cursor-pointer hover:bg-(--color-surface-hover)"
                  (click)="toggle(t.transferId)"
                  [attr.aria-expanded]="expandedId() === t.transferId"
                >
                  <td class="px-4 py-3 text-(--color-text)">
                    {{ partnerDirection(t) === 'incoming' ? '← Incoming' : '→ Outgoing' }}
                  </td>
                  <td class="px-4 py-3 font-medium text-(--color-text)">
                    {{ partnerDispensaryId(t) }}
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="rounded-full px-2 py-0.5 text-xs" [class]="statusClass(t.status)">
                      {{ t.status }}
                    </span>
                  </td>
                  <td
                    class="max-w-[240px] truncate px-4 py-3 text-xs text-(--color-text-muted)"
                    [attr.title]="t.notes ?? ''"
                  >
                    {{ t.notes ?? '—' }}
                  </td>
                  <td class="px-4 py-3 text-right text-xs text-(--color-text-muted)">
                    {{ formatDate(t.created_at) }}
                  </td>
                  <td class="px-4 py-3 text-center" (click)="$event.stopPropagation()">
                    @if (canManage()) {
                      @if (t.status === 'pending') {
                        <button
                          type="button"
                          (click)="onApprove(t.transferId)"
                          [disabled]="mutatingId() === t.transferId"
                          class="rounded bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                          [attr.aria-label]="'Approve transfer ' + t.transferId"
                        >
                          @if (mutatingId() === t.transferId) {
                            Approving…
                          } @else {
                            Approve
                          }
                        </button>
                      } @else if (t.status === 'approved') {
                        <button
                          type="button"
                          (click)="onShip(t.transferId)"
                          [disabled]="mutatingId() === t.transferId"
                          class="rounded bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                          [attr.aria-label]="'Ship transfer ' + t.transferId"
                        >
                          @if (mutatingId() === t.transferId) {
                            Shipping…
                          } @else {
                            Ship
                          }
                        </button>
                      }
                    } @else {
                      <span
                        class="text-xs text-(--color-text-muted)"
                        [attr.title]="'Requires org_admin or super_admin'"
                      >
                        —
                      </span>
                    }
                  </td>
                </tr>
                @if (expandedId() === t.transferId) {
                  <tr class="bg-(--color-bg)">
                    <td colspan="6" class="px-6 py-4">
                      @if (itemsLoading()) {
                        <p class="text-xs text-(--color-text-muted)">Loading items…</p>
                      } @else if (expandedItems().length === 0) {
                        <p class="text-xs text-(--color-text-muted)">
                          No items recorded on this transfer.
                        </p>
                      } @else {
                        <table class="w-full text-xs">
                          <thead>
                            <tr class="text-(--color-text-secondary)">
                              <th class="text-left">Product</th>
                              <th class="text-left">Variant</th>
                              <th class="text-right">Requested</th>
                              <th class="text-right">Shipped</th>
                              <th class="text-right">Received</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (item of expandedItems(); track item.itemId) {
                              <tr>
                                <td class="py-1 text-(--color-text)">{{ item.productName }}</td>
                                <td class="py-1 text-(--color-text)">{{ item.variantName }}</td>
                                <td class="py-1 text-right tabular-nums text-(--color-text)">
                                  {{ item.quantityRequested }}
                                </td>
                                <td
                                  class="py-1 text-right tabular-nums text-(--color-text-secondary)"
                                >
                                  {{ item.quantityShipped ?? '—' }}
                                </td>
                                <td
                                  class="py-1 text-right tabular-nums text-(--color-text-secondary)"
                                >
                                  {{ item.quantityReceived ?? '—' }}
                                </td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      }
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class InventoryTransfersPanel {
  private readonly svc = inject(InventoryTransfersService);
  private readonly auth = inject(AuthService);

  protected readonly directions = DIRECTIONS;

  protected readonly transfers = this.svc.transfers;
  protected readonly isLoading = this.svc.isLoading;
  protected readonly error = this.svc.error;
  protected readonly direction = this.svc.direction;
  protected readonly expandedId = this.svc.expandedId;
  protected readonly expandedItems = this.svc.expandedItems;
  protected readonly itemsLoading = this.svc.itemsLoading;
  protected readonly mutatingId = this.svc.mutatingId;

  protected readonly canManage = computed(() => {
    const role = this.auth.role();
    return role === 'super_admin' || role === 'org_admin';
  });

  protected readonly errorMessage = computed(() => {
    const err = this.error();
    return err instanceof Error ? err.message : 'Unable to load transfers.';
  });

  protected setDirection(d: TransferDirection): void {
    this.svc.setDirection(d);
  }

  protected toggle(id: string): void {
    this.svc.toggleExpanded(id);
  }

  protected onApprove(id: string): void {
    void this.svc.approve(id);
  }

  protected onShip(id: string): void {
    void this.svc.ship(id);
  }

  protected partnerDirection(t: InventoryTransfer): 'incoming' | 'outgoing' {
    const me = this.auth.user()?.dispensaryId ?? '';
    return t.toDispensaryId === me ? 'incoming' : 'outgoing';
  }

  protected partnerDispensaryId(t: InventoryTransfer): string {
    const me = this.auth.user()?.dispensaryId ?? '';
    return t.toDispensaryId === me ? t.fromDispensaryId : t.toDispensaryId;
  }

  protected statusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/10 text-amber-500';
      case 'approved':
        return 'bg-sky-500/10 text-sky-500';
      case 'shipped':
      case 'in_transit':
        return 'bg-indigo-500/10 text-indigo-500';
      case 'received':
        return 'bg-emerald-500/10 text-emerald-500';
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
}
