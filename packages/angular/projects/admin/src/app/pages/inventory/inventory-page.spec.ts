import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DashboardService, type Dashboard } from '../dashboard/dashboard.service';
import { InventoryPage } from './inventory-page';

interface FakeArgs {
  readonly data?: Dashboard | null;
  readonly loading?: boolean;
  readonly error?: unknown;
  readonly savingFor?: string | null;
  readonly setReorderThreshold?: ReturnType<typeof vi.fn>;
}

function makeDashboard(args: FakeArgs): DashboardService {
  return {
    data: signal<Dashboard | null>(args.data ?? null).asReadonly(),
    isLoading: signal<boolean>(args.loading ?? false).asReadonly(),
    error: signal<unknown>(args.error ?? null).asReadonly(),
    savingThresholdFor: signal<string | null>(args.savingFor ?? null).asReadonly(),
    setReorderThreshold: args.setReorderThreshold ?? vi.fn().mockResolvedValue(undefined),
  } as unknown as DashboardService;
}

function configure(args: FakeArgs = {}) {
  const svc = makeDashboard(args);
  TestBed.configureTestingModule({
    imports: [InventoryPage],
    providers: [provideRouter([]), { provide: DashboardService, useValue: svc }],
  });
  const fixture = TestBed.createComponent(InventoryPage);
  fixture.detectChanges();
  return { fixture, svc };
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
        inventoryId: 'inv-1',
        variantId: 'v-1',
        productName: 'Blue Dream',
        variantName: '3.5g',
        quantityOnHand: 5,
        quantityAvailable: 4,
        reorderThreshold: 5,
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
    const { fixture: f } = configure({ loading: true });
    expect((f.nativeElement as HTMLElement).textContent).toContain('Loading inventory…');
  });

  it('renders error banner', () => {
    const { fixture: f } = configure({ error: new Error('disconnect') });
    const alert = (f.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Failed to load inventory');
    expect(alert?.textContent).toContain('disconnect');
  });

  it('renders KPI cards from dashboard.inventory', () => {
    const { fixture: f } = configure({ data: fixture() });
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
    const { fixture: f } = configure({ data: fixture() });
    const text = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Low stock items');
    expect(text).toContain('Blue Dream');
    expect(text).toContain('3.5g');
    expect(text).toContain('5'); // on hand
    expect(text).toContain('4'); // available
  });

  it('renders healthy-inventory empty state when no low-stock items', () => {
    const { fixture: f } = configure({
      data: fixture({ lowStockItems: [] }),
    });
    const text = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('All variants are above their reorder threshold.');
    expect(text).not.toContain('Low stock items');
  });

  it('colors out-of-stock availability rose, low-stock availability amber', () => {
    const { fixture: f } = configure({
      data: fixture({
        lowStockItems: [
          {
            __typename: 'LowStockItem',
            inventoryId: 'inv-out',
            variantId: 'v-out',
            productName: 'Out',
            variantName: '1g',
            quantityOnHand: 0,
            quantityAvailable: 0,
            reorderThreshold: 5,
          },
          {
            __typename: 'LowStockItem',
            inventoryId: 'inv-low',
            variantId: 'v-low',
            productName: 'Low',
            variantName: '3.5g',
            quantityOnHand: 4,
            quantityAvailable: 2,
            reorderThreshold: 5,
          },
        ],
      } as unknown as Partial<Dashboard>),
    });
    const rows = (f.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    // Availability column is now the 4th cell (5th is the threshold input).
    const availCellOf = (row: Element): Element | null => row.querySelectorAll('td')[3] ?? null;
    expect(availCellOf(rows[0])?.className).toContain('text-rose-500');
    expect(availCellOf(rows[1])?.className).toContain('text-amber-500');
  });

  it('renders an editable threshold input per row, populated from data', () => {
    const { fixture: f } = configure({ data: fixture() });
    const input = (f.nativeElement as HTMLElement).querySelector(
      'input[aria-label="Reorder threshold for 3.5g"]',
    ) as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.value).toBe('5');
  });

  it('changing the threshold input calls setReorderThreshold with the parsed value', async () => {
    const setReorderThreshold = vi.fn().mockResolvedValue(undefined);
    const { fixture: f } = configure({ data: fixture(), setReorderThreshold });
    const input = (f.nativeElement as HTMLElement).querySelector(
      'input[aria-label="Reorder threshold for 3.5g"]',
    ) as HTMLInputElement;
    input.value = '12';
    input.dispatchEvent(new Event('change'));
    await f.whenStable();
    expect(setReorderThreshold).toHaveBeenCalledWith('inv-1', 12);
  });

  it('clearing the threshold input calls setReorderThreshold with null', async () => {
    const setReorderThreshold = vi.fn().mockResolvedValue(undefined);
    const { fixture: f } = configure({ data: fixture(), setReorderThreshold });
    const input = (f.nativeElement as HTMLElement).querySelector(
      'input[aria-label="Reorder threshold for 3.5g"]',
    ) as HTMLInputElement;
    input.value = '';
    input.dispatchEvent(new Event('change'));
    await f.whenStable();
    expect(setReorderThreshold).toHaveBeenCalledWith('inv-1', null);
  });

  it('disables the threshold input while saving that row', () => {
    const { fixture: f } = configure({ data: fixture(), savingFor: 'inv-1' });
    const input = (f.nativeElement as HTMLElement).querySelector(
      'input[aria-label="Reorder threshold for 3.5g"]',
    ) as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('rejects negative input without calling the mutation', async () => {
    const setReorderThreshold = vi.fn().mockResolvedValue(undefined);
    const { fixture: f } = configure({ data: fixture(), setReorderThreshold });
    const input = (f.nativeElement as HTMLElement).querySelector(
      'input[aria-label="Reorder threshold for 3.5g"]',
    ) as HTMLInputElement;
    input.value = '-3';
    input.dispatchEvent(new Event('change'));
    await f.whenStable();
    expect(setReorderThreshold).not.toHaveBeenCalled();
  });

  it('skips the mutation when the value is unchanged', async () => {
    const setReorderThreshold = vi.fn().mockResolvedValue(undefined);
    const { fixture: f } = configure({ data: fixture(), setReorderThreshold });
    const input = (f.nativeElement as HTMLElement).querySelector(
      'input[aria-label="Reorder threshold for 3.5g"]',
    ) as HTMLInputElement;
    input.value = '5'; // matches the fixture's reorderThreshold
    input.dispatchEvent(new Event('change'));
    await f.whenStable();
    expect(setReorderThreshold).not.toHaveBeenCalled();
  });
});
