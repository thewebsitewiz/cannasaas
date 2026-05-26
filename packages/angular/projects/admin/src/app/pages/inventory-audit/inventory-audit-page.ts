import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { CsvDownloadService } from '../../core/csv/csv-download.service';
import { type AuditRow, InventoryAuditService } from './inventory-audit.service';

const TRANSACTION_TYPES: readonly { value: string; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'sale', label: 'Sale' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'receive', label: 'Receive' },
  { value: 'transfer_out', label: 'Transfer out' },
  { value: 'transfer_in', label: 'Transfer in' },
  { value: 'waste', label: 'Waste' },
  { value: 'reserve', label: 'Reserve' },
  { value: 'release', label: 'Release' },
];

@Component({
  selector: 'cs-inventory-audit-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="space-y-6">
      <header class="flex items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-(--color-text)">Inventory audit</h1>
          <p class="mt-1 text-sm text-(--color-text-muted)">
            Every quantity change on this dispensary — who, what, when, why.
          </p>
        </div>
        <a
          routerLink="/inventory"
          class="text-sm text-(--color-primary) hover:text-(--color-primary-hover)"
        >
          ← Inventory
        </a>
      </header>

      <div
        class="grid grid-cols-1 gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label class="text-xs font-medium text-(--color-text-secondary)">
          From
          <input
            type="date"
            aria-label="Filter from date"
            [value]="sinceInput()"
            (change)="onSinceChange($event)"
            class="mt-1 block w-full rounded-md border border-(--color-border) bg-(--color-bg) px-2 py-1.5 text-sm text-(--color-text)"
          />
        </label>
        <label class="text-xs font-medium text-(--color-text-secondary)">
          To
          <input
            type="date"
            aria-label="Filter to date"
            [value]="untilInput()"
            (change)="onUntilChange($event)"
            class="mt-1 block w-full rounded-md border border-(--color-border) bg-(--color-bg) px-2 py-1.5 text-sm text-(--color-text)"
          />
        </label>
        <label class="text-xs font-medium text-(--color-text-secondary)">
          Transaction type
          <select
            aria-label="Filter transaction type"
            [value]="filters().transactionType ?? ''"
            (change)="onTypeChange($event)"
            class="mt-1 block w-full rounded-md border border-(--color-border) bg-(--color-bg) px-2 py-1.5 text-sm text-(--color-text)"
          >
            @for (t of types; track t.value) {
              <option [value]="t.value">{{ t.label }}</option>
            }
          </select>
        </label>
        <div class="flex items-end gap-2">
          <button
            type="button"
            (click)="onReset()"
            class="rounded-md border border-(--color-border) px-3 py-1.5 text-xs text-(--color-text-secondary) hover:text-(--color-text)"
          >
            Reset filters
          </button>
          <button
            type="button"
            (click)="onDownloadCsv()"
            [disabled]="downloading()"
            aria-label="Download audit log as CSV"
            class="rounded-md border border-(--color-border) px-3 py-1.5 text-xs text-(--color-text-secondary) hover:text-(--color-text) disabled:opacity-50"
          >
            @if (downloading()) {
              Downloading…
            } @else {
              Download CSV
            }
          </button>
        </div>
      </div>

      @if (loading()) {
        <p class="text-sm text-(--color-text-muted)">Loading audit log…</p>
      } @else if (error(); as err) {
        <p class="text-sm text-rose-500" role="alert">{{ errorMessage() }}</p>
      } @else if (rows().length === 0) {
        <p
          class="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-sm text-(--color-text-muted)"
        >
          No transactions match the current filters.
        </p>
      } @else {
        <div class="overflow-x-auto rounded-xl border border-(--color-border) bg-(--color-surface)">
          <table class="w-full text-sm">
            <thead class="border-b border-(--color-border) bg-(--color-bg)">
              <tr>
                <th class="px-3 py-2 text-left font-medium text-(--color-text-secondary)">When</th>
                <th class="px-3 py-2 text-left font-medium text-(--color-text-secondary)">
                  Product / variant
                </th>
                <th class="px-3 py-2 text-left font-medium text-(--color-text-secondary)">Type</th>
                <th class="px-3 py-2 text-right font-medium text-(--color-text-secondary)">
                  Δ qty
                </th>
                <th class="px-3 py-2 text-right font-medium text-(--color-text-secondary)">
                  Before → after
                </th>
                <th class="px-3 py-2 text-left font-medium text-(--color-text-secondary)">By</th>
                <th class="px-3 py-2 text-left font-medium text-(--color-text-secondary)">Ref</th>
                <th class="px-3 py-2 text-left font-medium text-(--color-text-secondary)">Notes</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-(--color-border)">
              @for (row of rows(); track row.transactionId) {
                <tr>
                  <td
                    class="px-3 py-2 whitespace-nowrap text-(--color-text-secondary) tabular-nums"
                  >
                    {{ formatDate(row.createdAt) }}
                  </td>
                  <td class="px-3 py-2 text-(--color-text)">
                    <div>{{ row.productName ?? '—' }}</div>
                    <div class="text-xs text-(--color-text-muted)">{{ row.variantName ?? '' }}</div>
                  </td>
                  <td class="px-3 py-2 text-(--color-text-secondary)">{{ row.transactionType }}</td>
                  <td
                    class="px-3 py-2 text-right font-medium tabular-nums"
                    [class]="deltaClass(row.quantityDelta)"
                  >
                    {{ formatDelta(row.quantityDelta) }}
                  </td>
                  <td class="px-3 py-2 text-right text-(--color-text-secondary) tabular-nums">
                    {{ row.quantityBefore }} → {{ row.quantityAfter }}
                  </td>
                  <td class="px-3 py-2 text-(--color-text-secondary)">
                    {{ row.performedByEmail ?? row.performedByUserId ?? 'system' }}
                  </td>
                  <td class="px-3 py-2 text-(--color-text-secondary)">
                    @if (row.referenceOrderId) {
                      <span title="Order">order:{{ short(row.referenceOrderId) }}</span>
                    } @else if (row.referenceTransferManifestId) {
                      <span title="Transfer manifest">
                        xfer:{{ short(row.referenceTransferManifestId) }}
                      </span>
                    } @else {
                      —
                    }
                  </td>
                  <td class="max-w-xs truncate px-3 py-2 text-(--color-text-secondary)">
                    {{ row.notes ?? '' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between text-sm text-(--color-text-secondary)">
          <div>Showing {{ pageStart() }}–{{ pageEnd() }} (page {{ pageNum() }})</div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="onPrevPage()"
              [disabled]="filters().offset === 0"
              aria-label="Previous page"
              class="rounded-md border border-(--color-border) px-3 py-1.5 text-xs disabled:opacity-50"
            >
              ← Prev
            </button>
            <button
              type="button"
              (click)="onNextPage()"
              [disabled]="!hasNextPage()"
              aria-label="Next page"
              class="rounded-md border border-(--color-border) px-3 py-1.5 text-xs disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </div>
      }
    </section>
  `,
})
export class InventoryAuditPage {
  private readonly svc = inject(InventoryAuditService);
  private readonly csv = inject(CsvDownloadService);
  private readonly auth = inject(AuthService);

  protected readonly downloading = signal<boolean>(false);
  protected readonly types = TRANSACTION_TYPES;
  protected readonly rows = this.svc.rows;
  protected readonly loading = this.svc.isLoading;
  protected readonly error = this.svc.error;
  protected readonly filters = this.svc.filters;

  protected readonly errorMessage = computed(() => {
    const err = this.error();
    return err instanceof Error ? err.message : 'Unable to load audit log.';
  });

  protected readonly sinceInput = computed(() => toDateInputValue(this.filters().since));
  protected readonly untilInput = computed(() => toDateInputValue(this.filters().until));

  protected readonly pageNum = computed(
    () => Math.floor(this.filters().offset / this.filters().limit) + 1,
  );
  protected readonly pageStart = computed(() =>
    this.rows().length === 0 ? 0 : this.filters().offset + 1,
  );
  protected readonly pageEnd = computed(() => this.filters().offset + this.rows().length);

  /**
   * The query has no totalCount, so "next page" is a hint: enabled if
   * the current page is exactly full. Users will hit "Next" and either
   * get more rows or an empty page they can back out of.
   */
  protected readonly hasNextPage = computed(() => this.rows().length === this.filters().limit);

  protected formatDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  protected formatDelta(value: number): string {
    return value > 0 ? `+${value}` : String(value);
  }

  protected deltaClass(value: number): string {
    if (value > 0) return 'text-emerald-500';
    if (value < 0) return 'text-rose-500';
    return 'text-(--color-text-secondary)';
  }

  protected short(id: string): string {
    return id.length > 8 ? id.slice(0, 8) : id;
  }

  protected onSinceChange(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.svc.patchFilters({ since: raw ? new Date(raw).toISOString() : null });
  }

  protected onUntilChange(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    // End-of-day so a single "until" date is inclusive of that whole day.
    this.svc.patchFilters({
      until: raw ? new Date(`${raw}T23:59:59.999Z`).toISOString() : null,
    });
  }

  protected onTypeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.svc.patchFilters({ transactionType: value === '' ? null : value });
  }

  protected onPrevPage(): void {
    const f = this.filters();
    this.svc.setPageOffset(Math.max(f.offset - f.limit, 0));
  }

  protected onNextPage(): void {
    const f = this.filters();
    this.svc.setPageOffset(f.offset + f.limit);
  }

  protected onReset(): void {
    this.svc.reset();
  }

  protected async onDownloadCsv(): Promise<void> {
    const dispensaryId = this.auth.user()?.dispensaryId;
    if (!dispensaryId) return;
    const f = this.filters();
    const params: Record<string, string> = { dispensaryId };
    if (f.since) params['since'] = f.since;
    if (f.until) params['until'] = f.until;
    if (f.transactionType) params['transactionType'] = f.transactionType;
    if (f.performedByUserId) params['performedByUserId'] = f.performedByUserId;
    const sinceLabel = f.since ? f.since.slice(0, 10) : 'all';
    const untilLabel = f.until ? f.until.slice(0, 10) : 'all';
    this.downloading.set(true);
    try {
      await this.csv.download({
        path: '/inventory/audit/export',
        params,
        suggestedFilename: `inventory-audit-${sinceLabel}-to-${untilLabel}.csv`,
      });
    } finally {
      this.downloading.set(false);
    }
  }
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export type { AuditRow };
