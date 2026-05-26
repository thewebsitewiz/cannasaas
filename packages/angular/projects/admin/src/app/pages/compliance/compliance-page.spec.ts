import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CompliancePage } from './compliance-page';
import {
  ComplianceService,
  type FailedSyncDashboard,
  type FailedSyncItem,
} from './compliance.service';
import { DashboardService, type Dashboard } from '../dashboard/dashboard.service';

interface FakeArgs {
  readonly data?: Dashboard | null;
  readonly loading?: boolean;
  readonly error?: unknown;
  readonly failedSyncs?: FailedSyncDashboard | null;
  readonly retrying?: ReadonlySet<string>;
  readonly retry?: ReturnType<typeof vi.fn>;
}

function makeDashboard(args: FakeArgs): DashboardService {
  return {
    data: signal<Dashboard | null>(args.data ?? null).asReadonly(),
    isLoading: signal<boolean>(args.loading ?? false).asReadonly(),
    error: signal<unknown>(args.error ?? null).asReadonly(),
  } as unknown as DashboardService;
}

function makeCompliance(args: FakeArgs): ComplianceService {
  const retrying = args.retrying ?? new Set<string>();
  return {
    failedSyncs: signal<FailedSyncDashboard | null>(args.failedSyncs ?? null).asReadonly(),
    failedSyncsLoading: signal<boolean>(false).asReadonly(),
    failedSyncsError: signal<unknown>(null).asReadonly(),
    retrying: signal<ReadonlySet<string>>(retrying).asReadonly(),
    isRetrying: (id: string) => retrying.has(id),
    retry: args.retry ?? vi.fn().mockResolvedValue(undefined),
    reload: vi.fn(),
  } as unknown as ComplianceService;
}

function configure(args: FakeArgs = {}) {
  const compliance = makeCompliance(args);
  TestBed.configureTestingModule({
    imports: [CompliancePage],
    providers: [
      { provide: DashboardService, useValue: makeDashboard(args) },
      { provide: ComplianceService, useValue: compliance },
    ],
  });
  const f = TestBed.createComponent(CompliancePage);
  f.detectChanges();
  // Attach the compliance stub on the fixture so new tests can read it
  // without breaking the historic `const f = configure(...)` shape.
  (f as unknown as { _compliance: ComplianceService })._compliance = compliance;
  return f;
}

function fixture(overrides: Partial<Dashboard> = {}): Dashboard {
  return {
    __typename: 'DashboardData',
    sales: {
      __typename: 'SalesOverview',
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      totalTax: 0,
      completedOrders: 0,
      pendingOrders: 0,
      cancelledOrders: 0,
    },
    salesTrend: [],
    topProducts: [],
    categoryBreakdown: [],
    inventory: {
      __typename: 'InventoryOverview',
      totalVariants: 0,
      totalUnitsOnHand: 0,
      totalUnitsAvailable: 0,
      estimatedInventoryValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    },
    lowStockItems: [],
    metrcSync: {
      __typename: 'MetrcSyncOverview',
      totalSyncs: 200,
      successCount: 190,
      failedCount: 3,
      pendingCount: 7,
      successRate: 95,
      ordersAwaitingSync: 7,
      lastSyncAt: '2026-05-21T14:30:00Z',
    },
    compliance: {
      __typename: 'ComplianceSummary',
      totalProducts: 50,
      compliantProducts: 48,
      missingUid: 1,
      missingCategory: 0,
      missingPackageLabel: 1,
      compliancePercent: 96,
    },
    ...overrides,
  } as Dashboard;
}

