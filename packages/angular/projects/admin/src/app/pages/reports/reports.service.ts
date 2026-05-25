import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  LaborCostReportGQL,
  type LaborCostReportQuery,
  SalesReportGQL,
  type SalesReportQuery,
  ShrinkageReportGQL,
  type ShrinkageReportQuery,
  TaxReportGQL,
  type TaxReportQuery,
} from '@cannasaas/ui-ng';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';

export type ReportTab = 'sales' | 'tax' | 'staff' | 'inventory';
export type SalesReport = NonNullable<SalesReportQuery['salesReport']>;
export type TaxReport = NonNullable<TaxReportQuery['taxReport']>;
export type LaborCostReport = NonNullable<LaborCostReportQuery['laborCostReport']>;
export type ShrinkageReport = NonNullable<ShrinkageReportQuery['shrinkageReport']>;

function toIso(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}

/**
 * Wraps the four reports queries. Each resource is gated by the
 * active tab so only the currently visible report fetches (matches
 * React's per-tab `enabled` flag pattern). Date range setters drive
 * refetch for every active resource.
 */
@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);

  private readonly today = new Date();
  private readonly monthAgo = new Date(this.today);

  private readonly _tab = signal<ReportTab>('sales');
  private readonly _startDate = signal<string>('');
  private readonly _endDate = signal<string>('');

  readonly tab = this._tab.asReadonly();
  readonly startDate = this._startDate.asReadonly();
  readonly endDate = this._endDate.asReadonly();
  readonly dispensaryId = computed<string | null>(() => this.auth.user()?.dispensaryId ?? null);

  constructor() {
    this.monthAgo.setDate(this.monthAgo.getDate() - 30);
    this._startDate.set(toIso(this.monthAgo));
    this._endDate.set(toIso(this.today));
  }

  setTab(tab: ReportTab): void {
    this._tab.set(tab);
  }

  setStartDate(value: string): void {
    this._startDate.set(value);
  }

  setEndDate(value: string): void {
    this._endDate.set(value);
  }

  readonly salesResource = rxResource({
    params: () => ({
      enabled: this._tab() === 'sales',
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      start: this._startDate(),
      end: this._endDate(),
    }),
    stream: ({ params }) => {
      if (!params.enabled || !params.dispensaryId) {
        return of<SalesReport | null>(null);
      }
      const gql = this.injector.get(SalesReportGQL);
      return gql
        .fetch({
          variables: {
            dispensaryId: params.dispensaryId,
            startDate: params.start,
            endDate: params.end,
          },
        })
        .pipe(map((r): SalesReport | null => r.data?.salesReport ?? null));
    },
  });

  readonly taxResource = rxResource({
    params: () => ({
      enabled: this._tab() === 'tax',
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      start: this._startDate(),
      end: this._endDate(),
    }),
    stream: ({ params }) => {
      if (!params.enabled || !params.dispensaryId) {
        return of<TaxReport | null>(null);
      }
      const gql = this.injector.get(TaxReportGQL);
      return gql
        .fetch({
          variables: {
            dispensaryId: params.dispensaryId,
            startDate: params.start,
            endDate: params.end,
          },
        })
        .pipe(map((r): TaxReport | null => r.data?.taxReport ?? null));
    },
  });

  readonly laborResource = rxResource({
    params: () => ({
      enabled: this._tab() === 'staff',
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      start: this._startDate(),
      end: this._endDate(),
    }),
    stream: ({ params }) => {
      if (!params.enabled || !params.dispensaryId) {
        return of<LaborCostReport | null>(null);
      }
      const gql = this.injector.get(LaborCostReportGQL);
      return gql
        .fetch({
          variables: {
            dispensaryId: params.dispensaryId,
            startDate: params.start,
            endDate: params.end,
          },
        })
        .pipe(map((r): LaborCostReport | null => r.data?.laborCostReport ?? null));
    },
  });

  readonly shrinkageResource = rxResource({
    params: () => ({
      enabled: this._tab() === 'inventory',
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      start: this._startDate(),
      end: this._endDate(),
    }),
    stream: ({ params }) => {
      if (!params.enabled || !params.dispensaryId) {
        return of<ShrinkageReport | null>(null);
      }
      const gql = this.injector.get(ShrinkageReportGQL);
      return gql
        .fetch({
          variables: {
            dispensaryId: params.dispensaryId,
            startDate: params.start,
            endDate: params.end,
          },
        })
        .pipe(map((r): ShrinkageReport | null => r.data?.shrinkageReport ?? null));
    },
  });

  readonly sales = computed<SalesReport | null>(() => this.salesResource.value() ?? null);
  readonly tax = computed<TaxReport | null>(() => this.taxResource.value() ?? null);
  readonly labor = computed<LaborCostReport | null>(() => this.laborResource.value() ?? null);
  readonly shrinkage = computed<ShrinkageReport | null>(
    () => this.shrinkageResource.value() ?? null,
  );

  readonly isLoading = computed(() => {
    switch (this._tab()) {
      case 'sales':
        return this.salesResource.isLoading();
      case 'tax':
        return this.taxResource.isLoading();
      case 'staff':
        return this.laborResource.isLoading();
      case 'inventory':
        return this.shrinkageResource.isLoading();
    }
  });

  readonly error = computed(() => {
    switch (this._tab()) {
      case 'sales':
        return this.salesResource.error();
      case 'tax':
        return this.taxResource.error();
      case 'staff':
        return this.laborResource.error();
      case 'inventory':
        return this.shrinkageResource.error();
    }
  });
}
