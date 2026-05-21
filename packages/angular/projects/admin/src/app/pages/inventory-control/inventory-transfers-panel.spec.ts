import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService, type AdminRole } from '../../core/auth/auth.service';
import { InventoryTransfersPanel } from './inventory-transfers-panel';
import {
  InventoryTransfersService,
  type InventoryTransfer,
  type InventoryTransferItem,
  type TransferDirection,
} from './inventory-transfers.service';

interface FakeArgs {
  readonly transfers?: readonly InventoryTransfer[];
  readonly loading?: boolean;
  readonly error?: unknown;
  readonly direction?: TransferDirection;
  readonly expandedId?: string | null;
  readonly expandedItems?: readonly InventoryTransferItem[];
  readonly itemsLoading?: boolean;
  readonly mutatingId?: string | null;
  readonly approve?: ReturnType<typeof vi.fn>;
  readonly ship?: ReturnType<typeof vi.fn>;
  readonly toggleExpanded?: ReturnType<typeof vi.fn>;
  readonly setDirection?: ReturnType<typeof vi.fn>;
  readonly role?: AdminRole;
  readonly myDispensaryId?: string;
}

function makeSvc(args: FakeArgs) {
  return {
    transfers: signal<readonly InventoryTransfer[]>(args.transfers ?? []).asReadonly(),
    isLoading: signal<boolean>(args.loading ?? false).asReadonly(),
    error: signal<unknown>(args.error ?? null).asReadonly(),
    direction: signal<TransferDirection>(args.direction ?? 'all').asReadonly(),
    expandedId: signal<string | null>(args.expandedId ?? null).asReadonly(),
    expandedItems: signal<readonly InventoryTransferItem[]>(args.expandedItems ?? []).asReadonly(),
    itemsLoading: signal<boolean>(args.itemsLoading ?? false).asReadonly(),
    mutatingId: signal<string | null>(args.mutatingId ?? null).asReadonly(),
    approve: args.approve ?? vi.fn().mockResolvedValue(undefined),
    ship: args.ship ?? vi.fn().mockResolvedValue(undefined),
    toggleExpanded: args.toggleExpanded ?? vi.fn(),
    setDirection: args.setDirection ?? vi.fn(),
  } as unknown as InventoryTransfersService;
}

function makeAuth(args: FakeArgs) {
  const role = args.role ?? 'org_admin';
  const dispensaryId = args.myDispensaryId ?? 'me-disp';
  return {
    user: () => ({
      id: 'u-1',
      email: 'a@a.com',
      role,
      dispensaryId,
    }),
    role: () => role,
  } as unknown as AuthService;
}

function configure(args: FakeArgs) {
  const svc = makeSvc(args);
  const auth = makeAuth(args);
  TestBed.configureTestingModule({
    imports: [InventoryTransfersPanel],
    providers: [
      { provide: InventoryTransfersService, useValue: svc },
      { provide: AuthService, useValue: auth },
    ],
  });
  const fixture = TestBed.createComponent(InventoryTransfersPanel);
  fixture.detectChanges();
  return { fixture, svc, auth };
}

function transfer(overrides: Partial<InventoryTransfer> = {}): InventoryTransfer {
  return {
    __typename: 'InventoryTransfer',
    transferId: overrides.transferId ?? 't-1',
    fromDispensaryId: overrides.fromDispensaryId ?? 'me-disp',
    toDispensaryId: overrides.toDispensaryId ?? 'partner-disp',
    status: overrides.status ?? 'pending',
    notes: overrides.notes ?? null,
    metrcManifestId: overrides.metrcManifestId ?? null,
    requestedByUserId: overrides.requestedByUserId ?? 'u-1',
    approvedByUserId: overrides.approvedByUserId ?? null,
    approvedAt: overrides.approvedAt ?? null,
    shippedAt: overrides.shippedAt ?? null,
    receivedAt: overrides.receivedAt ?? null,
    rejectionReason: overrides.rejectionReason ?? null,
    created_at: overrides.created_at ?? '2026-05-20T12:00:00Z',
  } as InventoryTransfer;
}

