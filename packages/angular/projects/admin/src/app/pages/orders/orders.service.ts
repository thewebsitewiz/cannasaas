import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  CancelOrderGQL,
  OrderGQL,
  type OrderQuery,
  OrdersGQL,
  type OrdersQuery,
} from '@cannasaas/ui-ng';
import { firstValueFrom, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';

export type OrderListItem = OrdersQuery['orders'][number];
export type OrderDetail = NonNullable<OrderQuery['order']>;
export type OrderStatusFilter =
  | 'all'
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled';

const ORDERS_PAGE_LIMIT = 100;

/**
 * List + detail + cancel for the admin OrdersPage. Mirrors the React
 * page's data flow: paginated list, a single in-flight detail keyed
 * by `selectedId`, and a cancel mutation that bumps the reload
 * counter so both list and detail refetch.
 */
@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);

  private readonly _statusFilter = signal<OrderStatusFilter>('all');
  private readonly _selectedId = signal<string | null>(null);
  private readonly _reload = signal<number>(0);
  private readonly _cancelling = signal<boolean>(false);

  readonly statusFilter = this._statusFilter.asReadonly();
  readonly selectedId = this._selectedId.asReadonly();
  readonly cancelling = this._cancelling.asReadonly();

  setStatusFilter(status: OrderStatusFilter): void {
    this._statusFilter.set(status);
  }

  select(orderId: string | null): void {
    this._selectedId.set(orderId);
  }

  reload(): void {
    this._reload.update((n) => n + 1);
  }

  async cancel(orderId: string, reason: string): Promise<void> {
    this._cancelling.set(true);
    try {
      const gql = this.injector.get(CancelOrderGQL);
      const dispensaryId = this.auth.user()?.dispensaryId ?? null;
      await firstValueFrom(gql.mutate({ variables: { orderId, reason, dispensaryId } }));
      this.reload();
    } finally {
      this._cancelling.set(false);
    }
  }

  readonly ordersResource = rxResource({
    params: () => ({
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      reload: this._reload(),
    }),
    stream: ({ params }) => {
      if (!params.dispensaryId) {
        throw new Error('No dispensary in scope');
      }
      const gql = this.injector.get(OrdersGQL);
      return gql
        .fetch({
          variables: {
            dispensaryId: params.dispensaryId,
            limit: ORDERS_PAGE_LIMIT,
            offset: 0,
          },
        })
        .pipe(map((r): readonly OrderListItem[] => r.data?.orders ?? []));
    },
  });

  readonly allOrders = computed<readonly OrderListItem[]>(() => this.ordersResource.value() ?? []);

  readonly filteredOrders = computed<readonly OrderListItem[]>(() => {
    const filter = this._statusFilter();
    const all = this.allOrders();
    return filter === 'all' ? all : all.filter((o) => o.orderStatus === filter);
  });

  readonly isLoading = this.ordersResource.isLoading;
  readonly error = this.ordersResource.error;

  readonly detailResource = rxResource({
    params: () => ({
      orderId: this._selectedId(),
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      reload: this._reload(),
    }),
    stream: ({ params }) => {
      if (!params.orderId) {
        return of<OrderDetail | null>(null);
      }
      const gql = this.injector.get(OrderGQL);
      return gql
        .fetch({
          variables: { orderId: params.orderId, dispensaryId: params.dispensaryId },
        })
        .pipe(map((r): OrderDetail | null => r.data?.order ?? null));
    },
  });

  readonly selectedOrder = computed<OrderDetail | null>(() => this.detailResource.value() ?? null);
  readonly detailLoading = this.detailResource.isLoading;
}
