import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DashboardService } from '../dashboard/dashboard.service';
import { OrdersPage } from './orders-page';
import {
  OrdersService,
  type OrderDetail,
  type OrderListItem,
  type OrderStatusFilter,
} from './orders.service';

interface FakeArgs {
  readonly orders?: readonly OrderListItem[];
  readonly loading?: boolean;
  readonly error?: unknown;
  readonly statusFilter?: OrderStatusFilter;
  readonly selectedId?: string | null;
  readonly selectedOrder?: OrderDetail | null;
  readonly detailLoading?: boolean;
  readonly cancelling?: boolean;
  readonly setStatusFilter?: ReturnType<typeof vi.fn>;
  readonly select?: ReturnType<typeof vi.fn>;
  readonly cancel?: ReturnType<typeof vi.fn>;
  readonly salesTotalOrders?: number;
  readonly salesCompleted?: number;
  readonly salesPending?: number;
  readonly salesCancelled?: number;
}

function makeOrdersSvc(args: FakeArgs): OrdersService {
  const orders = args.orders ?? [];
  const statusFilter = args.statusFilter ?? 'all';
  const filtered =
    statusFilter === 'all' ? orders : orders.filter((o) => o.orderStatus === statusFilter);
  return {
    allOrders: signal<readonly OrderListItem[]>(orders).asReadonly(),
    filteredOrders: signal<readonly OrderListItem[]>(filtered).asReadonly(),
    isLoading: signal<boolean>(args.loading ?? false).asReadonly(),
    error: signal<unknown>(args.error ?? null).asReadonly(),
    statusFilter: signal<OrderStatusFilter>(statusFilter).asReadonly(),
    selectedId: signal<string | null>(args.selectedId ?? null).asReadonly(),
    selectedOrder: signal<OrderDetail | null>(args.selectedOrder ?? null).asReadonly(),
    detailLoading: signal<boolean>(args.detailLoading ?? false).asReadonly(),
    cancelling: signal<boolean>(args.cancelling ?? false).asReadonly(),
    setStatusFilter: args.setStatusFilter ?? vi.fn(),
    select: args.select ?? vi.fn(),
    cancel: args.cancel ?? vi.fn().mockResolvedValue(undefined),
  } as unknown as OrdersService;
}

function makeDashboard(args: FakeArgs): DashboardService {
  const data = {
    sales: {
      totalOrders: args.salesTotalOrders ?? 100,
      completedOrders: args.salesCompleted ?? 80,
      pendingOrders: args.salesPending ?? 15,
      cancelledOrders: args.salesCancelled ?? 5,
    },
  };
  return {
    data: signal<unknown>(data).asReadonly(),
  } as unknown as DashboardService;
}

function configure(args: FakeArgs = {}) {
  const svc = makeOrdersSvc(args);
  const dashboard = makeDashboard(args);
  TestBed.configureTestingModule({
    imports: [OrdersPage],
    providers: [
      { provide: OrdersService, useValue: svc },
      { provide: DashboardService, useValue: dashboard },
    ],
  });
  const fixture = TestBed.createComponent(OrdersPage);
  fixture.detectChanges();
  return { fixture, svc };
}

function order(overrides: Partial<OrderListItem> = {}): OrderListItem {
  return {
    __typename: 'Order',
    orderId: 'ord-abc12345-rest',
    dispensaryId: 'disp-1',
    customerUserId: 'cust-12345678',
    orderType: 'pickup',
    orderStatus: 'pending',
    subtotal: 50,
    taxTotal: 5,
    total: 55,
    createdAt: '2026-05-20T12:00:00Z',
    updatedAt: '2026-05-20T12:00:00Z',
    ...overrides,
  } as OrderListItem;
}

function detail(overrides: Partial<OrderDetail> = {}): OrderDetail {
  return {
    __typename: 'Order',
    orderId: 'ord-abc12345-rest',
    dispensaryId: 'disp-1',
    customerUserId: null,
    orderType: 'pickup',
    orderStatus: 'pending',
    subtotal: 50,
    discountTotal: 0,
    taxTotal: 5,
    total: 55,
    paymentMethod: 'cash',
    metrcReceiptId: null,
    metrcSyncStatus: null,
    notes: null,
    cancellationReason: null,
    cancelledAt: null,
    createdAt: '2026-05-20T12:00:00Z',
    updatedAt: '2026-05-20T12:00:00Z',
    ...overrides,
  } as OrderDetail;
}

