import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { DashboardService } from '../dashboard/dashboard.service';
import { OrdersService, type OrderListItem, type OrderStatusFilter } from './orders.service';

const STATUS_FILTERS: ReadonlyArray<{ key: OrderStatusFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready_for_pickup', label: 'Ready for pickup' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const TERMINAL_STATUSES = new Set<string>(['completed', 'cancelled', 'picked_up', 'delivered']);

/**
 * Admin orders list + detail. Mirrors the React `OrdersPage`:
 * KPI cards (reused `DashboardService`), status filter pills, row
 * table, side detail panel, cancel-order flow with reason capture.
 *
 * Per-order state transitions (confirm / start preparing / mark ready
 * / complete) are intentionally **out of scope** for sc-631 — those
 * `*GQL` ops already exist but the React admin doesn't surface them
 * either (transitions happen via staff POS flows). File a follow-up
 * story if admin needs to drive transitions manually.
 */
@Component({
  selector: 'cs-orders-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-6">
      <h1 class="text-2xl font-bold text-(--color-text)">Orders</h1>

      <!-- KPI cards -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
        <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
          <p class="mb-2 text-sm text-(--color-text-secondary)">Total</p>
          <p class="text-2xl font-bold text-(--color-text) tabular-nums">
            {{ sales()?.totalOrders ?? 0 }}
          </p>
        </article>
        <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
          <p class="mb-2 text-sm text-emerald-500">Completed</p>
          <p class="text-2xl font-bold text-emerald-500 tabular-nums">
            {{ sales()?.completedOrders ?? 0 }}
          </p>
        </article>
        <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
          <p class="mb-2 text-sm text-amber-500">Pending</p>
          <p class="text-2xl font-bold text-amber-500 tabular-nums">
            {{ sales()?.pendingOrders ?? 0 }}
          </p>
        </article>
        <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
          <p class="mb-2 text-sm text-rose-500">Cancelled</p>
          <p class="text-2xl font-bold text-rose-500 tabular-nums">
            {{ sales()?.cancelledOrders ?? 0 }}
          </p>
        </article>
      </div>

      <!-- Filter pills -->
      <div class="flex items-center gap-3">
        <div
          class="flex flex-wrap gap-1 rounded-lg border border-(--color-border) bg-(--color-surface) p-1"
          role="tablist"
          aria-label="Status filter"
        >
          @for (f of statusFilters; track f.key) {
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="statusFilter() === f.key"
              (click)="setStatusFilter(f.key)"
              class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              [class]="
                statusFilter() === f.key
                  ? 'bg-(--color-primary) text-white'
                  : 'text-(--color-text-secondary) hover:bg-(--color-surface-hover)'
              "
            >
              {{ f.label }}
            </button>
          }
        </div>
        <span class="text-xs text-(--color-text-muted)">
          {{ filteredOrders().length }} orders
        </span>
      </div>

      <!-- Body: table + optional detail -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div
          class="overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface)"
          [class.lg:col-span-2]="selectedId() !== null"
          [class.lg:col-span-3]="selectedId() === null"
        >
          @if (isLoading()) {
            <p class="p-12 text-center text-sm text-(--color-text-muted)">Loading orders…</p>
          } @else if (error(); as err) {
            <div class="p-6 text-rose-300" role="alert">
              <h2 class="font-semibold">Failed to load orders</h2>
              <p class="mt-1 text-sm">{{ ordersErrorMessage() }}</p>
            </div>
          } @else if (filteredOrders().length === 0) {
            <p class="p-12 text-center text-sm text-(--color-text-muted)">
              No orders found for this filter.
            </p>
          } @else {
            <table class="w-full text-sm">
              <thead class="border-b border-(--color-border) bg-(--color-bg)">
                <tr>
                  <th class="px-4 py-3 text-left font-medium text-(--color-text-secondary)">
                    Order ID
                  </th>
                  <th class="px-4 py-3 text-left font-medium text-(--color-text-secondary)">
                    Customer
                  </th>
                  <th class="px-4 py-3 text-left font-medium text-(--color-text-secondary)">
                    Type
                  </th>
                  <th class="px-4 py-3 text-center font-medium text-(--color-text-secondary)">
                    Status
                  </th>
                  <th class="px-4 py-3 text-right font-medium text-(--color-text-secondary)">
                    Total
                  </th>
                  <th class="px-4 py-3 text-right font-medium text-(--color-text-secondary)">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-(--color-border)">
                @for (order of filteredOrders(); track order.orderId) {
                  <tr
                    class="cursor-pointer transition-colors"
                    [class]="
                      selectedId() === order.orderId
                        ? 'bg-(--color-primary)/10'
                        : 'hover:bg-(--color-surface-hover)'
                    "
                    (click)="onSelect(order.orderId)"
                    [attr.aria-label]="'Order ' + truncateId(order.orderId)"
                  >
                    <td class="px-4 py-3 font-mono text-xs font-medium text-(--color-text)">
                      #{{ truncateId(order.orderId) }}
                    </td>
                    <td class="px-4 py-3 text-xs text-(--color-text-secondary)">
                      {{ formatCustomer(order) }}
                    </td>
                    <td class="px-4 py-3 text-xs capitalize text-(--color-text-secondary)">
                      {{ order.orderType }}
                    </td>
                    <td class="px-4 py-3 text-center">
                      <span
                        class="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
                        [class]="statusBadgeClass(order.orderStatus)"
                      >
                        {{ formatStatus(order.orderStatus) }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right font-semibold tabular-nums text-(--color-text)">
                      {{ formatMoney(order.total) }}
                    </td>
                    <td class="px-4 py-3 text-right text-xs text-(--color-text-secondary)">
                      {{ formatDate(order.createdAt) }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>

        @if (selectedId(); as orderId) {
          <aside
            class="space-y-5 rounded-xl border border-(--color-border) bg-(--color-surface) p-5"
          >
            <header class="flex items-center justify-between">
              <h3 class="font-semibold text-(--color-text)">Order details</h3>
              <button
                type="button"
                (click)="onSelect(null)"
                class="text-(--color-text-muted) hover:text-(--color-text)"
                aria-label="Close detail panel"
              >
                ✕
              </button>
            </header>

            @if (detailLoading()) {
              <p class="py-8 text-center text-sm text-(--color-text-muted)">Loading…</p>
            } @else if (selectedOrder(); as detail) {
              <dl class="space-y-3">
                <div class="flex justify-between text-sm">
                  <dt class="text-(--color-text-secondary)">Order ID</dt>
                  <dd class="font-mono text-xs font-medium text-(--color-text)">
                    {{ truncateId(detail.orderId, 12) }}
                  </dd>
                </div>
                <div class="flex justify-between text-sm">
                  <dt class="text-(--color-text-secondary)">Status</dt>
                  <dd>
                    <span
                      class="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                      [class]="statusBadgeClass(detail.orderStatus)"
                    >
                      {{ formatStatus(detail.orderStatus) }}
                    </span>
                  </dd>
                </div>
                <div class="flex justify-between text-sm">
                  <dt class="text-(--color-text-secondary)">Type</dt>
                  <dd class="capitalize text-(--color-text)">{{ detail.orderType }}</dd>
                </div>
                <div class="flex justify-between text-sm">
                  <dt class="text-(--color-text-secondary)">Payment</dt>
                  <dd class="capitalize text-(--color-text)">
                    {{ detail.paymentMethod ?? 'N/A' }}
                  </dd>
                </div>
                <div class="flex justify-between text-sm">
                  <dt class="text-(--color-text-secondary)">Created</dt>
                  <dd class="text-(--color-text)">{{ formatDateTime(detail.createdAt) }}</dd>
                </div>

                <div class="space-y-2 border-t border-(--color-border) pt-3">
                  <div class="flex justify-between text-sm">
                    <dt class="text-(--color-text-secondary)">Subtotal</dt>
                    <dd class="tabular-nums text-(--color-text)">
                      {{ formatMoney(detail.subtotal) }}
                    </dd>
                  </div>
                  @if (detail.discountTotal > 0) {
                    <div class="flex justify-between text-sm">
                      <dt class="text-(--color-text-secondary)">Discount</dt>
                      <dd class="tabular-nums text-emerald-500">
                        -{{ formatMoney(detail.discountTotal) }}
                      </dd>
                    </div>
                  }
                  <div class="flex justify-between text-sm">
                    <dt class="text-(--color-text-secondary)">Tax</dt>
                    <dd class="tabular-nums text-(--color-text)">
                      {{ formatMoney(detail.taxTotal) }}
                    </dd>
                  </div>
                  <div class="flex justify-between text-sm font-bold">
                    <dt class="text-(--color-text)">Total</dt>
                    <dd class="tabular-nums text-(--color-text)">
                      {{ formatMoney(detail.total) }}
                    </dd>
                  </div>
                </div>

                @if (detail.metrcSyncStatus) {
                  <div class="border-t border-(--color-border) pt-3">
                    <div class="flex justify-between text-sm">
                      <dt class="text-(--color-text-secondary)">Metrc sync</dt>
                      <dd>
                        <span
                          class="rounded-full px-2 py-0.5 text-xs font-medium"
                          [class]="metrcBadgeClass(detail.metrcSyncStatus)"
                        >
                          {{ detail.metrcSyncStatus }}
                        </span>
                      </dd>
                    </div>
                    @if (detail.metrcReceiptId) {
                      <div class="mt-2 flex justify-between text-sm">
                        <dt class="text-(--color-text-secondary)">Receipt ID</dt>
                        <dd class="font-mono text-xs text-(--color-text)">
                          {{ detail.metrcReceiptId }}
                        </dd>
                      </div>
                    }
                  </div>
                }

                @if (detail.notes) {
                  <div class="border-t border-(--color-border) pt-3">
                    <p class="mb-1 text-xs text-(--color-text-secondary)">Notes</p>
                    <p class="text-sm text-(--color-text)">{{ detail.notes }}</p>
                  </div>
                }

                @if (detail.cancellationReason) {
                  <div class="border-t border-(--color-border) pt-3">
                    <p class="mb-1 text-xs text-rose-500">Cancellation reason</p>
                    <p class="text-sm text-rose-400">{{ detail.cancellationReason }}</p>
                  </div>
                }
              </dl>

              @if (canCancel(detail.orderStatus)) {
                <div class="border-t border-(--color-border) pt-3">
                  @if (showCancelDialog()) {
                    <div class="space-y-2">
                      <input
                        type="text"
                        [value]="cancelReason()"
                        (input)="onCancelReasonInput($event)"
                        placeholder="Cancellation reason…"
                        aria-label="Cancellation reason"
                        class="w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-rose-500 focus:outline-none"
                      />
                      <div class="flex gap-2">
                        <button
                          type="button"
                          (click)="onConfirmCancel(detail.orderId)"
                          [disabled]="!cancelReason().trim() || cancelling()"
                          class="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-medium text-white hover:bg-rose-500 disabled:opacity-50"
                        >
                          @if (cancelling()) {
                            Cancelling…
                          } @else {
                            Confirm cancel
                          }
                        </button>
                        <button
                          type="button"
                          (click)="closeCancelDialog()"
                          class="rounded-lg border border-(--color-border) px-3 py-2 text-xs text-(--color-text-secondary) hover:text-(--color-text)"
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  } @else {
                    <button
                      type="button"
                      (click)="openCancelDialog()"
                      class="w-full rounded-lg border border-rose-500/30 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10"
                    >
                      Cancel order
                    </button>
                  }
                </div>
              }
            } @else {
              <p class="py-8 text-center text-sm text-(--color-text-muted)">Order not found</p>
            }
          </aside>
        }
      </div>
    </section>
  `,
})
export class OrdersPage {
  private readonly svc = inject(OrdersService);
  private readonly dashboard = inject(DashboardService);

  protected readonly statusFilters = STATUS_FILTERS;
  protected readonly statusFilter = this.svc.statusFilter;
  protected readonly filteredOrders = this.svc.filteredOrders;
  protected readonly isLoading = this.svc.isLoading;
  protected readonly error = this.svc.error;
  protected readonly selectedId = this.svc.selectedId;
  protected readonly selectedOrder = this.svc.selectedOrder;
  protected readonly detailLoading = this.svc.detailLoading;
  protected readonly cancelling = this.svc.cancelling;

  protected readonly sales = computed(() => this.dashboard.data()?.sales ?? null);

  protected readonly showCancelDialog = signal(false);
  protected readonly cancelReason = signal('');

  protected readonly ordersErrorMessage = computed(() => {
    const err = this.error();
    return err instanceof Error ? err.message : 'Unable to load orders.';
  });

  protected setStatusFilter(status: OrderStatusFilter): void {
    this.svc.setStatusFilter(status);
  }

  protected onSelect(orderId: string | null): void {
    this.svc.select(orderId);
    this.closeCancelDialog();
  }

  protected openCancelDialog(): void {
    this.showCancelDialog.set(true);
  }

  protected closeCancelDialog(): void {
    this.showCancelDialog.set(false);
    this.cancelReason.set('');
  }

  protected onCancelReasonInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.cancelReason.set(value);
  }

  protected async onConfirmCancel(orderId: string): Promise<void> {
    const reason = this.cancelReason().trim();
    if (!reason) return;
    await this.svc.cancel(orderId, reason);
    this.closeCancelDialog();
  }

  protected canCancel(status: string): boolean {
    return !TERMINAL_STATUSES.has(status);
  }

  protected truncateId(orderId: string, length = 8): string {
    return orderId.slice(0, length).toUpperCase();
  }

  protected formatCustomer(order: OrderListItem): string {
    if (!order.customerUserId) return 'Walk-in';
    return order.customerUserId.slice(0, 8) + '…';
  }

  protected formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  protected formatMoney(value: number): string {
    return (
      '$' +
      value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  protected formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString();
  }

  protected formatDateTime(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString();
  }

  protected statusBadgeClass(status: string): string {
    switch (status) {
      case 'completed':
      case 'delivered':
      case 'picked_up':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'confirmed':
      case 'preparing':
      case 'ready_for_pickup':
        return 'bg-sky-500/10 text-sky-500';
      case 'pending':
        return 'bg-amber-500/10 text-amber-500';
      case 'cancelled':
        return 'bg-rose-500/10 text-rose-500';
      default:
        return 'bg-(--color-surface-hover) text-(--color-text-secondary)';
    }
  }

  protected metrcBadgeClass(status: string): string {
    if (status === 'synced') return 'bg-emerald-500/10 text-emerald-500';
    if (status === 'failed') return 'bg-rose-500/10 text-rose-500';
    return 'bg-amber-500/10 text-amber-500';
  }
}
