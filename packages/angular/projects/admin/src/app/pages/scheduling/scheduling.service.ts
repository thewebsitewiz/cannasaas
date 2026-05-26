import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  type DriverStatsQuery,
  DriverStatsGQL,
  DriversGQL,
  type DriversQuery,
  PublishWeekScheduleGQL,
  ReassignShiftGQL,
  TimeOffRequestsGQL,
  type TimeOffRequestsQuery,
  WeekScheduleGQL,
  type WeekScheduleQuery,
} from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';

export type ScheduledShift = WeekScheduleQuery['weekSchedule'][number];
export type Driver = DriversQuery['drivers'][number];
export type DriverStats = NonNullable<DriverStatsQuery['driverStats']>;
export type TimeOff = TimeOffRequestsQuery['timeOffRequests'][number];

/**
 * Computes the ISO date string for the Monday of the week, offset
 * by `weeks` from today (negative = past, positive = future).
 */
export function getWeekStart(weeks = 0): string {
  const d = new Date();
  const day = d.getDay() || 7; // Sunday → 7
  d.setDate(d.getDate() - day + 1 + weeks * 7);
  return d.toISOString().split('T')[0];
}

@Injectable({ providedIn: 'root' })
export class SchedulingService {
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);

  private readonly _weekOffset = signal<number>(0);
  private readonly _reload = signal<number>(0);
  private readonly _publishing = signal<boolean>(false);
  private readonly _reassignError = signal<string | null>(null);

  readonly weekOffset = this._weekOffset.asReadonly();
  readonly publishing = this._publishing.asReadonly();
  readonly reassignError = this._reassignError.asReadonly();

  readonly weekStart = computed(() => getWeekStart(this._weekOffset()));

  setWeekOffset(offset: number): void {
    this._weekOffset.set(offset);
  }

  shiftWeek(delta: number): void {
    this._weekOffset.update((v) => v + delta);
  }

  resetWeek(): void {
    this._weekOffset.set(0);
  }

  reload(): void {
    this._reload.update((n) => n + 1);
  }

  /**
   * Move an existing shift to a new date and/or profile (sc-686).
   * Backend re-checks conflict + approved time-off; UI just sends the
   * intent and reloads the week so guard rejections surface as toasts.
   */
  async reassignShift(shiftId: string, profileId: string, shiftDate: string): Promise<void> {
    this._reassignError.set(null);
    try {
      const gql = this.injector.get(ReassignShiftGQL);
      await firstValueFrom(gql.mutate({ variables: { shiftId, profileId, shiftDate } }));
      this.reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Reassign failed';
      this._reassignError.set(msg);
    }
  }

  async publishWeek(): Promise<void> {
    const dispensaryId = this.auth.user()?.dispensaryId;
    if (!dispensaryId) return;
    this._publishing.set(true);
    try {
      const gql = this.injector.get(PublishWeekScheduleGQL);
      await firstValueFrom(
        gql.mutate({ variables: { dispensaryId, weekStart: this.weekStart() } }),
      );
      this.reload();
    } finally {
      this._publishing.set(false);
    }
  }

  readonly shiftsResource = rxResource({
    params: () => ({
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      weekStart: this.weekStart(),
      reload: this._reload(),
    }),
    stream: ({ params }) => {
      if (!params.dispensaryId) {
        throw new Error('No dispensary in scope');
      }
      const gql = this.injector.get(WeekScheduleGQL);
      return gql
        .fetch({
          variables: { dispensaryId: params.dispensaryId, weekStart: params.weekStart },
        })
        .pipe(map((r): readonly ScheduledShift[] => r.data?.weekSchedule ?? []));
    },
  });

  readonly driversResource = rxResource({
    params: () => ({ dispensaryId: this.auth.user()?.dispensaryId ?? null }),
    stream: ({ params }) => {
      if (!params.dispensaryId) {
        throw new Error('No dispensary in scope');
      }
      const gql = this.injector.get(DriversGQL);
      return gql
        .fetch({ variables: { dispensaryId: params.dispensaryId } })
        .pipe(map((r): readonly Driver[] => r.data?.drivers ?? []));
    },
  });

  readonly driverStatsResource = rxResource({
    params: () => ({ dispensaryId: this.auth.user()?.dispensaryId ?? null }),
    stream: ({ params }) => {
      if (!params.dispensaryId) {
        throw new Error('No dispensary in scope');
      }
      const gql = this.injector.get(DriverStatsGQL);
      return gql
        .fetch({ variables: { dispensaryId: params.dispensaryId } })
        .pipe(map((r): DriverStats | null => r.data?.driverStats ?? null));
    },
  });

  readonly timeOffResource = rxResource({
    params: () => ({
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      reload: this._reload(),
    }),
    stream: ({ params }) => {
      if (!params.dispensaryId) {
        throw new Error('No dispensary in scope');
      }
      const gql = this.injector.get(TimeOffRequestsGQL);
      return gql
        .fetch({ variables: { dispensaryId: params.dispensaryId } })
        .pipe(map((r): readonly TimeOff[] => r.data?.timeOffRequests ?? []));
    },
  });

  readonly shifts = computed<readonly ScheduledShift[]>(() => this.shiftsResource.value() ?? []);
  readonly drivers = computed<readonly Driver[]>(() => this.driversResource.value() ?? []);
  readonly driverStats = computed<DriverStats | null>(
    () => this.driverStatsResource.value() ?? null,
  );
  readonly timeOff = computed<readonly TimeOff[]>(() => this.timeOffResource.value() ?? []);

  readonly isLoading = this.shiftsResource.isLoading;
  readonly error = this.shiftsResource.error;
}
