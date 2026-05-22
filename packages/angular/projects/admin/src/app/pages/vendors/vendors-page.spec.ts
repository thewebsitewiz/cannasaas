import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VendorsPage } from './vendors-page';
import {
  VendorsService,
  type PurchaseOrder,
  type Vendor,
  type VendorStats,
} from './vendors.service';

interface FakeArgs {
  readonly vendors?: readonly Vendor[];
  readonly stats?: VendorStats | null;
  readonly purchaseOrders?: readonly PurchaseOrder[];
  readonly loading?: boolean;
  readonly error?: unknown;
  readonly saving?: boolean;
  readonly showPOs?: boolean;
  readonly purchaseOrdersLoading?: boolean;
  readonly create?: ReturnType<typeof vi.fn>;
  readonly togglePurchaseOrders?: ReturnType<typeof vi.fn>;
}

function makeSvc(args: FakeArgs): VendorsService {
  return {
    vendors: signal<readonly Vendor[]>(args.vendors ?? []).asReadonly(),
    stats: signal<VendorStats | null>(args.stats ?? null).asReadonly(),
    purchaseOrders: signal<readonly PurchaseOrder[]>(args.purchaseOrders ?? []).asReadonly(),
    isLoading: signal<boolean>(args.loading ?? false).asReadonly(),
    error: signal<unknown>(args.error ?? null).asReadonly(),
    saving: signal<boolean>(args.saving ?? false).asReadonly(),
    showPurchaseOrders: signal<boolean>(args.showPOs ?? false).asReadonly(),
    purchaseOrdersLoading: signal<boolean>(args.purchaseOrdersLoading ?? false).asReadonly(),
    create: args.create ?? vi.fn().mockResolvedValue(undefined),
    togglePurchaseOrders: args.togglePurchaseOrders ?? vi.fn(),
  } as unknown as VendorsService;
}

function configure(args: FakeArgs = {}) {
  const svc = makeSvc(args);
  TestBed.configureTestingModule({
    imports: [VendorsPage],
    providers: [{ provide: VendorsService, useValue: svc }],
  });
  const f = TestBed.createComponent(VendorsPage);
  f.detectChanges();
  return { fixture: f, svc };
}

function vendor(overrides: Partial<Vendor> = {}): Vendor {
  return {
    __typename: 'Vendor',
    vendor_id: 'v-1',
    name: 'Acme Cultivation',
    vendor_type: 'cultivator',
    state: 'NY',
    license_number: 'NY-123',
    license_state: 'NY',
    phone: '555-1234',
    email: 'sales@acme.example',
    payment_terms: 'net_30',
    rating: 4.5,
    is_active: true,
    total_pos: 8,
    total_spend: 24_000,
    ...overrides,
  } as Vendor;
}

function stats(overrides: Partial<VendorStats> = {}): VendorStats {
  return {
    __typename: 'VendorStats',
    activeVendors: 12,
    totalPOs: 50,
    openPOs: 7,
    totalSpend: 125_000,
    outstanding: 5_000,
    ...overrides,
  } as VendorStats;
}

describe('VendorsPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders loading state', () => {
    const { fixture } = configure({ loading: true });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Loading vendors…');
  });

  it('renders error banner', () => {
    const { fixture } = configure({ error: new Error('disconnect') });
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Failed to load vendors');
    expect(alert?.textContent).toContain('disconnect');
  });

  it('renders 5 KPI cards from stats', () => {
    const { fixture } = configure({
      stats: stats(),
      vendors: [vendor()],
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Active vendors');
    expect(text).toContain('12');
    expect(text).toContain('Total POs');
    expect(text).toContain('50');
    expect(text).toContain('Open POs');
    expect(text).toContain('7');
    expect(text).toContain('Total spend');
    expect(text).toContain('$125,000');
    expect(text).toContain('Outstanding');
    expect(text).toContain('$5,000');
  });

  it('renders empty state when no vendors', () => {
    const { fixture } = configure({ stats: stats(), vendors: [] });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No vendors yet.');
  });

  it('renders a vendor row with type badge, license, payment terms, rating', () => {
    const { fixture } = configure({
      stats: stats(),
      vendors: [
        vendor({
          name: 'Pacific Cultivators',
          vendor_type: 'cultivator',
          license_number: 'CA-001',
          payment_terms: 'net_45',
          rating: 4.8,
          total_pos: 15,
          total_spend: 80_000,
        }),
      ],
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Pacific Cultivators');
    expect(text).toContain('cultivator');
    expect(text).toContain('CA-001');
    expect(text).toContain('net 45');
    expect(text).toContain('★ 4.8');
    expect(text).toContain('15');
    expect(text).toContain('$80,000');
  });

  it('toggling Show POs calls svc.togglePurchaseOrders', () => {
    const togglePurchaseOrders = vi.fn();
    const { fixture } = configure({ stats: stats(), togglePurchaseOrders });
    const btn = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(
      (b) => (b.textContent ?? '').trim() === 'Show POs',
    ) as HTMLButtonElement;
    btn.click();
    expect(togglePurchaseOrders).toHaveBeenCalledTimes(1);
  });

  it('renders the PO table when showPOs is true', () => {
    const { fixture } = configure({
      stats: stats(),
      showPOs: true,
      purchaseOrders: [
        {
          __typename: 'PurchaseOrder',
          po_id: 'po-1',
          po_number: 'PO-100',
          status: 'received',
          vendor_name: 'Acme',
          total: 1500,
          payment_status: 'paid',
          line_items: 4,
          order_date: '2026-05-01',
        } as PurchaseOrder,
      ],
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Purchase orders');
    expect(text).toContain('PO-100');
    expect(text).toContain('received');
    expect(text).toContain('paid');
    expect(text).toContain('$1,500');
  });

  it('shows "No purchase orders yet." in PO panel when empty', () => {
    const { fixture } = configure({ stats: stats(), showPOs: true, purchaseOrders: [] });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No purchase orders yet.');
  });

  it('clicking New vendor opens the create form', () => {
    const { fixture } = configure({ stats: stats() });
    const newBtn = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((b) => (b.textContent ?? '').trim() === '+ New vendor') as HTMLButtonElement;
    newBtn.click();
    fixture.detectChanges();
    const form = (fixture.nativeElement as HTMLElement).querySelector(
      'form[aria-label="Create vendor"]',
    );
    expect(form).not.toBeNull();
  });

  it('submit calls svc.create with the form values + empty strings normalized to null', async () => {
    const create = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({ stats: stats(), create });
    const newBtn = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((b) => (b.textContent ?? '').trim() === '+ New vendor') as HTMLButtonElement;
    newBtn.click();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const setField = (label: string, value: string) => {
      const input = root.querySelector(`[aria-label="${label}"]`) as
        | HTMLInputElement
        | HTMLSelectElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('change'));
    };
    setField('Vendor name', 'New Vendor');
    setField('Vendor email', 'sales@x.com');
    fixture.detectChanges();

    const form = root.querySelector('form[aria-label="Create vendor"]') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(create).toHaveBeenCalledTimes(1);
    const callArgs = create.mock.calls[0][0] as {
      name: string;
      vendorType: string;
      email: string | null;
      phone: string | null;
    };
    expect(callArgs.name).toBe('New Vendor');
    expect(callArgs.vendorType).toBe('cultivator');
    expect(callArgs.email).toBe('sales@x.com');
    expect(callArgs.phone).toBeNull();
  });
});
