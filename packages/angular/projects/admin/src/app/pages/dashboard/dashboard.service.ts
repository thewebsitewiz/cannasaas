import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DashboardGQL, type DashboardQuery, SetReorderThresholdGQL } from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';

export type Dashboard = NonNullable<DashboardQuery['dashboard']>;

/**
 * Wraps `DashboardGQL` in an `rxResource` keyed by `(dispensaryId, days)`.
 * Components consume `data() / isLoading() / error()` as signals; the
 * service handles the cache + reactive refetch when the day window
 * changes (`setDays(days)`).
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly auth = inject(AuthService);
  /** Lazy — eager inject would cycle through provideApollo via AuthService. */
  private readonly injector = inject(Injector);

  private readonly _days = signal<number>(30);
  private readonly _reload = signal<number>(0);
  private readonly _savingThresholdFor = signal<string | null>(null);

  readonly days = this._days.asReadonly();
  readonly savingThresholdFor = this._savingThresholdFor.asReadonly();

  setDays(days: number): void {
    this._days.set(days);
  }

  reload(): void {
    this._reload.update((n) => n + 1);
  }

  readonly resource = rxResource({
    params: () => ({
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      days: this._days(),
      reload: this._reload(),
    }),
    stream: ({ params }) =>
      this.injector
        .get(DashboardGQL)
        .fetch({
          variables: { dispensaryId: params.dispensaryId, days: params.days },
        })
        .pipe(map((r) => r.data?.dashboard ?? null)),
  });

  readonly data = computed(() => this.resource.value() ?? null);
  readonly isLoading = this.resource.isLoading;
  readonly error = this.resource.error;

  async setReorderThreshold(inventoryId: string, value: number | null): Promise<void> {
    this._savingThresholdFor.set(inventoryId);
    try {
      const gql = this.injector.get(SetReorderThresholdGQL);
      await firstValueFrom(gql.mutate({ variables: { inventoryId, value } }));
      this.reload();
    } finally {
      this._savingThresholdFor.set(null);
    }
  }
}
