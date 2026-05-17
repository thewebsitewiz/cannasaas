import { ChangeDetectionStrategy, Component, computed, inject, resource } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MyOrdersGQL, MyOrdersQuery } from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';

type OrderRow = MyOrdersQuery['myOrders']['orders'][number];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-sky-100 text-sky-700',
  preparing: 'bg-indigo-100 text-indigo-700',
  ready: 'bg-emerald-100 text-emerald-700',
  out_for_delivery: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-stone-100 text-stone-700',
  cancelled: 'bg-rose-100 text-rose-700',
  in_store: 'bg-stone-100 text-stone-700',
};

@Component({
  selector: 'cs-orders-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, DecimalPipe],
  template: `
    <div class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="font-display text-2xl font-bold text-stone-900">Order History</h1>
          @if (total() > 0) {
            <p class="text-sm text-stone-500">{{ total() }} {{ total() === 1 ? 'order' : 'orders' }}</p>
          }
        </div>
        <a
          class="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
          [routerLink]="['/account']"
        >
          Back to Account
        </a>
      </div>

      @if (!isAuthenticated()) {
        <div class="rounded-2xl border border-stone-200 bg-white p-8 text-center">
          <p class="mb-4 text-stone-500">Sign in to view your orders.</p>
          <a
            class="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            [routerLink]="['/login']"
            [queryParams]="{ redirect: '/orders' }"
          >
            Sign In
          </a>
        </div>
      } @else if (loading()) {
        <p class="py-12 text-center text-stone-500">Loading orders…</p>
      } @else if (errorMessage(); as msg) {
        <div
          class="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          role="alert"
        >
          {{ msg }}
        </div>
      } @else if (orders().length === 0) {
        <div class="rounded-2xl border border-stone-200 bg-white p-8 text-center">
          <svg
            class="mx-auto mb-3 h-10 w-10 text-stone-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
          >
            <path
              d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
            />
          </svg>
          <p class="mb-3 text-stone-500">You haven't placed any orders yet.</p>
          <a
            class="text-sm font-semibold text-emerald-700 hover:underline"
            [routerLink]="['/products']"
          >
            Browse Menu
          </a>
        </div>
      } @else {
        <ul class="space-y-3">
          @for (order of orders(); track order.orderId) {
            <li>
              <a
                class="block rounded-2xl border border-stone-200 bg-white p-5 transition-colors hover:bg-stone-50"
                [routerLink]="['/orders', order.orderId]"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span
                        class="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                        [class]="statusClass(order.orderStatus)"
                      >
                        {{ order.orderStatus.replace('_', ' ') }}
                      </span>
                      <span class="text-xs uppercase tracking-wide text-stone-400">
                        {{ order.orderType }}
                      </span>
                    </div>
                    <p class="mt-2 truncate text-sm text-stone-900">
                      Order #{{ order.orderId.slice(0, 8) }}
                    </p>
                    <p class="text-xs text-stone-400">
                      {{ order.createdAt | date: 'MMM d, y · h:mm a' }}
                      @if (order.itemCount; as count) {
                        · {{ count }} {{ count === 1 ? 'item' : 'items' }}
                      }
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="font-semibold tabular-nums text-stone-900">
                      \${{ order.total | number: '1.2-2' }}
                    </p>
                    <p class="mt-1 text-xs text-emerald-700">View →</p>
                  </div>
                </div>
              </a>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class OrdersListPage {
  private readonly auth = inject(AuthService);
  private readonly myOrdersGQL = inject(MyOrdersGQL);

  protected readonly isAuthenticated = this.auth.isAuthenticated;

  private readonly ordersResource = resource<
    { orders: readonly OrderRow[]; total: number },
    { isAuthenticated: boolean }
  >({
    params: () => ({ isAuthenticated: this.isAuthenticated() }),
    loader: async ({ params }) => {
      if (!params.isAuthenticated) return { orders: [], total: 0 };
      const result = await firstValueFrom(
        this.myOrdersGQL.fetch({ variables: { limit: 50, offset: 0 } }),
      );
      const data = result.data?.myOrders;
      return { orders: data?.orders ?? [], total: data?.total ?? 0 };
    },
  });

  protected readonly orders = computed(() => this.ordersResource.value()?.orders ?? []);
  protected readonly total = computed(() => this.ordersResource.value()?.total ?? 0);
  protected readonly loading = this.ordersResource.isLoading;
  protected readonly errorMessage = computed(() => {
    const err = this.ordersResource.error();
    if (!err) return null;
    return err instanceof Error ? err.message : 'Failed to load orders';
  });

  protected statusClass(status: string): string {
    return STATUS_COLORS[status] ?? 'bg-stone-100 text-stone-700';
  }
}
