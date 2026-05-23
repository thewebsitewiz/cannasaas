import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  InventoryTransactionsByDispensaryGQL,
  type InventoryTransactionsByDispensaryQuery,
} from '@cannasaas/ui-ng';
import { map } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';

export type AuditRow =
  InventoryTransactionsByDispensaryQuery['inventoryTransactionsByDispensary'][number];

export interface AuditFilters {
  readonly since: string | null;
  readonly until: string | null;
  readonly transactionType: string | null;
  readonly performedByUserId: string | null;
  readonly limit: number;
  readonly offset: number;
}

const DEFAULT_LIMIT = 50;

const EMPTY_FILTERS: AuditFilters = {
  since: null,
  until: null,
  transactionType: null,
  performedByUserId: null,
  limit: DEFAULT_LIMIT,
  offset: 0,
};

/**
 * Backs `/inventory/audit`. One rxResource, keyed on (dispensary +
 * filter set), driven by a single `filters` signal. Callers patch a
 * filter and the resource refetches.
 */
@Injectable({ providedIn: 'root' })
export class InventoryAuditService {
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);

  private readonly _filters = signal<AuditFilters>(EMPTY_FILTERS);
  readonly filters = this._filters.asReadonly();

  patchFilters(patch: Partial<AuditFilters>): void {
    this._filters.update((f) => ({ ...f, ...patch, offset: patch.offset ?? 0 }));
  }

  setPageOffset(offset: number): void {
    this._filters.update((f) => ({ ...f, offset: Math.max(offset, 0) }));
  }

  reset(): void {
    this._filters.set(EMPTY_FILTERS);
  }

  readonly resource = rxResource({
    params: () => ({
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      ...this._filters(),
    }),
    stream: ({ params }) => {
      if (!params.dispensaryId) {
        throw new Error('No dispensary in scope');
      }
      const gql = this.injector.get(InventoryTransactionsByDispensaryGQL);
      return gql
        .fetch({
          variables: {
            dispensaryId: params.dispensaryId,
            limit: params.limit,
            offset: params.offset,
            since: params.since,
            until: params.until,
            transactionType: params.transactionType,
            performedByUserId: params.performedByUserId,
          },
        })
        .pipe(map((r): readonly AuditRow[] => r.data?.inventoryTransactionsByDispensary ?? []));
    },
  });

  readonly rows = computed<readonly AuditRow[]>(() => this.resource.value() ?? []);
  readonly isLoading = this.resource.isLoading;
  readonly error = this.resource.error;
}
