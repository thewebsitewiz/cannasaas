import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { DashboardService, type Dashboard } from '../dashboard/dashboard.service';
import { InventoryPage } from './inventory-page';

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
    imports: [InventoryPage],
    providers: [{ provide: DashboardService, useValue: makeDashboard(args) }],
  });
  const fixture = TestBed.createComponent(InventoryPage);
  fixture.detectChanges();
  return fixture;
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
      totalVariants: 50,
      totalUnitsOnHand: 1000,
      totalUnitsAvailable: 900,
      estimatedInventoryValue: 25_000,
      lowStockCount: 3,
      outOfStockCount: 1,
    },
    lowStockItems: [
      {
        __typename: 'LowStockItem',
        variantId: 'v-1',
        productName: 'Blue Dream',
        variantName: '3.5g',
        quantityOnHand: 5,
        quantityAvailable: 4,
      },
    ],
    metrcSync: {
      __typename: 'MetrcSyncOverview',
      totalSyncs: 0,
      successCount: 0,
      failedCount: 0,
      pendingCount: 0,
      successRate: 100,
      ordersAwaitingSync: 0,
      lastSyncAt: null,
    },
    compliance: {
      __typename: 'ComplianceSummary',
      totalProducts: 50,
      compliantProducts: 50,
      missingUid: 0,
      missingCategory: 0,
      missingPackageLabel: 0,
      compliancePercent: 100,
    },
    ...overrides,
  } as Dashboard;
}

describe('InventoryPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders loading state', () => {
    const f = configure({ loading: true });
    expect((f.nativeElement as HTMLElement).textContent).toContain('Loading inventory…');
  });

  it('renders error banner', () => {
    const f = configure({ error: new Error('disconnect') });
    const alert = (f.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Failed to load inventory');
    expect(alert?.textContent).toContain('disconnect');
  });

  it('renders KPI cards from dashboard.inventory', () => {
    const f = configure({ data: fixture() });
    const text = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Total variants');
    expect(text).toContain('50');
    expect(text).toContain('Units on hand');
    expect(text).toContain('1000');
    expect(text).toContain('Est. value');
    expect(text).toContain('$25,000.00');
    expect(text).toContain('Low / Out of stock');
    expect(text).toContain('3');
    expect(text).toContain('1');
  });

  it('renders the low-stock items table', () => {
    const f = configure({ data: fixture() });
    const text = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Low stock items');
    expect(text).toContain('Blue Dream');
    expect(text).toContain('3.5g');
    expect(text).toContain('5'); // on hand
    expect(text).toContain('4'); // available
  });

  it('renders healthy-inventory empty state when no low-stock items', () => {
    const f = configure({
      data: fixture({ lowStockItems: [] }),
    });
    const text = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('All variants are above their reorder threshold.');
    expect(text).not.toContain('Low stock items');
  });

  it('colors out-of-stock availability rose, low-stock availability amber', () => {
    const f = configure({
      data: fixture({
        lowStockItems: [
          {
            __typename: 'LowStockItem',
            variantId: 'v-out',
            productName: 'Out',
            variantName: '1g',
            quantityOnHand: 0,
            quantityAvailable: 0,
          },
          {
            __typename: 'LowStockItem',
            variantId: 'v-low',
            productName: 'Low',
            variantName: '3.5g',
            quantityOnHand: 4,
            quantityAvailable: 2,
          },
        ],
      } as unknown as Partial<Dashboard>),
    });
    const rows = (f.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    const lastCellOf = (row: Element): Element | null => row.querySelector('td:last-child');
    expect(lastCellOf(rows[0])?.className).toContain('text-rose-500');
    expect(lastCellOf(rows[1])?.className).toContain('text-amber-500');
  });
});
