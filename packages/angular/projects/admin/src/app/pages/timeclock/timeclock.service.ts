import { DestroyRef, Injectable, Injector, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  ActiveClocksGQL,
  type ActiveClocksQuery,
  PayrollReportGQL,
  type PayrollReportQuery,
} from '@cannasaas/ui-ng';
import { map } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';

export type ActiveClock = ActiveClocksQuery['activeClocks'][number];
export type PayrollRow = PayrollReportQuery['payrollReport'][number];

const ACTIVE_CLOCKS_REFETCH_INTERVAL_MS = 30_000;

function toIsoDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}

/**
 * TimeClock data — active clocks (auto-refresh every 30s) + payroll
 * report (keyed by the dispensary's selected date range). Matches
 * the React parity polling cadence so admins see who's on the floor
 * without manual refresh.
 */
@Injectable({ providedIn: 'root' })
export class TimeclockService {
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  private readonly today = new Date();
  private readonly twoWeeksAgo = new Date(this.today);

  private readonly _startDate = signal<string>('');
  private readonly _endDate = signal<string>('');
  private readonly _activeTick = signal<number>(0);

  readonly startDate = this._startDate.asReadonly();
  readonly endDate = this._endDate.asReadonly();

  constructor() {
    this.twoWeeksAgo.setDate(this.twoWeeksAgo.getDate() - 14);
    this._startDate.set(toIsoDate(this.twoWeeksAgo));
    this._endDate.set(toIsoDate(this.today));

    const id = setInterval(
      () => this._activeTick.update((n) => n + 1),
      ACTIVE_CLOCKS_REFETCH_INTERVAL_MS,
    );
    this.destroyRef.onDestroy(() => clearInterval(id));
  }

  setStartDate(value: string): void {
    this._startDate.set(value);
  }

  setEndDate(value: string): void {
    this._endDate.set(value);
  }

  readonly activeClocksResource = rxResource({
    params: () => ({
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      tick: this._activeTick(),
    }),
    stream: ({ params }) => {
      if (!params.dispensaryId) {
        throw new Error('No dispensary in scope');
      }
      const gql = this.injector.get(ActiveClocksGQL);
      return gql
        .fetch({ variables: { dispensaryId: params.dispensaryId } })
        .pipe(map((r): readonly ActiveClock[] => r.data?.activeClocks ?? []));
    },
  });

  readonly payrollResource = rxResource({
    params: () => ({
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      startDate: this._startDate(),
      endDate: this._endDate(),
    }),
    stream: ({ params }) => {
      if (!params.dispensaryId || !params.startDate || !params.endDate) {
        throw new Error('Missing dispensary or date range');
      }
      const gql = this.injector.get(PayrollReportGQL);
      return gql
        .fetch({
          variables: {
            dispensaryId: params.dispensaryId,
            startDate: params.startDate,
            endDate: params.endDate,
          },
        })
        .pipe(map((r): readonly PayrollRow[] => r.data?.payrollReport ?? []));
    },
  });

  readonly activeClocks = computed<readonly ActiveClock[]>(
    () => this.activeClocksResource.value() ?? [],
  );
  readonly payroll = computed<readonly PayrollRow[]>(() => this.payrollResource.value() ?? []);

  readonly payrollLoading = this.payrollResource.isLoading;
  readonly payrollError = this.payrollResource.error;
}
