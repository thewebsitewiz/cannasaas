import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { AuthService } from '../../core/auth/auth.service';
import { CsvDownloadService } from '../../core/csv/csv-download.service';
import { TimeclockService, type PayrollRow } from './timeclock.service';

/**
 * Time Clock & Payroll admin view. Mirrors React parity:
 * - "Currently on the clock" grid that polls every 30s (handled in
 *   the service via setInterval bumping the resource's `tick` signal).
 * - Payroll report keyed by a date range with summary KPIs + table.
 *
 * Filed scope mentioned a day-grid timeline view + manager correction
 * flow (edit start/end timestamps with audit reason). The React admin
 * surfaces neither — corrections happen elsewhere. File a follow-up
 * if an admin correction workflow is needed; the schema has
 * `approveTimeEntry` / `correctTimeEntry` ops available.
 *
 * CSV export is intentionally **deferred** — the React UX hits a REST
 * endpoint (`/v1/payroll/export`) with custom Authorization +
 * `x-dispensary-id` headers, which doesn't fit the Apollo client
 * cleanly. File a follow-up if export becomes a workflow need; for
 * now admins can copy from the rendered table.
 */
@Component({
  selector: 'cs-timeclock-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-6">
      <h1 class="text-2xl font-bold text-(--color-text)">Time clock &amp; payroll</h1>

      <!-- Currently on the clock -->
      <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
        <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-(--color-text)">
          <span class="text-emerald-500" aria-hidden="true">●</span>
          Currently on the clock
          <span class="ml-2 text-xs font-normal text-(--color-text-muted)">
            Auto-refreshes every 30s
          </span>
        </h2>
        @if (activeClocks().length === 0) {
          <p class="text-sm text-(--color-text-muted)">No one currently clocked in</p>
        } @else {
          <ul class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            @for (c of activeClocks(); track c.entryId) {
              <li
                class="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"
              >
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-500"
                  aria-hidden="true"
                >
                  {{ initials(c.firstName, c.lastName) }}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-(--color-text)">
                    {{ c.firstName }} {{ c.lastName }}
                  </p>
                  <p class="text-xs text-(--color-text-secondary)">
                    {{ c.positionName ?? '—' }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-lg font-bold text-emerald-500 tabular-nums">
                    {{ c.hoursSoFar.toFixed(1) }}h
                  </p>
                </div>
              </li>
            }
          </ul>
        }
      </div>

      <!-- Payroll report -->
      <div class="overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface)">
        <header
          class="flex flex-wrap items-center justify-between gap-3 border-b border-(--color-border) px-6 py-4"
        >
          <h2 class="flex items-center gap-2 text-lg font-semibold text-(--color-text)">
            <span aria-hidden="true">$</span> Payroll report
          </h2>
          <div class="flex items-center gap-2 text-sm">
            <input
              type="date"
              [value]="startDate()"
              (change)="onStartDate($event)"
              aria-label="Start date"
              class="rounded-lg border border-(--color-border) bg-(--color-bg) px-2 py-1 text-sm text-(--color-text)"
            />
            <span class="text-(--color-text-muted)">to</span>
            <input
              type="date"
              [value]="endDate()"
              (change)="onEndDate($event)"
              aria-label="End date"
              class="rounded-lg border border-(--color-border) bg-(--color-bg) px-2 py-1 text-sm text-(--color-text)"
            />
            <button
              type="button"
              (click)="onDownloadCsv()"
              [disabled]="downloading()"
              aria-label="Download payroll as CSV"
              class="rounded-lg border border-(--color-border) px-3 py-1 text-sm text-(--color-text) hover:text-(--color-primary) disabled:opacity-50"
            >
              @if (downloading()) {
                Downloading…
              } @else {
                Download CSV
              }
            </button>
          </div>
        </header>

        <!-- Summary KPIs -->
        <div class="grid grid-cols-4 border-b border-(--color-border)">
          <div class="border-r border-(--color-border) p-4 text-center">
            <p class="text-xl font-bold text-(--color-text) tabular-nums">
              {{ payroll().length }}
            </p>
            <p class="text-xs text-(--color-text-secondary)">Employees</p>
          </div>
          <div class="border-r border-(--color-border) p-4 text-center">
            <p class="text-xl font-bold text-(--color-text) tabular-nums">
              {{ totalHoursLabel() }}
            </p>
            <p class="text-xs text-(--color-text-secondary)">Total hours</p>
          </div>
          <div class="border-r border-(--color-border) p-4 text-center">
            <p class="text-xl font-bold text-amber-500 tabular-nums">
              {{ totalOtLabel() }}
            </p>
            <p class="text-xs text-(--color-text-secondary)">OT hours</p>
          </div>
          <div class="p-4 text-center">
            <p class="text-xl font-bold text-(--color-primary) tabular-nums">
              {{ totalGrossLabel() }}
            </p>
            <p class="text-xs text-(--color-text-secondary)">Gross pay</p>
          </div>
        </div>

        @if (payrollLoading()) {
          <p class="p-8 text-center text-sm text-(--color-text-muted)">Loading payroll…</p>
        } @else if (payrollError(); as err) {
          <div class="p-6 text-rose-300" role="alert">
            <h3 class="font-semibold">Failed to load payroll</h3>
            <p class="mt-1 text-sm">{{ payrollErrorMessage() }}</p>
          </div>
        } @else if (payroll().length === 0) {
          <p class="p-8 text-center text-sm text-(--color-text-muted)">
            No payroll data for this period
          </p>
        } @else {
          <table class="w-full text-sm">
            <thead class="border-b border-(--color-border) bg-(--color-bg)">
              <tr>
                <th class="px-4 py-2 text-left font-medium text-(--color-text-secondary)">
                  Employee
                </th>
                <th class="px-4 py-2 text-left font-medium text-(--color-text-secondary)">
                  Position
                </th>
                <th class="px-4 py-2 text-right font-medium text-(--color-text-secondary)">Rate</th>
                <th class="px-4 py-2 text-right font-medium text-(--color-text-secondary)">
                  Hours
                </th>
                <th class="px-4 py-2 text-right font-medium text-(--color-text-secondary)">OT</th>
                <th class="px-4 py-2 text-right font-medium text-(--color-text-secondary)">
                  Shifts
                </th>
                <th class="px-4 py-2 text-right font-medium text-(--color-text-secondary)">
                  Gross pay
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-(--color-border)">
              @for (r of payroll(); track rowKey(r); let i = $index) {
                <tr [class.bg-(--color-bg)]="r.isExempt">
                  <td class="px-4 py-3">
                    <p class="font-medium text-(--color-text)">
                      {{ r.firstName }} {{ r.lastName }}
                    </p>
                    @if (r.employeeNumber) {
                      <p class="text-xs text-(--color-text-muted)">{{ r.employeeNumber }}</p>
                    }
                  </td>
                  <td class="px-4 py-3 text-(--color-text-secondary)">
                    {{ r.positionName ?? '—' }}
                    @if (r.isExempt) {
                      <span class="ml-1 text-xs text-(--color-text-muted)">(exempt)</span>
                    }
                  </td>
                  <td class="px-4 py-3 text-right tabular-nums text-(--color-text)">
                    {{ rateLabel(r.hourlyRate) }}
                  </td>
                  <td class="px-4 py-3 text-right font-medium tabular-nums text-(--color-text)">
                    {{ r.totalHours.toFixed(1) }}
                  </td>
                  <td
                    class="px-4 py-3 text-right tabular-nums"
                    [class]="
                      r.overtimeHours > 0
                        ? 'font-semibold text-amber-500'
                        : 'text-(--color-text-muted)'
                    "
                  >
                    {{ r.overtimeHours > 0 ? r.overtimeHours.toFixed(1) : '—' }}
                  </td>
                  <td class="px-4 py-3 text-right tabular-nums text-(--color-text)">
                    {{ r.shiftsWorked }}
                  </td>
                  <td class="px-4 py-3 text-right font-semibold tabular-nums text-(--color-text)">
                    {{ grossPayLabel(r) }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </section>
  `,
})
export class TimeclockPage {
  private readonly svc = inject(TimeclockService);
  private readonly auth = inject(AuthService);
  private readonly csv = inject(CsvDownloadService);

  protected readonly activeClocks = this.svc.activeClocks;
  protected readonly payroll = this.svc.payroll;
  protected readonly payrollLoading = this.svc.payrollLoading;
  protected readonly payrollError = this.svc.payrollError;
  protected readonly startDate = this.svc.startDate;
  protected readonly endDate = this.svc.endDate;
  protected readonly downloading = computed(() => this.csv.downloading() !== null);

  protected readonly payrollErrorMessage = computed(() => {
    const err = this.payrollError();
    return err instanceof Error ? err.message : 'Unable to load payroll.';
  });

  protected readonly totalHours = computed(() =>
    this.payroll().reduce((sum, r) => sum + (r.totalHours || 0), 0),
  );
  protected readonly totalOt = computed(() =>
    this.payroll().reduce((sum, r) => sum + (r.overtimeHours || 0), 0),
  );
  protected readonly totalGross = computed(() =>
    this.payroll().reduce((sum, r) => sum + (r.grossPayWithOt ?? r.regularPay ?? 0), 0),
  );

  protected readonly totalHoursLabel = computed(() => this.totalHours().toFixed(1));
  protected readonly totalOtLabel = computed(() => this.totalOt().toFixed(1));
  protected readonly totalGrossLabel = computed(() => this.formatMoney(this.totalGross()));

  protected onStartDate(event: Event): void {
    this.svc.setStartDate((event.target as HTMLInputElement).value);
  }

  protected onEndDate(event: Event): void {
    this.svc.setEndDate((event.target as HTMLInputElement).value);
  }

  protected async onDownloadCsv(): Promise<void> {
    const dispensaryId = this.auth.user()?.dispensaryId;
    const start = this.startDate();
    const end = this.endDate();
    if (!dispensaryId || !start || !end) return;
    await this.csv.download({
      path: '/payroll/export',
      params: { dispensaryId, startDate: start, endDate: end },
      suggestedFilename: `payroll-${start}-to-${end}.csv`,
    });
  }

  protected initials(first: string | null | undefined, last: string | null | undefined): string {
    return (first?.[0] ?? '') + (last?.[0] ?? '');
  }

  protected rateLabel(rate: number | null | undefined): string {
    if (rate == null) return '—';
    return '$' + rate.toFixed(2);
  }

  protected grossPayLabel(r: PayrollRow): string {
    return this.formatMoney(r.grossPayWithOt ?? r.regularPay ?? 0);
  }

  protected rowKey(r: PayrollRow): string {
    return (r.employeeNumber ?? '') + ':' + r.firstName + ':' + r.lastName;
  }

  protected formatMoney(value: number): string {
    return (
      '$' +
      value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }
}
