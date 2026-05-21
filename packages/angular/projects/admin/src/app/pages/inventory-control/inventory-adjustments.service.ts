import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  ApproveAdjustmentGQL,
  InventoryAdjustmentsGQL,
  type InventoryAdjustmentsQuery,
} from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';

export type InventoryAdjustment = InventoryAdjustmentsQuery['inventoryAdjustments'][number];

/**
 * Wraps `InventoryAdjustmentsGQL` + `ApproveAdjustmentGQL` for the
 * Adjustments tab. Read-only log keyed by `(dispensaryId, limit)`;
 * `approve()` mutates and triggers a refetch by bumping a reload
 * counter that the request signal reads.
 */
@Injectable({ providedIn: 'root' })
export class InventoryAdjustmentsService {
  private readonly auth = inject(AuthService);
  /** Lazy — eager inject would cycle through provideApollo. */
  private readonly injector = inject(Injector);

  private readonly _limit = signal<number>(50);
  private readonly _reload = signal<number>(0);
  private readonly _approving = signal<string | null>(null);

  readonly limit = this._limit.asReadonly();
  readonly approvingId = this._approving.asReadonly();

  setLimit(limit: number): void {
    this._limit.set(limit);
  }

  reload(): void {
    this._reload.update((n) => n + 1);
  }

  async approve(adjustmentId: string): Promise<void> {
    this._approving.set(adjustmentId);
    try {
      const gql = this.injector.get(ApproveAdjustmentGQL);
      await firstValueFrom(gql.mutate({ variables: { adjustmentId } }));
      this.reload();
    } finally {
      this._approving.set(null);
    }
  }

  readonly resource = rxResource({
    params: () => ({
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      limit: this._limit(),
      reload: this._reload(),
    }),
    stream: ({ params }) => {
      if (!params.dispensaryId) {
        throw new Error('No dispensary in scope');
      }
      const gql = this.injector.get(InventoryAdjustmentsGQL);
      return gql
        .fetch({
          variables: { dispensaryId: params.dispensaryId, limit: params.limit },
        })
        .pipe(map((r) => r.data?.inventoryAdjustments ?? []));
    },
  });

  readonly adjustments = computed(() => this.resource.value() ?? []);
  readonly isLoading = this.resource.isLoading;
  readonly error = this.resource.error;
}