describe('OrdersPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders KPI cards from DashboardService.sales', () => {
    const { fixture } = configure({
      salesTotalOrders: 42,
      salesCompleted: 30,
      salesPending: 8,
      salesCancelled: 4,
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Total');
    expect(text).toContain('42');
    expect(text).toContain('30');
    expect(text).toContain('8');
    expect(text).toContain('4');
  });

  it('renders all status-filter pills', () => {
    const { fixture } = configure();
    const tabs = (fixture.nativeElement as HTMLElement).querySelectorAll('[role="tab"]');
    const labels = Array.from(tabs).map((t) => (t.textContent ?? '').trim());
    expect(labels).toEqual([
      'All',
      'Pending',
      'Confirmed',
      'Preparing',
      'Ready for pickup',
      'Completed',
      'Cancelled',
    ]);
  });

  it('clicking a status pill calls setStatusFilter', () => {
    const setStatusFilter = vi.fn();
    const { fixture } = configure({ setStatusFilter });
    const tabs = (fixture.nativeElement as HTMLElement).querySelectorAll('[role="tab"]');
    (tabs[1] as HTMLButtonElement).click();
    expect(setStatusFilter).toHaveBeenCalledWith('pending');
  });

  it('renders loading state', () => {
    const { fixture } = configure({ loading: true });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Loading orders…');
  });

  it('renders error banner', () => {
    const { fixture } = configure({ error: new Error('disconnect') });
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Failed to load orders');
    expect(alert?.textContent).toContain('disconnect');
  });

  it('renders empty state with no orders for the active filter', () => {
    const { fixture } = configure({ orders: [], statusFilter: 'all' });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No orders found for this filter.',
    );
  });

  it('renders a table row per order with truncated id, formatted total, and badge', () => {
    const { fixture } = configure({
      orders: [order({ orderId: 'abc12345def', total: 123.45, customerUserId: null })],
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('#ABC12345');
    expect(text).toContain('Walk-in');
    expect(text).toContain('$123.45');
    expect(text).toContain('pending');
  });

  it('clicking a row calls select with the order id', () => {
    const select = vi.fn();
    const { fixture } = configure({
      orders: [order({ orderId: 'ord-77' })],
      select,
    });
    const row = (fixture.nativeElement as HTMLElement).querySelector(
      'tbody tr',
    ) as HTMLTableRowElement;
    row.click();
    expect(select).toHaveBeenCalledWith('ord-77');
  });

  it('renders the detail panel when an order is selected', () => {
    const { fixture } = configure({
      orders: [order({ orderId: 'ord-77' })],
      selectedId: 'ord-77',
      selectedOrder: detail({
        orderId: 'ord-77',
        paymentMethod: 'aeropay',
        subtotal: 80,
        taxTotal: 7,
        total: 87,
      }),
    });
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Order details');
    expect(root.textContent).toContain('aeropay');
    expect(root.textContent).toContain('$87.00');
  });

  it('shows the Cancel order button on non-terminal orders', () => {
    const { fixture } = configure({
      orders: [order()],
      selectedId: 'ord-77',
      selectedOrder: detail({ orderStatus: 'pending' }),
    });
    const root = fixture.nativeElement as HTMLElement;
    const btns = Array.from(root.querySelectorAll('button'));
    const cancelBtn = btns.find((b) => (b.textContent ?? '').trim() === 'Cancel order');
    expect(cancelBtn).not.toBeUndefined();
  });

  it('hides the Cancel order button on terminal orders', () => {
    const { fixture } = configure({
      orders: [order()],
      selectedId: 'ord-77',
      selectedOrder: detail({ orderStatus: 'completed' }),
    });
    const root = fixture.nativeElement as HTMLElement;
    const btns = Array.from(root.querySelectorAll('button'));
    const cancelBtn = btns.find((b) => (b.textContent ?? '').trim() === 'Cancel order');
    expect(cancelBtn).toBeUndefined();
  });

  it('cancel flow: opens dialog, requires reason, calls svc.cancel with reason', async () => {
    const cancel = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({
      orders: [order({ orderId: 'ord-77' })],
      selectedId: 'ord-77',
      selectedOrder: detail({ orderId: 'ord-77', orderStatus: 'pending' }),
      cancel,
    });
    const root = fixture.nativeElement as HTMLElement;

    const openBtn = Array.from(root.querySelectorAll('button')).find(
      (b) => (b.textContent ?? '').trim() === 'Cancel order',
    ) as HTMLButtonElement;
    openBtn.click();
    fixture.detectChanges();

    const reasonInput = root.querySelector(
      'input[aria-label="Cancellation reason"]',
    ) as HTMLInputElement;
    expect(reasonInput).not.toBeNull();

    // Confirm is disabled when reason is blank
    let confirmBtn = Array.from(root.querySelectorAll('button')).find((b) =>
      (b.textContent ?? '').trim().startsWith('Confirm cancel'),
    ) as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(true);

    reasonInput.value = 'out of stock';
    reasonInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    confirmBtn = Array.from(root.querySelectorAll('button')).find((b) =>
      (b.textContent ?? '').trim().startsWith('Confirm cancel'),
    ) as HTMLButtonElement;
    confirmBtn.click();
    await fixture.whenStable();

    expect(cancel).toHaveBeenCalledWith('ord-77', 'out of stock');
  });

  it('Back closes the cancel dialog', () => {
    const { fixture } = configure({
      orders: [order()],
      selectedId: 'ord-77',
      selectedOrder: detail({ orderStatus: 'pending' }),
    });
    const root = fixture.nativeElement as HTMLElement;
    const openBtn = Array.from(root.querySelectorAll('button')).find(
      (b) => (b.textContent ?? '').trim() === 'Cancel order',
    ) as HTMLButtonElement;
    openBtn.click();
    fixture.detectChanges();
    const backBtn = Array.from(root.querySelectorAll('button')).find(
      (b) => (b.textContent ?? '').trim() === 'Back',
    ) as HTMLButtonElement;
    backBtn.click();
    fixture.detectChanges();
    const reasonInput = root.querySelector('input[aria-label="Cancellation reason"]');
    expect(reasonInput).toBeNull();
  });
});
