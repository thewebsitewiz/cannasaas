import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { StaffingService, type Employee } from './staffing.service';

const HOURS_PER_WEEK = 40;

/**
 * Read-only staff roster + compliance KPIs. Mirrors React parity:
 * 5 KPI cards (active staff, active certs, expiring soon, expired,
 * estimated weekly payroll) + a roster table.
 *
 * Filed scope listed add-employee modal, inline role changes, and
 * activate/deactivate toggles — none of which exist in the React
 * admin. File a follow-up if/when invite/role mutations become an
 * admin workflow need.
 */
@Component({
  selector: 'cs-staffing-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-6">
      <h1 class="text-2xl font-bold text-(--color-text)">Staffing</h1>

      @if (loading()) {
        <p
          class="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-sm text-(--color-text-muted)"
        >
          Loading staff…
        </p>
      } @else if (error(); as err) {
        <div
          class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300"
          role="alert"
        >
          <h2 class="font-semibold">Failed to load staffing</h2>
          <p class="mt-1 text-sm">{{ errorMessage() }}</p>
        </div>
      } @else {
        <!-- KPIs -->
        <div class="grid grid-cols-2 gap-3 md:grid-cols-5">
          <article
            class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center"
          >
            <p class="text-2xl font-bold text-(--color-text) tabular-nums">
              {{ compliance()?.activeEmployees ?? 0 }}
            </p>
            <p class="text-xs text-(--color-text-secondary)">Active staff</p>
          </article>
          <article
            class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center"
          >
            <p class="text-2xl font-bold text-emerald-500 tabular-nums">
              {{ compliance()?.activeCerts ?? 0 }}
            </p>
            <p class="text-xs text-(--color-text-secondary)">Active certs</p>
          </article>
          <article
            class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center"
          >
            <p class="text-2xl font-bold text-amber-500 tabular-nums">
              {{ compliance()?.expiringSoon ?? 0 }}
            </p>
            <p class="text-xs text-(--color-text-secondary)">Expiring soon</p>
          </article>
          <article
            class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center"
          >
            <p class="text-2xl font-bold text-rose-500 tabular-nums">
              {{ compliance()?.expiredCerts ?? 0 }}
            </p>
            <p class="text-xs text-(--color-text-secondary)">Expired</p>
          </article>
          <article
            class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center"
          >
            <p class="text-2xl font-bold text-(--color-text) tabular-nums">
              {{ estimatedWeeklyPayrollLabel() }}
            </p>
            <p class="text-xs text-(--color-text-secondary)">Est. weekly payroll</p>
          </article>
        </div>

        <!-- Roster -->
        <div class="overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface)">
          <header class="border-b border-(--color-border) px-6 py-4">
            <h2 class="text-lg font-semibold text-(--color-text)">Employee roster</h2>
          </header>
          @if (employees().length === 0) {
            <p class="p-12 text-center text-sm text-(--color-text-muted)">No employees found.</p>
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
                  <th class="px-4 py-2 text-left font-medium text-(--color-text-secondary)">
                    Type
                  </th>
                  <th class="px-4 py-2 text-right font-medium text-(--color-text-secondary)">
                    Rate
                  </th>
                  <th class="px-4 py-2 text-center font-medium text-(--color-text-secondary)">
                    Certs
                  </th>
                  <th class="px-4 py-2 text-center font-medium text-(--color-text-secondary)">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-(--color-border)">
                @for (e of employees(); track e.profileId) {
                  <tr class="hover:bg-(--color-surface-hover)">
                    <td class="px-4 py-3">
                      <p class="font-medium text-(--color-text)">
                        {{ formatName(e) }}
                      </p>
                      <p class="text-xs text-(--color-text-muted)">
                        @if (e.employeeNumber) {
                          {{ e.employeeNumber }} ·
                        }
                        {{ e.email }}
                      </p>
                    </td>
                    <td class="px-4 py-3 text-(--color-text-secondary)">
                      {{ e.positionName ?? '—' }}
                    </td>
                    <td class="px-4 py-3">
                      <span
                        class="rounded-full px-2 py-0.5 text-xs"
                        [class]="employmentTypeClass(e.employmentType)"
                      >
                        {{ employmentTypeLabel(e.employmentType) }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right font-medium tabular-nums text-(--color-text)">
                      {{ formatRate(e.hourlyRate) }}
                    </td>
                    <td class="px-4 py-3 text-center">
                      <span class="font-medium text-emerald-500 tabular-nums">
                        {{ e.activeCerts }}
                      </span>
                      @if (e.expiringCerts > 0) {
                        <span class="ml-1 text-amber-500">({{ e.expiringCerts }}⚠)</span>
                      }
                    </td>
                    <td class="px-4 py-3 text-center">
                      <span
                        class="rounded-full px-2 py-0.5 text-xs"
                        [class]="statusBadgeClass(e.employmentStatus)"
                      >
                        {{ e.employmentStatus }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }
    </section>
  `,
})
export class StaffingPage {
  private readonly svc = inject(StaffingService);

  protected readonly employees = this.svc.employees;
  protected readonly compliance = this.svc.compliance;
  protected readonly loading = this.svc.isLoading;
  protected readonly error = this.svc.error;

  protected readonly errorMessage = computed(() => {
    const err = this.error();
    return err instanceof Error ? err.message : 'Unable to load staffing.';
  });

  protected readonly estimatedWeeklyPayrollLabel = computed(() => {
    const total = this.employees()
      .filter((e) => e.employmentStatus === 'active')
      .reduce((sum, e) => sum + (e.hourlyRate ?? 0) * HOURS_PER_WEEK, 0);
    return (
      '$' +
      total.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    );
  });

  protected formatName(e: Employee): string {
    const first = e.firstName ?? '';
    const last = e.lastName ?? '';
    const name = (first + ' ' + last).trim();
    return name || e.email;
  }

  protected formatRate(rate: number | null | undefined): string {
    if (rate == null) return '—';
    return '$' + rate.toFixed(2) + '/hr';
  }

  protected employmentTypeLabel(type: string): string {
    if (type === 'full_time') return 'Full-time';
    if (type === 'part_time') return 'Part-time';
    return type.replace(/_/g, ' ');
  }

  protected employmentTypeClass(type: string): string {
    return type === 'full_time'
      ? 'bg-sky-500/10 text-sky-500'
      : 'bg-(--color-surface-hover) text-(--color-text-secondary)';
  }

  protected statusBadgeClass(status: string): string {
    return status === 'active'
      ? 'bg-emerald-500/10 text-emerald-500'
      : 'bg-rose-500/10 text-rose-500';
  }
}
