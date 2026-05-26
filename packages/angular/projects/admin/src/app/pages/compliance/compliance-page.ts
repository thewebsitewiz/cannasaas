import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { ComplianceService, type FailedSyncItem } from './compliance.service';
import { DashboardService } from '../dashboard/dashboard.service';

/**
 * Admin Compliance & Metrc summary — sourced entirely from the
 * existing `dashboard` query (sc-624). Mirrors React parity:
 * compliance score donut + per-attribute checklist + Metrc sync
 * counters. The failed-sync retry table from the filed scope isn't
 * in the React admin — file a follow-up once we have a
 * `failedMetrcSyncs` + retry-queue UI need.
 */
@Component({
  selector: 'cs-compliance-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-6">
      <h1 class="text-2xl font-bold text-(--color-text)">Compliance &amp; Metrc</h1>

      @if (loading()) {
        <p
          class="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-sm text-(--color-text-muted)"
        >
          Loading compliance…
        </p>
      } @else if (error(); as err) {
        <div
          class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300"
          role="alert"
        >
          <h2 class="font-semibold">Failed to load compliance</h2>
          <p class="mt-1 text-sm">{{ errorMessage() }}</p>
        </div>
      } @else if (data(); as d) {
        <!-- Compliance Score -->
        <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
          <div class="mb-6 flex items-center gap-4">
            <div
              class="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold"
              [class]="
                d.compliance.compliancePercent === 100
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : 'bg-amber-500/15 text-amber-500'
              "
              aria-label="Overall compliance score"
            >
              {{ d.compliance.compliancePercent }}%
            </div>
            <div>
              <h2 class="text-lg font-semibold text-(--color-text)">Product compliance</h2>
              <p class="text-sm text-(--color-text-secondary)">
                {{ d.compliance.compliantProducts }}/{{ d.compliance.totalProducts }} products fully
                compliant
              </p>
            </div>
          </div>

          <ul class="grid grid-cols-2 gap-4 md:grid-cols-4">
            <li class="flex items-center gap-2">
              <span
                class="text-lg"
                [class]="d.compliance.missingUid === 0 ? 'text-emerald-500' : 'text-rose-500'"
                aria-hidden="true"
              >
                {{ d.compliance.missingUid === 0 ? '✓' : '✗' }}
              </span>
              <div>
                <p class="text-sm font-medium text-(--color-text)">Metrc UIDs</p>
                <p class="text-xs text-(--color-text-secondary)">
                  {{ d.compliance.missingUid }} missing
                </p>
              </div>
            </li>
            <li class="flex items-center gap-2">
              <span
                class="text-lg"
                [class]="d.compliance.missingCategory === 0 ? 'text-emerald-500' : 'text-rose-500'"
                aria-hidden="true"
              >
                {{ d.compliance.missingCategory === 0 ? '✓' : '✗' }}
              </span>
              <div>
                <p class="text-sm font-medium text-(--color-text)">Item categories</p>
                <p class="text-xs text-(--color-text-secondary)">
                  {{ d.compliance.missingCategory }} missing
                </p>
              </div>
            </li>
            <li class="flex items-center gap-2">
              <span
                class="text-lg"
                [class]="
                  d.compliance.missingPackageLabel === 0 ? 'text-emerald-500' : 'text-rose-500'
                "
                aria-hidden="true"
              >
                {{ d.compliance.missingPackageLabel === 0 ? '✓' : '✗' }}
              </span>
              <div>
                <p class="text-sm font-medium text-(--color-text)">Package labels</p>
                <p class="text-xs text-(--color-text-secondary)">
                  {{ d.compliance.missingPackageLabel }} missing
                </p>
              </div>
            </li>
            <li class="flex items-center gap-2">
              <span class="text-lg text-emerald-500" aria-hidden="true">✓</span>
              <div>
                <p class="text-sm font-medium text-(--color-text)">Approved</p>
                <p class="text-xs text-(--color-text-secondary)">
                  {{ d.compliance.compliantProducts }} approved
                </p>
              </div>
            </li>
          </ul>
        </div>

        <!-- Metrc Sync -->
        <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
          <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-(--color-text)">
            <span aria-hidden="true">↻</span> Metrc sync status
          </h2>

          <div class="grid grid-cols-2 gap-4 md:grid-cols-5">
            <div>
              <p class="text-sm text-(--color-text-secondary)">Total syncs</p>
              <p class="text-2xl font-bold text-(--color-text) tabular-nums">
                {{ d.metrcSync.totalSyncs }}
              </p>
            </div>
            <div>
              <p class="text-sm text-(--color-text-secondary)">Success</p>
              <p class="text-2xl font-bold text-emerald-500 tabular-nums">
                {{ d.metrcSync.successCount }}
              </p>
            </div>
            <div>
              <p class="text-sm text-(--color-text-secondary)">Failed</p>
              <p
                class="text-2xl font-bold tabular-nums"
                [class]="d.metrcSync.failedCount > 0 ? 'text-rose-500' : 'text-(--color-text)'"
              >
                {{ d.metrcSync.failedCount }}
              </p>
            </div>
            <div>
              <p class="text-sm text-(--color-text-secondary)">Success rate</p>
              <p
                class="text-2xl font-bold tabular-nums"
                [class]="successRateClass(d.metrcSync.successRate)"
              >
                {{ d.metrcSync.successRate }}%
              </p>
            </div>
            <div>
              <p class="text-sm text-(--color-text-secondary)">Awaiting sync</p>
              <p
                class="text-2xl font-bold tabular-nums"
                [class]="
                  d.metrcSync.ordersAwaitingSync > 0 ? 'text-amber-500' : 'text-(--color-text)'
                "
              >
                {{ d.metrcSync.ordersAwaitingSync }}
              </p>
            </div>
          </div>

          @if (d.metrcSync.lastSyncAt) {
            <p class="mt-4 text-xs text-(--color-text-muted)">
              Last successful sync: {{ formatDateTime(d.metrcSync.lastSyncAt) }}
            </p>
          }
        </div>

        <!-- Failed sync retry (sc-684) -->
        @if (failedSyncs(); as fs) {
          @if (fs.items.length > 0) {
            <div
              class="overflow-hidden rounded-xl border border-rose-500/30 bg-(--color-surface)"
              aria-label="Failed Metrc syncs"
            >
              <header class="border-b border-(--color-border) bg-rose-500/10 px-6 py-4">
                <h2 class="flex items-center gap-2 text-lg font-semibold text-(--color-text)">
                  <span class="text-rose-500" aria-hidden="true">⚠</span>
                  Failed Metrc syncs ({{ fs.totalFailed }})
                </h2>
                @if (fs.oldestFailedAt) {
                  <p class="mt-1 text-xs text-(--color-text-muted)">
                    Oldest unresolved: {{ formatDateTime(fs.oldestFailedAt) }}
                  </p>
                }
              </header>
              <table class="w-full text-sm">
                <thead class="border-b border-(--color-border) bg-(--color-bg)">
                  <tr>
                    <th class="px-4 py-2 text-left font-medium text-(--color-text-secondary)">
                      Order
                    </th>
                    <th class="px-4 py-2 text-right font-medium text-(--color-text-secondary)">
                      Total
                    </th>
                    <th class="px-4 py-2 text-center font-medium text-(--color-text-secondary)">
                      Attempts
                    </th>
                    <th class="px-4 py-2 text-left font-medium text-(--color-text-secondary)">
                      Last attempt
                    </th>
                    <th class="px-4 py-2 text-left font-medium text-(--color-text-secondary)">
                      Error
                    </th>
                    <th class="px-4 py-2 text-right font-medium text-(--color-text-secondary)">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-(--color-border)">
                  @for (item of fs.items; track item.orderId) {
                    <tr>
                      <td class="px-4 py-3 font-mono text-xs text-(--color-text)">
                        {{ shortId(item.orderId) }}
                      </td>
                      <td class="px-4 py-3 text-right font-medium tabular-nums text-(--color-text)">
                        {{ formatMoney(item.total) }}
                      </td>
                      <td class="px-4 py-3 text-center text-(--color-text-secondary)">
                        {{ item.attemptCount }}
                      </td>
                      <td class="px-4 py-3 text-xs text-(--color-text-secondary)">
                        {{ formatDateTime(item.lastSyncAttempt) }}
                      </td>
                      <td
                        class="max-w-xs truncate px-4 py-3 text-xs text-rose-500"
                        [attr.title]="item.lastSyncError"
                      >
                        {{ item.lastSyncError ?? '—' }}
                      </td>
                      <td class="px-4 py-3 text-right">
                        <button
                          type="button"
                          (click)="onRetry(item)"
                          [disabled]="isRetrying(item.orderId)"
                          [attr.aria-label]="'Retry sync for order ' + item.orderId"
                          class="rounded-md border border-(--color-border) px-3 py-1 text-xs text-(--color-primary) hover:bg-(--color-primary)/10 disabled:opacity-50"
                        >
                          @if (isRetrying(item.orderId)) {
                            Retrying…
                          } @else {
                            Retry
                          }
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
      }
    </section>
  `,
})
export class CompliancePage {
  private readonly dashboard = inject(DashboardService);
  private readonly compliance = inject(ComplianceService);

  protected readonly data = this.dashboard.data;
  protected readonly loading = this.dashboard.isLoading;
  protected readonly error = this.dashboard.error;
  protected readonly failedSyncs = this.compliance.failedSyncs;

  protected readonly errorMessage = computed(() => {
    const err = this.error();
    return err instanceof Error ? err.message : 'Unable to load compliance.';
  });

  protected isRetrying(orderId: string): boolean {
    return this.compliance.isRetrying(orderId);
  }

  protected onRetry(item: FailedSyncItem): void {
    void this.compliance.retry(item.orderId);
  }

  protected shortId(id: string): string {
    return id.length > 8 ? id.slice(0, 8) : id;
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

  protected successRateClass(rate: number): string {
    if (rate >= 90) return 'text-emerald-500';
    if (rate >= 50) return 'text-amber-500';
    return 'text-rose-500';
  }

  protected formatDateTime(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString();
  }
}
