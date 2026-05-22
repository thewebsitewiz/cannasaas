import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { ReportsService, type ReportTab } from './reports.service';

const TABS: ReadonlyArray<{ key: ReportTab; label: string }> = [
  { key: 'sales', label: 'Sales' },
  { key: 'tax', label: 'Tax' },
  { key: 'staff', label: 'Staff' },
  { key: 'inventory', label: 'Inventory' },
];

/**
 * Reports hub. Four tabs (Sales / Tax / Staff / Inventory), each
 * backed by its own GraphQL query that only fires when the tab is
 * active (lazy `enabled` gate matches React parity).
 *
 * Filed scope mentioned ngx-charts visualizations — the React admin
 * doesn't render any charts here (just KPI tiles + breakdown
 * tables), so the Angular port matches that. The Dashboard (sc-624)
 * already covers the ngx-charts pattern when needed.
 *
 * CSV export deferred — the React UX hits REST endpoints
 * (`/v1/reports/<type>/csv`) with custom Authorization +
 * `x-dispensary-id` headers, which doesn't fit Apollo cleanly. File
 * a follow-up if needed.
 */
@Component({
  selector: 'cs-reports-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-6">
      <h1 class="text-2xl font-bold text-(--color-text)">Reports</h1>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div
          class="flex items-center gap-1 rounded-lg border border-(--color-border) bg-(--color-surface) p-1"
          role="tablist"
          aria-label="Report sections"
        >
          @for (t of tabs; track t.key) {
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="tab() === t.key"
              (click)="setTab(t.key)"
              class="rounded-md px-4 py-2 text-sm font-medium transition-colors"
              [class]="
                tab() === t.key
                  ? 'bg-(--color-primary) text-white'
                  : 'text-(--color-text-secondary) hover:text-(--color-text)'
              "
            >
              {{ t.label }}
            </button>
          }
        </div>
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
        </div>
      </div>

      @if (loading()) {
        <p
          class="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-sm text-(--color-text-muted)"
        >
          Loading report…
        </p>
      } @else if (error(); as err) {
        <div
          class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300"
          role="alert"
        >
          <h2 class="font-semibold">Failed to load report</h2>
          <p class="mt-1 text-sm">{{ errorMessage() }}</p>
        </div>
      } @else {
        @switch (tab()) {
          @case ('sales') {
            @if (sales(); as s) {
              <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
                <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <p class="text-2xl font-bold text-(--color-text) tabular-nums">
                    {{ s.completedOrders }}
                  </p>
                  <p class="text-xs text-(--color-text-secondary)">Orders</p>
                </article>
                <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <p class="text-2xl font-bold text-(--color-primary) tabular-nums">
                    {{ money(s.netRevenue) }}
                  </p>
                  <p class="text-xs text-(--color-text-secondary)">Net revenue</p>
                </article>
                <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <p class="text-2xl font-bold text-(--color-text) tabular-nums">
                    {{ money(s.avgOrderValue) }}
                  </p>
                  <p class="text-xs text-(--color-text-secondary)">Avg order</p>
                </article>
                <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <p class="text-2xl font-bold text-(--color-text) tabular-nums">
                    {{ money(s.totalTax) }}
                  </p>
                  <p class="text-xs text-(--color-text-secondary)">Tax collected</p>
                </article>
              </div>

              <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
                <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <p class="text-lg font-bold text-(--color-text) tabular-nums">
                    {{ money(s.grossSales) }}
                  </p>
                  <p class="text-xs text-(--color-text-secondary)">Gross sales</p>
                </article>
                <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <p class="text-lg font-bold text-rose-500 tabular-nums">
                    -{{ money(s.totalDiscounts) }}
                  </p>
                  <p class="text-xs text-(--color-text-secondary)">Discounts</p>
                </article>
                <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <p class="text-lg font-bold text-(--color-text) tabular-nums">
                    {{ s.pickupOrders }} / {{ s.deliveryOrders }}
                  </p>
                  <p class="text-xs text-(--color-text-secondary)">Pickup / Delivery</p>
                </article>
                <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <p class="text-lg font-bold text-(--color-text) tabular-nums">
                    {{ s.cashOrders }} / {{ s.cardOrders }}
                  </p>
                  <p class="text-xs text-(--color-text-secondary)">Cash / Card</p>
                  @if (s.totalCashDiscounts > 0) {
                    <p class="mt-0.5 text-xs text-emerald-500">
                      Cash discounts: {{ money(s.totalCashDiscounts) }}
                    </p>
                  }
                </article>
              </div>
            } @else {
              <p
                class="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-sm text-(--color-text-muted)"
              >
                No sales data for this period.
              </p>
            }
          }

          @case ('tax') {
            @if (tax(); as t) {
              <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
                <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <p class="text-2xl font-bold text-(--color-text) tabular-nums">
                    {{ money(t.taxableSales) }}
                  </p>
                  <p class="text-xs text-(--color-text-secondary)">Taxable sales</p>
                </article>
                <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <p class="text-2xl font-bold text-(--color-text) tabular-nums">
                    {{ money(t.netTaxable) }}
                  </p>
                  <p class="text-xs text-(--color-text-secondary)">Net taxable</p>
                </article>
                <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <p class="text-2xl font-bold text-(--color-primary) tabular-nums">
                    {{ money(t.totalTaxCollected) }}
                  </p>
                  <p class="text-xs text-(--color-text-secondary)">Tax collected</p>
                </article>
                <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <p class="text-2xl font-bold text-(--color-text) tabular-nums">
                    {{ t.transactionCount }}
                  </p>
                  <p class="text-xs text-(--color-text-secondary)">Transactions</p>
                </article>
              </div>

              <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
                <h3 class="mb-3 font-semibold text-(--color-text)">
                  Tax breakdown
                  @if (t.state) {
                    — {{ t.state }}
                  }
                </h3>
                @if (t.licenseNumber) {
                  <p class="mb-3 text-xs text-(--color-text-muted)">
                    License: {{ t.licenseNumber }}
                  </p>
                }
                @if (t.taxBreakdown.length === 0) {
                  <p class="text-sm text-(--color-text-muted)">No tax rules applied.</p>
                } @else {
                  <table class="w-full text-sm">
                    <thead class="bg-(--color-bg)">
                      <tr>
                        <th class="px-3 py-2 text-left font-medium text-(--color-text-secondary)">
                          Tax
                        </th>
                        <th class="px-3 py-2 text-right font-medium text-(--color-text-secondary)">
                          Rate
                        </th>
                        <th class="px-3 py-2 text-left font-medium text-(--color-text-secondary)">
                          Basis
                        </th>
                        <th class="px-3 py-2 text-left font-medium text-(--color-text-secondary)">
                          Reference
                        </th>
                        <th class="px-3 py-2 text-right font-medium text-(--color-text-secondary)">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-(--color-border)">
                      @for (row of t.taxBreakdown; track row.taxCode) {
                        <tr>
                          <td class="px-3 py-2 font-medium text-(--color-text)">
                            {{ row.taxName }}
                          </td>
                          <td class="px-3 py-2 text-right tabular-nums text-(--color-text)">
                            {{ ratePercent(row.rate) }}
                          </td>
                          <td class="px-3 py-2 text-(--color-text-secondary)">
                            {{ row.taxBasis }}
                          </td>
                          <td class="px-3 py-2 text-xs text-(--color-text-muted)">
                            {{ row.statutoryReference ?? '—' }}
                          </td>
                          <td
                            class="px-3 py-2 text-right font-semibold tabular-nums text-(--color-text)"
                          >
                            {{ money(row.estimatedTax) }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </div>
            } @else {
              <p
                class="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-sm text-(--color-text-muted)"
              >
                No tax data for this period.
              </p>
            }
          }

          @case ('staff') {
            @if (labor(); as l) {
              <div class="grid grid-cols-2 gap-3 md:grid-cols-5">
                <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <p class="text-2xl font-bold text-(--color-text) tabular-nums">
                    {{ l.employeeCount }}
                  </p>
                  <p class="text-xs text-(--color-text-secondary)">Employees</p>
                </article>
                <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <p class="text-2xl font-bold text-(--color-text) tabular-nums">
                    {{ l.totalHours.toFixed(1) }}
                  </p>
                  <p class="text-xs text-(--color-text-secondary)">Total hours</p>
                </article>
                <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <p class="text-2xl font-bold text-(--color-text) tabular-nums">
                    {{ money(l.totalLaborCost) }}
                  </p>
                  <p class="text-xs text-(--color-text-secondary)">Labor cost</p>
                </article>
                <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <p class="text-2xl font-bold text-(--color-text) tabular-nums">
                    {{ money(l.totalRevenue) }}
                  </p>
                  <p class="text-xs text-(--color-text-secondary)">Revenue</p>
                </article>
                <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <p
                    class="text-2xl font-bold tabular-nums"
                    [class]="laborPercentClass(l.laborCostPercent)"
                  >
                    {{ l.laborCostPercent }}%
                  </p>
                  <p class="text-xs text-(--color-text-secondary)">Labor %</p>
                </article>
              </div>
            } @else {
              <p
                class="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-sm text-(--color-text-muted)"
              >
                No labor data for this period.
              </p>
            }
          }

          @case ('inventory') {
            @if (shrinkage(); as sh) {
              <div class="grid grid-cols-3 gap-3">
                <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <p class="text-2xl font-bold text-(--color-text) tabular-nums">
                    {{ sh.totalAdjustments }}
                  </p>
                  <p class="text-xs text-(--color-text-secondary)">Adjustments</p>
                </article>
                <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <p class="text-2xl font-bold text-rose-500 tabular-nums">
                    {{ sh.totalUnitsLost }}
                  </p>
                  <p class="text-xs text-(--color-text-secondary)">Units lost</p>
                </article>
                <article class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                  <p class="text-2xl font-bold text-rose-500 tabular-nums">
                    {{ money(sh.estimatedValueLost) }}
                  </p>
                  <p class="text-xs text-(--color-text-secondary)">Est. value lost</p>
                </article>
              </div>

              @if (sh.byReason.length > 0) {
                <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
                  <h3 class="mb-3 font-semibold text-(--color-text)">Shrinkage by reason</h3>
                  <table class="w-full text-sm">
                    <thead class="bg-(--color-bg)">
                      <tr>
                        <th class="px-3 py-2 text-left font-medium text-(--color-text-secondary)">
                          Reason
                        </th>
                        <th class="px-3 py-2 text-right font-medium text-(--color-text-secondary)">
                          Adjustments
                        </th>
                        <th class="px-3 py-2 text-right font-medium text-(--color-text-secondary)">
                          Units
                        </th>
                        <th class="px-3 py-2 text-right font-medium text-(--color-text-secondary)">
                          Est. value
                        </th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-(--color-border)">
                      @for (r of sh.byReason; track r.reasonCode) {
                        <tr>
                          <td class="px-3 py-2 font-medium text-(--color-text)">
                            {{ r.reason }}
                          </td>
                          <td class="px-3 py-2 text-right tabular-nums text-(--color-text)">
                            {{ r.count }}
                          </td>
                          <td class="px-3 py-2 text-right tabular-nums text-(--color-text)">
                            {{ r.units }}
                          </td>
                          <td class="px-3 py-2 text-right font-semibold tabular-nums text-rose-500">
                            {{ money(r.estimatedValue) }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            } @else {
              <p
                class="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-sm text-(--color-text-muted)"
              >
                No inventory shrinkage data for this period.
              </p>
            }
          }
        }
      }
    </section>
  `,
})
export class ReportsPage {
  private readonly svc = inject(ReportsService);

  protected readonly tabs = TABS;
  protected readonly tab = this.svc.tab;
  protected readonly startDate = this.svc.startDate;
  protected readonly endDate = this.svc.endDate;
  protected readonly sales = this.svc.sales;
  protected readonly tax = this.svc.tax;
  protected readonly labor = this.svc.labor;
  protected readonly shrinkage = this.svc.shrinkage;
  protected readonly loading = this.svc.isLoading;
  protected readonly error = this.svc.error;

  protected readonly errorMessage = computed(() => {
    const err = this.error();
    return err instanceof Error ? err.message : 'Unable to load report.';
  });

  protected setTab(tab: ReportTab): void {
    this.svc.setTab(tab);
  }

  protected onStartDate(event: Event): void {
    this.svc.setStartDate((event.target as HTMLInputElement).value);
  }

  protected onEndDate(event: Event): void {
    this.svc.setEndDate((event.target as HTMLInputElement).value);
  }

  protected money(value: number): string {
    return (
      '$' +
      value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  protected ratePercent(rate: number): string {
    return (rate * 100).toFixed(2) + '%';
  }

  protected laborPercentClass(percent: number): string {
    if (percent > 30) return 'text-rose-500';
    if (percent > 20) return 'text-amber-500';
    return 'text-emerald-500';
  }
}