describe('CompliancePage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders loading state', () => {
    const f = configure({ loading: true });
    expect((f.nativeElement as HTMLElement).textContent).toContain('Loading compliance…');
  });

  it('renders error banner', () => {
    const f = configure({ error: new Error('api down') });
    const alert = (f.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Failed to load compliance');
    expect(alert?.textContent).toContain('api down');
  });

  it('renders compliance score with compliant/total counts', () => {
    const f = configure({ data: fixture() });
    const text = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('96%');
    expect(text).toContain('48/50 products fully compliant');
  });

  it('shows ✗ next to attributes with missing values, ✓ when clean', () => {
    const f = configure({ data: fixture() });
    const text = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Metrc UIDs');
    expect(text).toContain('1 missing');
    expect(text).toContain('Item categories');
    expect(text).toContain('0 missing');
    expect(text).toContain('Package labels');
    expect(text).toContain('Approved');
    expect(text).toContain('48 approved');
  });

  it('renders Metrc sync counters + success rate + last sync timestamp', () => {
    const f = configure({ data: fixture() });
    const text = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Metrc sync status');
    expect(text).toContain('200');
    expect(text).toContain('190');
    expect(text).toContain('3');
    expect(text).toContain('95%');
    expect(text).toContain('7');
    expect(text).toContain('Last successful sync:');
  });

  it('hides the last sync line when lastSyncAt is null', () => {
    const f = configure({
      data: fixture({
        metrcSync: {
          __typename: 'MetrcSyncOverview',
          totalSyncs: 0,
          successCount: 0,
          failedCount: 0,
          pendingCount: 0,
          successRate: 0,
          ordersAwaitingSync: 0,
          lastSyncAt: null,
        },
      } as unknown as Partial<Dashboard>),
    });
    expect((f.nativeElement as HTMLElement).textContent).not.toContain('Last successful sync');
  });

  it('paints success rate emerald at 90+, amber at 50-89, rose below 50', () => {
    const lowRate = configure({
      data: fixture({
        metrcSync: {
          __typename: 'MetrcSyncOverview',
          totalSyncs: 10,
          successCount: 3,
          failedCount: 7,
          pendingCount: 0,
          successRate: 30,
          ordersAwaitingSync: 0,
          lastSyncAt: null,
        },
      } as unknown as Partial<Dashboard>),
    });
    const rateCell = Array.from((lowRate.nativeElement as HTMLElement).querySelectorAll('p')).find(
      (p) => (p.textContent ?? '').trim() === '30%',
    );
    expect(rateCell?.className).toContain('text-rose-500');
  });

  // ── Failed-sync retry (sc-684) ────────────────────────────────────────

  const failedItem = (overrides: Partial<FailedSyncItem> = {}): FailedSyncItem =>
    ({
      __typename: 'FailedSyncItem',
      orderId: 'order-12345abcdef',
      orderStatus: 'completed',
      metrcSyncStatus: 'failed',
      metrcReportedAt: null,
      subtotal: 50,
      total: 54.5,
      createdAt: '2026-05-22T10:00:00Z',
      lastSyncAttempt: '2026-05-22T17:00:00Z',
      lastSyncError: '401 unauthorized',
      attemptCount: 5,
      ...overrides,
    }) as FailedSyncItem;

  const failedDashboard = (items: FailedSyncItem[]): FailedSyncDashboard =>
    ({
      __typename: 'FailedSyncDashboard',
      dispensaryId: 'disp-1',
      totalFailed: items.length,
      oldestFailedAt: items[0]?.createdAt ?? null,
      items,
    }) as unknown as FailedSyncDashboard;

  it('hides the failed-sync table when there are no failed items', () => {
    const f = configure({ data: fixture(), failedSyncs: failedDashboard([]) });
    expect(
      (f.nativeElement as HTMLElement).querySelector('[aria-label="Failed Metrc syncs"]'),
    ).toBeNull();
  });

  it('renders the failed-sync table with a row per item', () => {
    const f = configure({
      data: fixture(),
      failedSyncs: failedDashboard([
        failedItem({ orderId: 'order-aaa11111zzz', total: 19.99, attemptCount: 3 }),
        failedItem({ orderId: 'order-bbb22222zzz', total: 42.0, attemptCount: 5 }),
      ]),
    });
    const table = (f.nativeElement as HTMLElement).querySelector(
      '[aria-label="Failed Metrc syncs"]',
    );
    expect(table).not.toBeNull();
    const text = table?.textContent ?? '';
    expect(text).toContain('Failed Metrc syncs (2)');
    expect(text).toContain('order-aa');
    expect(text).toContain('order-bb');
    expect(text).toContain('$19.99');
    expect(text).toContain('$42.00');
    expect(text).toContain('401 unauthorized');
  });

  it('clicking Retry calls svc.retry with the orderId', async () => {
    const retry = vi.fn().mockResolvedValue(undefined);
    const f = configure({
      data: fixture(),
      failedSyncs: failedDashboard([failedItem({ orderId: 'order-xyz' })]),
      retry,
    });
    const btn = (f.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Retry sync for order order-xyz"]',
    ) as HTMLButtonElement;
    btn.click();
    await f.whenStable();
    expect(retry).toHaveBeenCalledWith('order-xyz');
  });

  it('Retry button reads "Retrying…" + is disabled while in flight', () => {
    const f = configure({
      data: fixture(),
      failedSyncs: failedDashboard([failedItem({ orderId: 'order-busy' })]),
      retrying: new Set(['order-busy']),
    });
    const btn = (f.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Retry sync for order order-busy"]',
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect((btn.textContent ?? '').trim()).toBe('Retrying…');
  });
});
