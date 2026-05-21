import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InventoryReceivingPanel } from './inventory-receiving-panel';
import {
  type IncomingTransfer,
  type IncomingTransferItem,
  InventoryReceivingService,
} from './inventory-receiving.service';

interface FakeArgs {
  readonly transfers?: readonly IncomingTransfer[];
  readonly loading?: boolean;
  readonly error?: unknown;
  readonly expandedId?: string | null;
  readonly items?: readonly IncomingTransferItem[];
  readonly itemsLoading?: boolean;
  readonly submittingId?: string | null;
  readonly receive?: ReturnType<typeof vi.fn>;
  readonly toggleExpanded?: ReturnType<typeof vi.fn>;
}

function makeSvc(args: FakeArgs): InventoryReceivingService {
  return {
    transfers: signal<readonly IncomingTransfer[]>(args.transfers ?? []).asReadonly(),
    isLoading: signal<boolean>(args.loading ?? false).asReadonly(),
    error: signal<unknown>(args.error ?? null).asReadonly(),
    expandedId: signal<string | null>(args.expandedId ?? null).asReadonly(),
    expandedItems: signal<readonly IncomingTransferItem[]>(args.items ?? []).asReadonly(),
    itemsLoading: signal<boolean>(args.itemsLoading ?? false).asReadonly(),
    submittingId: signal<string | null>(args.submittingId ?? null).asReadonly(),
    receive: args.receive ?? vi.fn().mockResolvedValue(undefined),
    toggleExpanded: args.toggleExpanded ?? vi.fn(),
  } as unknown as InventoryReceivingService;
}

function configure(args: FakeArgs) {
  const svc = makeSvc(args);
  TestBed.configureTestingModule({
    imports: [InventoryReceivingPanel],
    providers: [{ provide: InventoryReceivingService, useValue: svc }],
  });
  const fixture = TestBed.createComponent(InventoryReceivingPanel);
  fixture.detectChanges();
  return { fixture, svc };
}

function transfer(overrides: Partial<IncomingTransfer> = {}): IncomingTransfer {
  return {
    __typename: 'InventoryTransfer',
    transferId: overrides.transferId ?? 't-1',
    fromDispensaryId: overrides.fromDispensaryId ?? 'partner-disp',
    toDispensaryId: overrides.toDispensaryId ?? 'me-disp',
    status: overrides.status ?? 'shipped',
    notes: overrides.notes ?? null,
    metrcManifestId: overrides.metrcManifestId ?? null,
    requestedByUserId: overrides.requestedByUserId ?? 'u-1',
    approvedByUserId: overrides.approvedByUserId ?? 'u-2',
    approvedAt: overrides.approvedAt ?? '2026-05-19T12:00:00Z',
    shippedAt: overrides.shippedAt ?? '2026-05-20T08:00:00Z',
    receivedAt: overrides.receivedAt ?? null,
    rejectionReason: overrides.rejectionReason ?? null,
    created_at: overrides.created_at ?? '2026-05-19T10:00:00Z',
  } as IncomingTransfer;
}

function item(overrides: Partial<IncomingTransferItem> = {}): IncomingTransferItem {
  return {
    __typename: 'InventoryTransferItem',
    itemId: overrides.itemId ?? 'i-1',
    variantId: overrides.variantId ?? 'v-1',
    productName: overrides.productName ?? 'Blue Dream',
    variantName: overrides.variantName ?? '3.5g',
    quantityRequested: overrides.quantityRequested ?? 10,
    quantityShipped: overrides.quantityShipped ?? 10,
    quantityReceived: overrides.quantityReceived ?? null,
  } as IncomingTransferItem;
}

describe('InventoryReceivingPanel', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders loading state', () => {
    const { fixture } = configure({ loading: true });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Loading incoming transfers…',
    );
  });

  it('renders error banner', () => {
    const { fixture } = configure({ error: new Error('nope') });
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Failed to load transfers');
    expect(alert?.textContent).toContain('nope');
  });

  it('renders empty state when no incoming transfers awaiting receipt', () => {
    const { fixture } = configure({ transfers: [] });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No incoming transfers awaiting receipt.',
    );
  });

  it('lists each incoming transfer with a Record receipt CTA', () => {
    const { fixture } = configure({
      transfers: [transfer({ fromDispensaryId: 'sister-shop' })],
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('From sister-shop');
    expect(text).toContain('Record receipt');
  });

  it('clicking a row calls svc.toggleExpanded with its id', () => {
    const toggleExpanded = vi.fn();
    const { fixture } = configure({
      transfers: [transfer({ transferId: 't-77' })],
      toggleExpanded,
    });
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-expanded]',
    ) as HTMLButtonElement;
    btn.click();
    expect(toggleExpanded).toHaveBeenCalledWith('t-77');
  });

  it('renders the receive form with one row per item when expanded', () => {
    const { fixture } = configure({
      transfers: [transfer({ transferId: 't-9' })],
      expandedId: 't-9',
      items: [
        item({ itemId: 'i-1', productName: 'OG Kush' }),
        item({ itemId: 'i-2', productName: 'Cheese' }),
      ],
    });
    const root = fixture.nativeElement as HTMLElement;
    const rows = root.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(root.textContent).toContain('OG Kush');
    expect(root.textContent).toContain('Cheese');
    const inputs = root.querySelectorAll('input[type="number"]');
    expect(inputs.length).toBe(2);
  });

  it("seeds each row's received input with the expected shipped qty", () => {
    const { fixture } = configure({
      transfers: [transfer({ transferId: 't-9' })],
      expandedId: 't-9',
      items: [item({ quantityShipped: 7 })],
    });
    const input = (fixture.nativeElement as HTMLElement).querySelector(
      'input[type="number"]',
    ) as HTMLInputElement;
    expect(input.valueAsNumber).toBe(7);
  });

  it('shows the variance hint when at least one row diverges from expected', () => {
    const { fixture } = configure({
      transfers: [transfer({ transferId: 't-9' })],
      expandedId: 't-9',
      items: [item({ quantityShipped: 10 })],
    });
    const input = (fixture.nativeElement as HTMLElement).querySelector(
      'input[type="number"]',
    ) as HTMLInputElement;
    input.valueAsNumber = 8;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Variance detected');
  });

  it('submitting calls svc.receive with the correct payload', async () => {
    const receive = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({
      transfers: [transfer({ transferId: 't-50' })],
      expandedId: 't-50',
      items: [item({ itemId: 'i-1', quantityShipped: 5 })],
      receive,
    });
    const root = fixture.nativeElement as HTMLElement;
    const qtyInput = root.querySelector('input[type="number"]') as HTMLInputElement;
    qtyInput.valueAsNumber = 4;
    qtyInput.dispatchEvent(new Event('input'));
    const notesInput = root.querySelector('input[type="text"]') as HTMLInputElement;
    notesInput.value = 'one broken jar';
    notesInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const form = root.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(receive).toHaveBeenCalledWith('t-50', [
      { itemId: 'i-1', quantityReceived: 4, notes: 'one broken jar' },
    ]);
  });

  it('disables submit while the row is submitting', () => {
    const { fixture } = configure({
      transfers: [transfer({ transferId: 't-9' })],
      expandedId: 't-9',
      items: [item()],
      submittingId: 't-9',
    });
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.textContent?.trim()).toContain('Recording…');
  });

  it('shows "Loading items…" while the items resource is pending', () => {
    const { fixture } = configure({
      transfers: [transfer({ transferId: 't-9' })],
      expandedId: 't-9',
      items: [],
      itemsLoading: true,
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Loading items…');
  });
});
