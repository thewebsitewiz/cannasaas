import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { BarChartModule, type Color, PieChartModule, ScaleType } from '@swimlane/ngx-charts';

import { DashboardService } from './dashboard.service';
import { LowStockWidget } from './low-stock-widget';

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const SALES_SCHEME: Color = {
  name: 'sales',
  selectable: false,
  group: ScaleType.Ordinal,
  domain: ['#22c55e'],
};

const CATEGORY_SCHEME: Color = {
  name: 'categories',
  selectable: false,
  group: ScaleType.Ordinal,
  domain: CHART_COLORS,
};

interface Series {
  readonly name: string;
  readonly value: number;
}

const fmtMoney = (v: number): string =>
  '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtCurrencyAxis = (v: number | string): string => '$' + Number(v).toLocaleString();
const fmtPeriodTick = (v: string): string => v.slice(5);

/**
 * Admin dashboard — KPI cards, sales trend bar, top products list,
 * category pie, inventory health grid, live low-stock widget, and
 * Metrc / compliance summaries. Charts via `@swimlane/ngx-charts`
 * (sc-624 decision); live updates via `StockAlertsService` →
 * `LowStockWidget`.
 */
@Component({
  selector: 'cs-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BarChartModule, PieChartModule, LowStockWidget],
  template: `
    <section class="space-y-8">
      <h1 class="text-2xl font-bold text-(--color-text)">Dashboard</h1>

      @if (loading()) {
        <div
          class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
          aria-label="Loading dashboard"
        >
          @for (i of [1, 2, 3, 4]; track i) {
            <div
              class="animate-pulse rounded-xl border border-(--color-border) bg-(--color-surface) p-5"
            >
              <div class="mb-3 h-4 w-20 rounded bg-(--color-border)"></div>
              <div class="h-7 w-28 rounded bg-(--color-border)"></div>
            </div>
          }
        </div>
      } @else if (error(); as err) {
        <div
          class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300"
          role="alert"
        >
          <h2 class="font-semibold">Failed to load dashboard</h2>
          <p class="mt-1 text-sm">{{ errorMessage() }}</p>
        </div>
      } @else if (data(); as d) {
        <!-- ── KPI Cards ───────────────────────────────────────────────── -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
            <div class="mb-3 flex items-center gap-3">
              <span class="text-(--color-primary)" aria-hidden="true">$</span>
              <span class="text-sm font-medium text-(--color-text-secondary)"> Total Revenue </span>
            </div>
            <p class="text-2xl font-bold text-(--color-text) tabular-nums">
              {{ formatMoney(d.sales.totalRevenue) }}
            </p>
            <p class="mt-1 text-xs text-(--color-text-muted)">{{ d.sales.totalOrders }} orders</p>
          </div>

          <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
            <div class="mb-3 flex items-center gap-3">
              <span class="text-(--color-primary)" aria-hidden="true">↗</span>
              <span class="text-sm font-medium text-(--color-text-secondary)">
                Avg Order Value
              </span>
            </div>
            <p class="text-2xl font-bold text-(--color-text) tabular-nums">
              {{ formatMoney(d.sales.averageOrderValue) }}
            </p>
          </div>

          <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
            <div class="mb-3 flex items-center gap-3">
              <span class="text-(--color-primary)" aria-hidden="true">🛒</span>
              <span class="text-sm font-medium text-(--color-text-secondary)"> Completed </span>
            </div>
            <p class="text-2xl font-bold text-(--color-text) tabular-nums">
              {{ d.sales.completedOrders }}
            </p>
            <p class="mt-1 text-xs text-(--color-text-muted)">
              {{ d.sales.pendingOrders }} pending
            </p>
          </div>

          <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
            <div class="mb-3 flex items-center gap-3">
              <span class="text-(--color-primary)" aria-hidden="true">🛡</span>
              <span class="text-sm font-medium text-(--color-text-secondary)"> Compliance </span>
            </div>
            <p class="text-2xl font-bold text-(--color-text) tabular-nums">
              {{ d.compliance.compliancePercent }}%
            </p>
            <p class="mt-1 text-xs text-(--color-text-muted)">
              {{ d.compliance.compliantProducts }}/{{ d.compliance.totalProducts }} products
            </p>
          </div>
        </div>

        <!-- ── Sales Trend + Top Products ──────────────────────────────── -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div
            class="rounded-xl border border-(--color-border) bg-(--color-surface) p-6 lg:col-span-2"
          >
            <h2 class="mb-4 text-lg font-semibold text-(--color-text)">Sales Trend (30d)</h2>
            @if (salesTrendSeries().length > 0) {
              <div class="h-[260px]">
                <ngx-charts-bar-vertical
                  [results]="salesTrendSeries()"
                  [scheme]="salesScheme"
                  [xAxis]="true"
                  [yAxis]="true"
                  [showXAxisLabel]="false"
                  [showYAxisLabel]="false"
                  [yAxisTickFormatting]="fmtCurrencyTick"
                  [barPadding]="6"
                  [roundDomains]="true"
                  [animations]="false"
                ></ngx-charts-bar-vertical>
              </div>
            } @else {
              <p class="py-12 text-center text-sm text-(--color-text-muted)">
                No sales data for this period
              </p>
            }
          </div>

          <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
            <h2 class="mb-4 text-lg font-semibold text-(--color-text)">Top Products</h2>
            @if (d.topProducts.length > 0) {
              <ul class="space-y-3">
                @for (p of d.topProducts; track p.productId; let i = $index) {
                  <li class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="w-5 text-xs font-bold text-(--color-text-muted)">
                        #{{ i + 1 }}
                      </span>
                      <div>
                        <p class="text-sm font-medium text-(--color-text)">
                          {{ p.productName }}
                        </p>
                        <p class="text-xs text-(--color-text-muted)">{{ p.unitsSold }} units</p>
                      </div>
                    </div>
                    <span class="text-sm font-semibold text-(--color-text) tabular-nums">
                      {{ formatMoney(p.revenue) }}
                    </span>
                  </li>
                }
              </ul>
            } @else {
              <p class="py-8 text-center text-sm text-(--color-text-muted)">No product data</p>
            }
          </div>
        </div>

        <!-- ── Category Breakdown + Inventory ──────────────────────────── -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
            <h2 class="mb-4 text-lg font-semibold text-(--color-text)">Sales by Category</h2>
            @if (categorySeries().length > 0) {
              <div class="h-[220px]">
                <ngx-charts-pie-chart
                  [results]="categorySeries()"
                  [scheme]="categoryScheme"
                  [labels]="true"
                  [doughnut]="false"
                  [animations]="false"
                ></ngx-charts-pie-chart>
              </div>
            } @else {
              <p class="py-8 text-center text-sm text-(--color-text-muted)">No category data</p>
            }
          </div>

          <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
            <h2 class="mb-4 text-lg font-semibold text-(--color-text)">Inventory Health</h2>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-(--color-text-secondary)">Total Variants</p>
                <p class="text-xl font-bold text-(--color-text)">
                  {{ d.inventory.totalVariants }}
                </p>
              </div>
              <div>
                <p class="text-sm text-(--color-text-secondary)">Units Available</p>
                <p class="text-xl font-bold text-(--color-text)">
                  {{ d.inventory.totalUnitsAvailable }}
                </p>
              </div>
              <div>
                <p class="text-sm text-(--color-text-secondary)">Est. Value</p>
                <p class="text-xl font-bold text-(--color-text)">
                  {{ formatMoney(d.inventory.estimatedInventoryValue) }}
                </p>
              </div>
              <div>
                <p class="text-sm text-(--color-text-secondary)">Low / Out of Stock</p>
                <p class="text-xl font-bold">
                  <span
                    [class]="
                      d.inventory.lowStockCount > 0 ? 'text-amber-500' : 'text-(--color-text)'
                    "
                  >
                    {{ d.inventory.lowStockCount }}
                  </span>
                  <span class="text-(--color-text-muted)"> / </span>
                  <span
                    [class]="
                      d.inventory.outOfStockCount > 0 ? 'text-rose-500' : 'text-(--color-text)'
                    "
                  >
                    {{ d.inventory.outOfStockCount }}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Low Stock (live) ───────────────────────────────────────── -->
        <cs-low-stock-widget [seed]="d.lowStockItems" />

        <!-- ── Metrc Sync + Compliance ────────────────────────────────── -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
            <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-(--color-text)">
              <span aria-hidden="true">↻</span> Metrc Sync Status
            </h2>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-(--color-text-secondary)">Total Syncs</p>
                <p class="text-xl font-bold text-(--color-text)">
                  {{ d.metrcSync.totalSyncs }}
                </p>
              </div>
              <div>
                <p class="text-sm text-(--color-text-secondary)">Success Rate</p>
                <p class="text-xl font-bold" [class]="successRateClass(d.metrcSync.successRate)">
                  {{ d.metrcSync.successRate }}%
                </p>
              </div>
              <div>
                <p class="text-sm text-(--color-text-secondary)">Failed</p>
                <p
                  class="text-xl font-bold"
                  [class]="d.metrcSync.failedCount > 0 ? 'text-rose-500' : 'text-(--color-text)'"
                >
                  {{ d.metrcSync.failedCount }}
                </p>
              </div>
              <div>
                <p class="text-sm text-(--color-text-secondary)">Awaiting Sync</p>
                <p
                  class="text-xl font-bold"
                  [class]="
                    d.metrcSync.ordersAwaitingSync > 0 ? 'text-amber-500' : 'text-(--color-text)'
                  "
                >
                  {{ d.metrcSync.ordersAwaitingSync }}
                </p>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
            <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-(--color-text)">
              <span aria-hidden="true">🛡</span> Compliance Overview
            </h2>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-(--color-text-secondary)">Compliance</p>
                <p
                  class="text-xl font-bold"
                  [class]="
                    d.compliance.compliancePercent === 100 ? 'text-emerald-500' : 'text-amber-500'
                  "
                >
                  {{ d.compliance.compliancePercent }}%
                </p>
              </div>
              <div>
                <p class="text-sm text-(--color-text-secondary)">Compliant</p>
                <p class="text-xl font-bold text-(--color-text)">
                  {{ d.compliance.compliantProducts }}/{{ d.compliance.totalProducts }}
                </p>
              </div>
              <div>
                <p class="text-sm text-(--color-text-secondary)">Missing UID</p>
                <p
                  class="text-xl font-bold"
                  [class]="d.compliance.missingUid > 0 ? 'text-rose-500' : 'text-(--color-text)'"
                >
                  {{ d.compliance.missingUid }}
                </p>
              </div>
              <div>
                <p class="text-sm text-(--color-text-secondary)">Missing Labels</p>
                <p
                  class="text-xl font-bold"
                  [class]="
                    d.compliance.missingPackageLabel > 0 ? 'text-rose-500' : 'text-(--color-text)'
                  "
                >
                  {{ d.compliance.missingPackageLabel }}
                </p>
              </div>
            </div>
          </div>
        </div>
      }
    </section>
  `,
})
export class DashboardPage {
  private readonly svc = inject(DashboardService);

  protected readonly data = this.svc.data;
  protected readonly loading = this.svc.isLoading;
  protected readonly error = this.svc.error;

  protected readonly salesScheme = SALES_SCHEME;
  protected readonly categoryScheme = CATEGORY_SCHEME;
  protected readonly fmtCurrencyTick = fmtCurrencyAxis;

  protected readonly errorMessage = computed(() => {
    const err = this.error();
    return err instanceof Error ? err.message : 'Unable to load dashboard data.';
  });

  protected readonly salesTrendSeries = computed<readonly Series[]>(() => {
    const d = this.data();
    if (!d) return [];
    return d.salesTrend.map((t) => ({
      name: fmtPeriodTick(t.period),
      value: t.revenue,
    }));
  });

  protected readonly categorySeries = computed<readonly Series[]>(() => {
    const d = this.data();
    if (!d) return [];
    return d.categoryBreakdown.map((c) => ({
      name: c.category,
      value: c.revenue,
    }));
  });

  protected formatMoney(value: number): string {
    return fmtMoney(value);
  }

  protected successRateClass(rate: number): string {
    if (rate >= 90) return 'text-emerald-500';
    if (rate >= 50) return 'text-amber-500';
    return 'text-rose-500';
  }
}