describe('InventoryTransfersPanel', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders the direction filter buttons', () => {
    const { fixture } = configure({});
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '[role="group"] button',
    );
    const labels = Array.from(buttons).map((b) => (b.textContent ?? '').trim());
    expect(labels).toEqual(['All', 'Incoming', 'Outgoing']);
  });

  it('clicking a direction filter calls svc.setDirection', () => {
    const setDirection = vi.fn();
    const { fixture } = configure({ setDirection });
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '[role="group"] button',
    );
    (buttons[1] as HTMLButtonElement).click();
    expect(setDirection).toHaveBeenCalledWith('incoming');
  });

  it('renders loading state', () => {
    const { fixture } = configure({ loading: true });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Loading transfers…');
  });

  it('renders error banner', () => {
    const { fixture } = configure({ error: new Error('nope') });
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Failed to load transfers');
    expect(alert?.textContent).toContain('nope');
  });

  it('renders empty state when there are no transfers', () => {
    const { fixture } = configure({ transfers: [] });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No transfers found.');
  });

  it('labels an incoming transfer correctly', () => {
    const { fixture } = configure({
      transfers: [transfer({ fromDispensaryId: 'partner-disp', toDispensaryId: 'me-disp' })],
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('← Incoming');
    expect(text).toContain('partner-disp');
  });

  it('labels an outgoing transfer correctly', () => {
    const { fixture } = configure({
      transfers: [transfer({ fromDispensaryId: 'me-disp', toDispensaryId: 'partner-disp' })],
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('→ Outgoing');
    expect(text).toContain('partner-disp');
  });

  it('renders Approve button on pending row for org_admin', () => {
    const { fixture } = configure({
      role: 'org_admin',
      transfers: [transfer({ transferId: 't-1', status: 'pending' })],
    });
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label^="Approve transfer"]',
    );
    expect(btn).not.toBeNull();
  });

  it('renders Ship button on approved row for super_admin', () => {
    const { fixture } = configure({
      role: 'super_admin',
      transfers: [transfer({ transferId: 't-1', status: 'approved' })],
    });
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label^="Ship transfer"]',
    );
    expect(btn).not.toBeNull();
  });

  it('hides action buttons for dispensary_admin', () => {
    const { fixture } = configure({
      role: 'dispensary_admin',
      transfers: [transfer({ transferId: 't-1', status: 'pending' })],
    });
    const approve = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label^="Approve transfer"]',
    );
    const ship = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label^="Ship transfer"]',
    );
    expect(approve).toBeNull();
    expect(ship).toBeNull();
  });

  it('clicking Approve invokes svc.approve with the row id', () => {
    const approve = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({
      role: 'org_admin',
      transfers: [transfer({ transferId: 't-42', status: 'pending' })],
      approve,
    });
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label^="Approve transfer"]',
    ) as HTMLButtonElement;
    btn.click();
    expect(approve).toHaveBeenCalledWith('t-42');
  });

  it('clicking Ship invokes svc.ship with the row id', () => {
    const ship = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({
      role: 'org_admin',
      transfers: [transfer({ transferId: 't-99', status: 'approved' })],
      ship,
    });
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label^="Ship transfer"]',
    ) as HTMLButtonElement;
    btn.click();
    expect(ship).toHaveBeenCalledWith('t-99');
  });

  it('clicking a row toggles expansion via svc.toggleExpanded', () => {
    const toggleExpanded = vi.fn();
    const { fixture } = configure({
      transfers: [transfer({ transferId: 't-7' })],
      toggleExpanded,
    });
    const row = (fixture.nativeElement as HTMLElement).querySelector(
      'tbody tr',
    ) as HTMLTableRowElement;
    row.click();
    expect(toggleExpanded).toHaveBeenCalledWith('t-7');
  });

  it('shows the expanded items panel when expandedId matches', () => {
    const { fixture } = configure({
      transfers: [transfer({ transferId: 't-7' })],
      expandedId: 't-7',
      expandedItems: [
        {
          __typename: 'InventoryTransferItem',
          itemId: 'i-1',
          variantId: 'v-1',
          productName: 'Blue Dream',
          variantName: '3.5g',
          quantityRequested: 10,
          quantityShipped: null,
          quantityReceived: null,
        } as InventoryTransferItem,
      ],
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Blue Dream');
    expect(text).toContain('3.5g');
  });
});
