import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InventoryControlPage } from './inventory-control-page';
import {
  InventoryAdjustmentsService,
  type InventoryAdjustment,
} from './inventory-adjustments.service';

interface FakeSvcArgs {
  readonly adjustments?: readonly InventoryAdjustment[];
  readonly loading?: boolean;
  readonly error?: unknown;
  readonly approve?: ReturnType<typeof vi.fn>;
  readonly approvingId?: string | null;
}

function fakeSvc(args: FakeSvcArgs) {
  return {
    adjustments: signal<readonly InventoryAdjustment[]>(args.adjustments ?? []).asReadonly(),
    isLoading: signal<boolean>(args.loading ?? false).asReadonly(),
    error: signal<unknown>(args.error ?? null).asReadonly(),
    approvingId: signal<string | null>(args.approvingId ?? null).asReadonly(),
    approve: args.approve ?? vi.fn().mockResolvedValue(undefined),
  } as unknown as InventoryAdjustmentsService;
}

function configure(args: FakeSvcArgs) {
  const svc = fakeSvc(args);
  TestBed.configureTestingModule({
    imports: [InventoryControlPage],
    providers: [{ provide: InventoryAdjustmentsService, useValue: svc }],
  });
  const fixture = TestBed.createComponent(InventoryControlPage);
  fixture.detectChanges();
  return { fixture, svc };
}

function adj(overrides: Partial<InventoryAdjustment> = {}): InventoryAdjustment {
  return {
    __typename: 'InventoryAdjustment',
    adjustmentId: overrides.adjustmentId ?? 'adj-1',
    productName: overrides.productName ?? 'Blue Dream 3.5g',
    quantityChange: overrides.quantityChange ?? -2,
    quantityBefore: overrides.quantityBefore ?? 10,
    quantityAfter: overrides.quantityAfter ?? 8,
    status: overrides.status ?? 'pending',
    notes: overrides.notes ?? 'damaged on shelf',
    created_at: overrides.created_at ?? '2026-05-20T12:00:00Z',
    approvedAt: overrides.approvedAt ?? null,
    approvedByUserId: overrides.approvedByUserId ?? null,
    reasonId: overrides.reasonId ?? 1,
  } as InventoryAdjustment;
}

describe('InventoryControlPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders the page title and three tabs', () => {
    const { fixture } = configure({});
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Inventory Control');
    const tabs = (fixture.nativeElement as HTMLElement).querySelectorAll('[role="tab"]');
    const tabLabels = Array.from(tabs).map((t) => (t.textContent ?? '').trim());
    expect(tabLabels).toEqual(['Adjustments', 'Transfers', 'Receiving']);
  });

  it('defaults to the Adjustments tab', () => {
    const { fixture } = configure({});
    const selected = (fixture.nativeElement as HTMLElement).querySelector(
      '[role="tab"][aria-selected="true"]',
    );
    expect(selected?.textContent?.trim()).toBe('Adjustments');
  });

  it('switches to the Transfers panel when clicked (transfers panel has its own spec)', () => {
    const { fixture } = configure({});
    const root = fixture.nativeElement as HTMLElement;
    const transfersTab = Array.from(root.querySelectorAll('[role="tab"]')).find(
      (t) => (t.textContent ?? '').trim() === 'Transfers',
    ) as HTMLButtonElement;
    transfersTab.click();
    fixture.detectChanges();
    const panel = root.querySelector('#tab-transfers');
    expect(panel).not.toBeNull();
    expect(panel?.querySelector('cs-inventory-transfers-panel')).not.toBeNull();
  });

  it('switches to the Receiving panel when clicked (receiving panel has its own spec)', () => {
    const { fixture } = configure({});
    const root = fixture.nativeElement as HTMLElement;
    const receivingTab = Array.from(root.querySelectorAll('[role="tab"]')).find(
      (t) => (t.textContent ?? '').trim() === 'Receiving',
    ) as HTMLButtonElement;
    receivingTab.click();
    fixture.detectChanges();
    const panel = root.querySelector('#tab-receiving');
    expect(panel).not.toBeNull();
    expect(panel?.querySelector('cs-inventory-receiving-panel')).not.toBeNull();
  });

  it('renders loading state when isLoading is true', () => {
    const { fixture } = configure({ loading: true });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Loading adjustments…');
  });

  it('renders an error banner when the service surfaces an error', () => {
    const { fixture } = configure({ error: new Error('boom') });
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Failed to load adjustments');
    expect(alert?.textContent).toContain('boom');
  });

  it('renders empty state when no adjustments', () => {
    const { fixture } = configure({ adjustments: [] });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('No adjustments found.');
  });

  it('renders the adjustment log table with one pending row', () => {
    const { fixture } = configure({
      adjustments: [adj({ productName: 'OG Kush 1g', quantityChange: -3 })],
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Adjustment Log');
    expect(text).toContain('OG Kush 1g');
    expect(text).toContain('-3');
    expect(text).toContain('pending');
    const approveBtn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label^="Approve adjustment"]',
    );
    expect(approveBtn).not.toBeNull();
  });

  it('does not render an Approve button for already-approved rows', () => {
    const { fixture } = configure({
      adjustments: [adj({ adjustmentId: 'adj-x', status: 'approved' })],
    });
    const approveBtn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label^="Approve adjustment"]',
    );
    expect(approveBtn).toBeNull();
  });

  it('clicking Approve invokes the service.approve() with the correct id', () => {
    const approve = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({
      adjustments: [adj({ adjustmentId: 'adj-42' })],
      approve,
    });
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label^="Approve adjustment"]',
    ) as HTMLButtonElement;
    btn.click();
    expect(approve).toHaveBeenCalledWith('adj-42');
  });
});
