import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { StockAlertsService } from '../../core/stock-alerts/stock-alerts.service';
import { DashboardPage } from './dashboard-page';
import { DashboardService, type Dashboard } from './dashboard.service';

interface FakeDashboardServiceArgs {
  readonly data?: Dashboard | null;
  readonly loading?: boolean;
  readonly error?: unknown;
}

function fakeDashboardService(args: FakeDashboardServiceArgs) {
  return {
    data: signal<Dashboard | null>(args.data ?? null).asReadonly(),
    isLoading: signal<boolean>(args.loading ?? false).asReadonly(),
    error: signal<unknown>(args.error ?? null).asReadonly(),
  } as unknown as DashboardService;
}

function fakeStockAlerts() {
  return {
    alerts: signal([]).asReadonly(),
    connected: signal(false).asReadonly(),
    latest: signal(null).asReadonly(),
  } as unknown as StockAlertsService;
}

function dashboardFixture(): Dashboard {
  return {
    __typename: 'DashboardData',
    sales: {
      __typename: 'SalesOverview',
      totalRevenue: 12_345.67,
      totalOrders: 42,
      averageOrderValue: 294.18,
      totalTax: 1234.56,
      completedOrders: 30,
      pendingOrders: 8,
      cancelledOrders: 4,
    },
    salesTrend: [
      {
        __typename: 'SalesTrend',
        period: '2026-05-19',
        revenue: 200,
        orders: 2,
        averageOrderValue: 100,
      },
      {
        __typename: 'SalesTrend',
        period: '2026-05-20',
        revenue: 500,
        orders: 4,
        averageOrderValue: 125,
      },
    ],
    topProducts: [
      {
        __typename: 'TopProduct',
        productId: 'p-1',
        productName: 'Blue Dream 3.5g',
        strainType: 'hybrid',
        unitsSold: 12,
        revenue: 480,
      },
    ],
    categoryBreakdown: [
      {
        __typename: 'CategoryBreakdown',
        category: 'Flower',
        productCount: 5,
        unitsSold: 20,
        revenue: 800,
      },
      {
        __typename: 'CategoryBreakdown',
        category: 'Edibles',
        productCount: 3,
        unitsSold: 12,
        revenue: 240,
      },
    ],
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
      totalSyncs: 100,
      successCount: 95,
      failedCount: 2,
      pendingCount: 3,
      successRate: 95,
      ordersAwaitingSync: 3,
      lastSyncAt: '2026-05-20T12:00:00Z',
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
  } as Dashboard;
}

function configure(args: FakeDashboardServiceArgs) {
  TestBed.configureTestingModule({
    imports: [DashboardPage],
    providers: [
      provideRouter([]),
      provideNoopAnimations(),
      { provide: DashboardService, useValue: fakeDashboardService(args) },
      { provide: StockAlertsService, useValue: fakeStockAlerts() },
    ],
  });
  const fixture = TestBed.createComponent(DashboardPage);
  fixture.detectChanges();
  return fixture;
}

describe('DashboardPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders the loading skeleton while isLoading', () => {
    const fixture = configure({ loading: true });
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Dashboard');
    expect(root.querySelector('[aria-label="Loading dashboard"]')).not.toBeNull();
    expect(root.querySelectorAll('.animate-pulse').length).toBe(4);
  });

  it('renders an error banner when the service surfaces an error', () => {
    const fixture = configure({ error: new Error('Boom') });
    const root = fixture.nativeElement as HTMLElement;
    const alert = root.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toContain('Failed to load dashboard');
    expect(alert?.textContent).toContain('Boom');
  });

  it('renders KPI cards + sales trend + top products when data is loaded', () => {
    const fixture = configure({ data: dashboardFixture() });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Total Revenue');
    expect(text).toContain('$12,345.67');
    expect(text).toContain('Avg Order Value');
    expect(text).toContain('Completed');
    expect(text).toContain('Compliance');
    expect(text).toContain('96%');
    expect(text).toContain('Blue Dream 3.5g');
    expect(text).toContain('12 units');
    expect(text).toContain('$480.00');
  });

  it('renders empty messages when chart data is empty', () => {
    const empty = dashboardFixture();
    empty.salesTrend = [];
    empty.categoryBreakdown = [];
    empty.topProducts = [];
    const fixture = configure({ data: empty });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('No sales data for this period');
    expect(text).toContain('No category data');
    expect(text).toContain('No product data');
  });

  it('renders Metrc + Compliance panels with overview data', () => {
    const fixture = configure({ data: dashboardFixture() });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Metrc Sync Status');
    expect(text).toContain('95%');
    expect(text).toContain('Awaiting Sync');
    expect(text).toContain('Compliance Overview');
    expect(text).toContain('Missing UID');
  });

  it('renders the live low-stock widget with seed data', () => {
    const fixture = configure({ data: dashboardFixture() });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Low Stock Alerts');
    expect(text).toContain('Blue Dream');
    expect(text).toContain('4 left');
  });
});
