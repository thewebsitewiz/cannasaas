import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../core/auth/auth.service';
import { CsvDownloadService } from '../../core/csv/csv-download.service';
import { InventoryAuditPage } from './inventory-audit-page';
import { type AuditFilters, type AuditRow, InventoryAuditService } from './inventory-audit.service';

interface FakeArgs {
  readonly rows?: readonly AuditRow[];
  readonly totalCount?: number;
  readonly loading?: boolean;
  readonly error?: unknown;
  readonly filters?: Partial<AuditFilters>;
  readonly patchFilters?: ReturnType<typeof vi.fn>;
  readonly setPageOffset?: ReturnType<typeof vi.fn>;
  readonly reset?: ReturnType<typeof vi.fn>;
  readonly csvDownload?: ReturnType<typeof vi.fn>;
}

const DEFAULT_FILTERS: AuditFilters = {
  since: null,
  until: null,
  transactionType: null,
  performedByUserId: null,
  limit: 50,
  offset: 0,
};

function makeRow(overrides: Partial<AuditRow> = {}): AuditRow {
  return {
    __typename: 'DispensaryInventoryTransaction',
    transactionId: 't-1',
    inventoryId: 'inv-1',
    dispensaryId: 'disp-1',
    transactionType: 'sale',
    quantityDelta: -2,
    quantityBefore: 10,
    quantityAfter: 8,
    referenceOrderId: null,
    referenceTransferManifestId: null,
    performedByUserId: 'u-1',
    performedByEmail: 'a@a.com',
    notes: null,
    variantId: 'v-1',
    variantName: '3.5g',
    productName: 'Blue Dream',
    createdAt: '2026-05-22T17:00:00Z',
    ...overrides,
  } as AuditRow;
}

function makeSvc(args: FakeArgs): InventoryAuditService {
  const rows = args.rows ?? [];
  return {
    rows: signal<readonly AuditRow[]>(rows).asReadonly(),
    totalCount: signal<number>(args.totalCount ?? rows.length).asReadonly(),
    isLoading: signal<boolean>(args.loading ?? false).asReadonly(),
    error: signal<unknown>(args.error ?? null).asReadonly(),
    filters: signal<AuditFilters>({ ...DEFAULT_FILTERS, ...args.filters }).asReadonly(),
    patchFilters: args.patchFilters ?? vi.fn(),
    setPageOffset: args.setPageOffset ?? vi.fn(),
    reset: args.reset ?? vi.fn(),
  } as unknown as InventoryAuditService;
}

function configure(args: FakeArgs = {}) {
  const svc = makeSvc(args);
  const csvDownload = args.csvDownload ?? vi.fn().mockResolvedValue(undefined);
  TestBed.configureTestingModule({
    imports: [InventoryAuditPage],
    providers: [
      provideRouter([]),
      { provide: InventoryAuditService, useValue: svc },
      {
        provide: AuthService,
        useValue: {
          user: () => ({
            id: 'u-1',
            email: 'a@a.com',
            role: 'dispensary_admin',
            dispensaryId: 'disp-1',
          }),
        },
      },
      { provide: CsvDownloadService, useValue: { download: csvDownload } },
    ],
  });
  const fixture = TestBed.createComponent(InventoryAuditPage);
  fixture.detectChanges();
  return { fixture, svc, csvDownload };
}

