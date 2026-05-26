import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  FailedMetrcSyncsGQL,
  type FailedMetrcSyncsQuery,
  RetryMetrcSyncGQL,
} from '@cannasaas/ui-ng';
import { firstValueFrom, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';

export type FailedSyncDashboard = NonNullable<FailedMetrcSyncsQuery['failedMetrcSyncs']>;
export type FailedSyncItem = FailedSyncDashboard['items'][number];

/**
 * Failed-sync dashboard + per-row retry (sc-684). The KPI counts on
 * the Compliance page come from the `dashboard` query (sc-624) — this
 * service only owns the failed-rows list + retry mutation.
 */
@Injectable({ providedIn: 'root' })
export class ComplianceService {
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);

  private readonly _reload = signal<number>(0);
  /** Set of orderIds currently in-flight for retry. */
  private readonly _retrying = signal<ReadonlySet<string>>(new Set());

  readonly retrying = this._retrying.asReadonly();

  readonly failedSyncsResource = rxResource({
    params: () => ({
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      reload: this._reload(),
    }),
    stream: ({ params }) => {
      if (!params.dispensaryId) {
        return of<FailedSyncDashboard | null>(null);
      }
      const gql = this.injector.get(FailedMetrcSyncsGQL);
      return gql
        .fetch({ variables: { dispensaryId: params.dispensaryId } })
        .pipe(map((r): FailedSyncDashboard | null => r.data?.failedMetrcSyncs ?? null));
    },
  });

  readonly failedSyncs = computed<FailedSyncDashboard | null>(
    () => this.failedSyncsResource.value() ?? null,
  );
  readonly failedSyncsLoading = this.failedSyncsResource.isLoading;
  readonly failedSyncsError = this.failedSyncsResource.error;

  reload(): void {
    this._reload.update((n) => n + 1);
  }

  isRetrying(orderId: string): boolean {
    return this._retrying().has(orderId);
  }

  async retry(orderId: string): Promise<void> {
    const dispensaryId = this.auth.user()?.dispensaryId;
    if (!dispensaryId) return;
    this._retrying.update((prev) => {
      const next = new Set(prev);
      next.add(orderId);
      return next;
    });
    try {
      const gql = this.injector.get(RetryMetrcSyncGQL);
      await firstValueFrom(gql.mutate({ variables: { orderId, dispensaryId } }));
      this.reload();
    } finally {
      this._retrying.update((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  }
}
