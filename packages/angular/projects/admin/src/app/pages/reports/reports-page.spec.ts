import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ReportsPage } from './reports-page';
import {
  ReportsService,
  type LaborCostReport,
  type ReportTab,
  type SalesReport,
  type ShrinkageReport,
  type TaxReport,
} from './reports.service';

interface FakeArgs {
  readonly tab?: ReportTab;
  readonly sales?: SalesReport | null;
  readonly tax?: TaxReport | null;
  readonly labor?: LaborCostReport | null;
  readonly shrinkage?: ShrinkageReport | null;
  readonly loading?: boolean;
  readonly error?: unknown;
  readonly setTab?: ReturnType<typeof vi.fn>;
  readonly setStartDate?: ReturnType<typeof vi.fn>;
  readonly setEndDate?: ReturnType<typeof vi.fn>;
}

function makeSvc(args: FakeArgs): ReportsService {
  return {
    tab: signal<ReportTab>(args.tab ?? 'sales').asReadonly(),
    startDate: signal<string>('2026-04-22').asReadonly(),
    endDate: signal<string>('2026-05-22').asReadonly(),
    sales: signal<SalesReport | null>(args.sales ?? null).asReadonly(),
    tax: signal<TaxReport | null>(args.tax ?? null).asReadonly(),
    labor: signal<LaborCostReport | null>(args.labor ?? null).asReadonly(),
    shrinkage: signal<ShrinkageReport | null>(args.shrinkage ?? null).asReadonly(),
    isLoading: signal<boolean>(args.loading ?? false).asReadonly(),
    error: signal<unknown>(args.error ?? null).asReadonly(),
    setTab: args.setTab ?? vi.fn(),
    setStartDate: args.setStartDate ?? vi.fn(),
    setEndDate: args.setEndDate ?? vi.fn(),
  } as unknown as ReportsService;
}

function configure(args: FakeArgs = {}) {
  const svc = makeSvc(args);
  TestBed.configureTestingModule({
    imports: [ReportsPage],
    providers: [{ provide: ReportsService, useValue: svc }],
  });
  const f = TestBed.createComponent(ReportsPage);
  f.detectChanges();
  return { fixture: f, svc };
}

function salesFixture(overrides: Partial<SalesReport> = {}): SalesReport {
  return {
    __typename: 'SalesSummary',
    totalOrders: 50,
    completedOrders: 48,
    cancelledOrders: 2,
    grossSales: 10_000,
    totalDiscounts: 500,
    totalTax: 800,
    netRevenue: 9_500,
    avgOrderValue: 198,
    deliveryOrders: 10,
    pickupOrders: 38,
    cashOrders: 25,
    cardOrders: 23,
    totalCashDiscounts: 50,
    ...overrides,
  } as SalesReport;
}