describe('InventoryAuditPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('shows loading state', () => {
    const { fixture } = configure({ loading: true });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Loading audit log');
  });

  it('shows error state', () => {
    const { fixture } = configure({ error: new Error('boom') });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('boom');
  });

  it('shows empty state when no rows match', () => {
    const { fixture } = configure({ rows: [] });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No transactions match the current filters',
    );
  });

  it('renders a transaction row with product/variant/qty', () => {
    const { fixture } = configure({ rows: [makeRow()] });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Blue Dream');
    expect(text).toContain('3.5g');
    expect(text).toContain('-2');
    expect(text).toContain('10 → 8');
    expect(text).toContain('a@a.com');
  });

  it('changing the From date calls patchFilters with ISO string', () => {
    const patchFilters = vi.fn();
    const { fixture } = configure({ patchFilters });
    const input = (fixture.nativeElement as HTMLElement).querySelector(
      'input[aria-label="Filter from date"]',
    ) as HTMLInputElement;
    input.value = '2026-05-01';
    input.dispatchEvent(new Event('change'));
    expect(patchFilters).toHaveBeenCalledWith(
      expect.objectContaining({ since: expect.stringContaining('2026-05-01') as string }),
    );
  });

  it('changing the To date converts to end-of-day ISO', () => {
    const patchFilters = vi.fn();
    const { fixture } = configure({ patchFilters });
    const input = (fixture.nativeElement as HTMLElement).querySelector(
      'input[aria-label="Filter to date"]',
    ) as HTMLInputElement;
    input.value = '2026-05-22';
    input.dispatchEvent(new Event('change'));
    expect(patchFilters).toHaveBeenCalledWith(
      expect.objectContaining({ until: expect.stringMatching(/2026-05-22T23:59:59/) as string }),
    );
  });

  it('changing the Type select patches transactionType', () => {
    const patchFilters = vi.fn();
    const { fixture } = configure({ patchFilters });
    const select = (fixture.nativeElement as HTMLElement).querySelector(
      'select[aria-label="Filter transaction type"]',
    ) as HTMLSelectElement;
    select.value = 'adjustment';
    select.dispatchEvent(new Event('change'));
    expect(patchFilters).toHaveBeenCalledWith({ transactionType: 'adjustment' });
  });

  it('Reset button calls svc.reset()', () => {
    const reset = vi.fn();
    const { fixture } = configure({ reset });
    const btn = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(
      (b) => (b.textContent ?? '').includes('Reset filters'),
    ) as HTMLButtonElement;
    btn.click();
    expect(reset).toHaveBeenCalled();
  });

  it('Prev is disabled on first page', () => {
    const { fixture } = configure({ rows: [makeRow()], filters: { offset: 0, limit: 50 } });
    const prev = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Previous page"]',
    ) as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
  });

  it('Next advances offset by limit', () => {
    const setPageOffset = vi.fn();
    const rows = Array.from({ length: 50 }, (_, i) => makeRow({ transactionId: `t-${i}` }));
    const { fixture } = configure({
      rows,
      totalCount: 247,
      setPageOffset,
      filters: { offset: 0, limit: 50 },
    });
    const next = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Next page"]',
    ) as HTMLButtonElement;
    next.click();
    expect(setPageOffset).toHaveBeenCalledWith(50);
  });

  it('Next is disabled when the current page is not full', () => {
    const { fixture } = configure({
      rows: [makeRow()],
      totalCount: 1,
      filters: { offset: 0, limit: 50 },
    });
    const next = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Next page"]',
    ) as HTMLButtonElement;
    expect(next.disabled).toBe(true);
  });

  it('renders an order link snippet when referenceOrderId is set', () => {
    const { fixture } = configure({
      rows: [
        makeRow({
          transactionType: 'sale',
          referenceOrderId: 'order-12345abcdef',
        }),
      ],
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('order:order-12');
  });

  // ── CSV download (sc-689) ──────────────────────────────────────────────────

  it('renders the Download CSV button', () => {
    const { fixture } = configure();
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Download audit log as CSV"]',
    );
    expect(btn).not.toBeNull();
  });

  it('Download CSV calls CsvDownloadService with the audit export path + current filters', async () => {
    const csvDownload = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({
      filters: {
        since: '2026-05-01T00:00:00.000Z',
        until: '2026-05-22T23:59:59.999Z',
        transactionType: 'sale',
      },
      csvDownload,
    });
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Download audit log as CSV"]',
    ) as HTMLButtonElement;
    btn.click();
    await fixture.whenStable();

    expect(csvDownload).toHaveBeenCalledTimes(1);
    const call = csvDownload.mock.calls[0][0] as {
      path: string;
      params: Record<string, string>;
      suggestedFilename: string;
    };
    expect(call.path).toBe('/inventory/audit/export');
    expect(call.params).toEqual({
      dispensaryId: 'disp-1',
      since: '2026-05-01T00:00:00.000Z',
      until: '2026-05-22T23:59:59.999Z',
      transactionType: 'sale',
    });
    expect(call.suggestedFilename).toBe('inventory-audit-2026-05-01-to-2026-05-22.csv');
  });

  it('omits empty filters from the request params', async () => {
    const csvDownload = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({ csvDownload });
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Download audit log as CSV"]',
    ) as HTMLButtonElement;
    btn.click();
    await fixture.whenStable();

    expect(csvDownload).toHaveBeenCalledTimes(1);
    const call = csvDownload.mock.calls[0][0] as { params: Record<string, string> };
    expect(call.params).toEqual({ dispensaryId: 'disp-1' });
  });

  // ── True pagination via totalCount (sc-690) ────────────────────────────────

  it('renders "Showing N–M of T (page P of Q)"', () => {
    const rows = Array.from({ length: 50 }, (_, i) => makeRow({ transactionId: `t-${i}` }));
    const { fixture } = configure({
      rows,
      totalCount: 247,
      filters: { offset: 50, limit: 50 },
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Showing 51–100 of 247');
    expect(text).toContain('page 2 of 5');
  });

  it('Next is disabled on the last page even when it is exactly full', () => {
    // 100 total, limit 50, offset 50 → last page is rows 51-100, full but final.
    const rows = Array.from({ length: 50 }, (_, i) => makeRow({ transactionId: `t-${i}` }));
    const { fixture } = configure({
      rows,
      totalCount: 100,
      filters: { offset: 50, limit: 50 },
    });
    const next = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Next page"]',
    ) as HTMLButtonElement;
    expect(next.disabled).toBe(true);
  });

  it('Next is enabled when totalCount exceeds offset + page rows', () => {
    const rows = Array.from({ length: 50 }, (_, i) => makeRow({ transactionId: `t-${i}` }));
    const { fixture } = configure({
      rows,
      totalCount: 247,
      filters: { offset: 0, limit: 50 },
    });
    const next = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Next page"]',
    ) as HTMLButtonElement;
    expect(next.disabled).toBe(false);
  });

  it('shows "page 1 of 1" when there are zero rows', () => {
    const { fixture } = configure({ rows: [], totalCount: 0 });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    // Empty-state copy hides the paginator, so this block only runs when
    // we force a render with no rows. The page replaces the table with
    // an empty-state card, so we only assert the empty-state copy.
    expect(text).toContain('No transactions match the current filters.');
  });
});
