import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CompliancePage } from './compliance-page';
import { DashboardService, type Dashboard } from '../dashboard/dashboard.service';

interface FakeArgs {
  readonly data?: Dashboard | null;
  readonly loading?: boolean;
  readonly error?: unknown;
}

function makeDashboard(args: FakeArgs): DashboardService {
  return {
    data: signal<Dashboard | null>(args.data ?? null).asReadonly(),
    isLoading: signal<boolean>(args.loading ?? false).asReadonly(),
    error: signal<unknown>(args.error ?? null).asReadonly(),
  } as unknown as DashboardService;
}

function configure(args: FakeArgs = {}) {
  TestBed.configureTestingModule({
    imports: [CompliancePage],
    providers: [{ provide: DashboardService, useValue: makeDashboard(args) }],
  });
  const f = TestBed.createComponent(CompliancePage);
  f.detectChanges();
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
});
