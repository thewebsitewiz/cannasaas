import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import {
  CompleteOrderGQL,
  ConfirmOrderGQL,
  MarkOrderReadyGQL,
  OrdersGQL,
  StartPreparingOrderGQL,
} from '@cannasaas/ui-ng';
import { AuthService } from '../../core/auth/auth.service';

interface OrderRow {
  readonly orderId: string;
  readonly orderType: string;
  readonly orderStatus: string;
  readonly total: number;
  readonly createdAt: string;
}

type LaneStatus = 'pending' | 'confirmed' | 'preparing' | 'ready';

interface LaneConfig {
  readonly status: LaneStatus;
  readonly label: string;
  readonly nextLabel: string;
}

const LANES: readonly LaneConfig[] = [
  { status: 'pending', label: 'Pending', nextLabel: 'Confirm' },
  { status: 'confirmed', label: 'Confirmed', nextLabel: 'Start Prep' },
  { status: 'preparing', label: 'Preparing', nextLabel: 'Mark Ready' },
  { status: 'ready', label: 'Ready', nextLabel: 'Complete' },
];

const POLL_MS = 10_000;

@Component({
  selector: 'cs-order-queue-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold">Order Queue</h1>
      <span class="text-xs text-(--color-text-muted)">
        Auto-refreshes every {{ pollSeconds }}s
      </span>
    </header>

    <section class="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold">Active Orders</h2>
        <span class="text-xs text-(--color-text-muted)"> {{ orders().length }} orders loaded </span>
      </div>

      @if (loading() && orders().length === 0) {
        <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
          @for (lane of lanes; track lane.status) {
            <div class="animate-pulse rounded-lg border border-(--color-border) p-4">
              <div class="mb-3 h-4 w-20 rounded bg-(--color-surface-alt)"></div>
              <div class="h-16 rounded bg-(--color-surface-alt)"></div>
            </div>
          }
        </div>
      } @else {
        <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
          @for (lane of lanes; track lane.status) {
            @let laneOrders = ordersByStatus()[lane.status];
            <div class="rounded-lg border border-(--color-border)">
              <header
                class="flex items-center justify-between rounded-t-lg border-b border-(--color-border) bg-(--color-surface-alt) px-4 py-3"
              >
                <h3 class="text-sm font-semibold">{{ lane.label }}</h3>
                <span
                  class="rounded-full bg-(--color-bg) px-2 py-0.5 text-xs font-medium text-(--color-text-muted)"
                >
                  {{ laneOrders.length }}
                </span>
              </header>
              <ul class="max-h-[480px] space-y-2 overflow-y-auto p-3">
                @for (order of laneOrders; track order.orderId) {
                  <li class="rounded-lg border border-(--color-border) bg-(--color-bg) p-3">
                    <div class="mb-1.5 flex items-center justify-between">
                      <span class="font-mono text-xs font-bold">
                        #{{ order.orderId.slice(0, 8).toUpperCase() }}
                      </span>
                      <span class="text-[10px] text-(--color-text-muted)">
                        {{ minutesAgo(order.createdAt) }}
                      </span>
                    </div>
                    <div class="mb-2 flex items-center justify-between">
                      <span class="text-xs capitalize text-(--color-text-muted)">
                        {{ order.orderType }}
                      </span>
                      <span class="text-sm font-bold tabular-nums">
                        \${{ order.total.toFixed(2) }}
                      </span>
                    </div>
                    <p class="mb-2 text-[10px] text-(--color-text-muted)">
                      {{ formatTime(order.createdAt) }}
                    </p>
                    <button
                      type="button"
                      class="min-h-9 w-full rounded-md border border-(--color-border) bg-(--color-surface) py-2 text-xs font-semibold hover:bg-(--color-surface-hover) disabled:cursor-not-allowed disabled:opacity-50"
                      [disabled]="advancing()"
                      (click)="advance(order, lane.status)"
                    >
                      @if (advancing()) {
                        Updating…
                      } @else {
                        {{ lane.nextLabel }}
                      }
                    </button>
                  </li>
                } @empty {
                  <li class="py-6 text-center text-xs text-(--color-text-muted)">No orders</li>
                }
              </ul>
            </div>
          }
        </div>
      }

      @if (errorMessage(); as err) {
        <p class="mt-3 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {{ err }}
        </p>
      }
    </section>
  `,
})
export class OrderQueuePage {
  private readonly auth = inject(AuthService);
  private readonly ordersGQL = inject(OrdersGQL);
  private readonly confirmGQL = inject(ConfirmOrderGQL);
  private readonly startPreparingGQL = inject(StartPreparingOrderGQL);
  private readonly markReadyGQL = inject(MarkOrderReadyGQL);
  private readonly completeGQL = inject(CompleteOrderGQL);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly lanes = LANES;
  protected readonly pollSeconds = POLL_MS / 1000;

  protected readonly orders = signal<readonly OrderRow[]>([]);
  protected readonly loading = signal(true);
  protected readonly advancing = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private readonly dispensaryId = computed(() => this.auth.user()?.dispensaryId ?? null);

  protected readonly ordersByStatus = computed<Readonly<Record<LaneStatus, readonly OrderRow[]>>>(
    () => {
      const grouped: Record<LaneStatus, OrderRow[]> = {
        pending: [],
        confirmed: [],
        preparing: [],
        ready: [],
      };
      for (const order of this.orders()) {
        if (isLaneStatus(order.orderStatus)) {
          grouped[order.orderStatus].push(order);
        }
      }
      return grouped;
    },
  );

  constructor() {
    effect(() => {
      const id = this.dispensaryId();
      if (id) void this.loadOrders(id);
    });

    interval(POLL_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const id = this.dispensaryId();
        if (id) void this.loadOrders(id);
      });
  }

  private async loadOrders(dispensaryId: string): Promise<void> {
    try {
      const result = await this.ordersGQL
        .fetch({
          variables: { dispensaryId, limit: 100, offset: 0 },
          fetchPolicy: 'network-only',
        })
        .toPromise();
      const rows = (result?.data?.orders ?? []) as Array<
        OrderRow & { total: number | string; createdAt: string }
      >;
      this.orders.set(
        rows.map((r) => ({
          orderId: r.orderId,
          orderType: r.orderType,
          orderStatus: r.orderStatus,
          total: Number(r.total),
          createdAt: r.createdAt,
        })),
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load orders';
      this.errorMessage.set(message);
    } finally {
      this.loading.set(false);
    }
  }

  protected formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  protected minutesAgo(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
  }

  protected async advance(order: OrderRow, status: LaneStatus): Promise<void> {
    const id = this.dispensaryId();
    if (!id || this.advancing()) return;
    this.advancing.set(true);
    this.errorMessage.set(null);
    try {
      switch (status) {
        case 'pending':
          await this.confirmGQL
            .mutate({ variables: { orderId: order.orderId, dispensaryId: id } })
            .toPromise();
          break;
        case 'confirmed':
          await this.startPreparingGQL
            .mutate({ variables: { orderId: order.orderId, dispensaryId: id } })
            .toPromise();
          break;
        case 'preparing':
          await this.markReadyGQL
            .mutate({ variables: { orderId: order.orderId, dispensaryId: id } })
            .toPromise();
          break;
        case 'ready':
          await this.completeGQL
            .mutate({ variables: { orderId: order.orderId, dispensaryId: id } })
            .toPromise();
          break;
      }
      await this.loadOrders(id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update order status';
      this.errorMessage.set(message);
    } finally {
      this.advancing.set(false);
    }
  }
}

function isLaneStatus(value: string): value is LaneStatus {
  return value === 'pending' || value === 'confirmed' || value === 'preparing' || value === 'ready';
}