describe('ReportsPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders the 4 tabs with sales selected by default', () => {
    const { fixture } = configure({ tab: 'sales' });
    const tabs = (fixture.nativeElement as HTMLElement).querySelectorAll('[role="tab"]');
    const labels = Array.from(tabs).map((t) => (t.textContent ?? '').trim());
    expect(labels).toEqual(['Sales', 'Tax', 'Staff', 'Inventory']);
    const selected = Array.from(tabs).find((t) => t.getAttribute('aria-selected') === 'true');
    expect((selected?.textContent ?? '').trim()).toBe('Sales');
  });

  it('renders loading state', () => {
    const { fixture } = configure({ loading: true });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Loading report…');
  });

  it('renders error banner', () => {
    const { fixture } = configure({ error: new Error('boom') });
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Failed to load report');
  });

  it('clicking a tab calls svc.setTab', () => {
    const setTab = vi.fn();
    const { fixture } = configure({ setTab });
    const tabs = (fixture.nativeElement as HTMLElement).querySelectorAll('[role="tab"]');
    (tabs[1] as HTMLButtonElement).click();
    expect(setTab).toHaveBeenCalledWith('tax');
  });

  it('renders sales KPIs when sales data is loaded', () => {
    const { fixture } = configure({ tab: 'sales', sales: salesFixture() });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('48');
    expect(text).toContain('$9,500.00');
    expect(text).toContain('Net revenue');
    expect(text).toContain('-$500.00');
    expect(text).toContain('38 / 10');
    expect(text).toContain('25 / 23');
    expect(text).toContain('Cash discounts: $50.00');
  });

  it('renders empty sales state when null', () => {
    const { fixture } = configure({ tab: 'sales', sales: null });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No sales data for this period.',
    );
  });

  it('renders tax breakdown table when on tax tab', () => {
    const { fixture } = configure({
      tab: 'tax',
      tax: {
        __typename: 'TaxReport',
        dispensaryName: 'D',
        state: 'NY',
        licenseNumber: 'LIC-001',
        taxableSales: 10_000,
        totalDiscounts: 500,
        netTaxable: 9_500,
        totalTaxCollected: 850,
        transactionCount: 50,
        taxBreakdown: [
          {
            __typename: 'TaxBreakdownItem',
            taxName: 'NY Excise',
            taxCode: 'NY_EXC',
            rate: 0.09,
            taxBasis: 'retail_price',
            statutoryReference: 'NY § 130',
            estimatedTax: 855,
          },
        ],
      } as unknown as TaxReport,
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Taxable sales');
    expect(text).toContain('$10,000.00');
    expect(text).toContain('License: LIC-001');
    expect(text).toContain('NY Excise');
    expect(text).toContain('9.00%');
    expect(text).toContain('$855.00');
  });

  it('renders staff labor KPIs with colored labor %', () => {
    const { fixture } = configure({
      tab: 'staff',
      labor: {
        __typename: 'LaborCostSummary',
        employeeCount: 12,
        totalHours: 480.5,
        totalLaborCost: 9600,
        totalRevenue: 40_000,
        laborCostPercent: 24,
      } as unknown as LaborCostReport,
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('12');
    expect(text).toContain('480.5');
    expect(text).toContain('$9,600.00');
    expect(text).toContain('24%');
    const pct = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('p')).find(
      (p) => (p.textContent ?? '').trim() === '24%',
    );
    expect(pct?.className).toContain('text-amber-500');
  });

  it('renders inventory shrinkage rows', () => {
    const { fixture } = configure({
      tab: 'inventory',
      shrinkage: {
        __typename: 'ShrinkageReport',
        totalAdjustments: 7,
        totalUnitsLost: 12,
        estimatedValueLost: 350.5,
        byReason: [
          {
            __typename: 'ShrinkageByReason',
            reason: 'Damage',
            reasonCode: 'damage',
            count: 4,
            units: 8,
            estimatedValue: 240,
          },
        ],
      } as unknown as ShrinkageReport,
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Adjustments');
    expect(text).toContain('7');
    expect(text).toContain('Units lost');
    expect(text).toContain('12');
    expect(text).toContain('$350.50');
    expect(text).toContain('Damage');
    expect(text).toContain('$240.00');
  });

  it('changing start date calls svc.setStartDate', () => {
    const setStartDate = vi.fn();
    const { fixture } = configure({ setStartDate });
    const input = (fixture.nativeElement as HTMLElement).querySelector(
      'input[aria-label="Start date"]',
    ) as HTMLInputElement;
    input.value = '2026-03-01';
    input.dispatchEvent(new Event('change'));
    expect(setStartDate).toHaveBeenCalledWith('2026-03-01');
  });

  it('changing end date calls svc.setEndDate', () => {
    const setEndDate = vi.fn();
    const { fixture } = configure({ setEndDate });
    const input = (fixture.nativeElement as HTMLElement).querySelector(
      'input[aria-label="End date"]',
    ) as HTMLInputElement;
    input.value = '2026-05-30';
    input.dispatchEvent(new Event('change'));
    expect(setEndDate).toHaveBeenCalledWith('2026-05-30');
  });
});
