/**
 * StockAlertToasts specs (sc-549, sc-550, sc-555, sc-556, sc-557).
 * Stubs StockAlertsService — the service's own behavior is covered
 * by stock-alerts.service.spec.ts.
 */
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StockAlertsService, type StockAlert } from '../core/stock-alerts/stock-alerts.service';
import { StockAlertToasts } from './stock-alert-toasts';

interface FakeArgs {
  readonly alerts?: readonly StockAlert[];
  readonly markRead?: ReturnType<typeof vi.fn>;
  readonly dismiss?: ReturnType<typeof vi.fn>;
}

function makeStockAlerts(args: FakeArgs = {}): StockAlertsService {
  const alertsSignal = signal<readonly StockAlert[]>(args.alerts ?? []);
  return {
    alerts: alertsSignal.asReadonly(),
    markRead: args.markRead ?? vi.fn(),
    dismiss: args.dismiss ?? vi.fn(),
  } as unknown as StockAlertsService;
}

function configure(args: FakeArgs = {}) {
  const svc = makeStockAlerts(args);
  TestBed.configureTestingModule({
    imports: [StockAlertToasts],
    providers: [
      // Register /inventory so RouterLink clicks don't 404 in the test.
      provideRouter([{ path: 'inventory', children: [] }]),
      { provide: StockAlertsService, useValue: svc },
    ],
  });
  const fixture = TestBed.createComponent(StockAlertToasts);
  fixture.detectChanges();
  return { fixture, svc };
}

function alert(overrides: Partial<StockAlert> = {}): StockAlert {
  return {
    id: 'a-1',
    type: 'low_stock',
    productName: 'Blue Dream 1g',
    quantity: 3,
    timestamp: '2026-05-19T12:00:00Z',
    read: false,
    ...overrides,
  };
}

describe('StockAlertToasts', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useRealTimers();
  });

  // ── TC-TST-002 (sc-549) — Low-stock alert renders amber ────────────────────

  it('TC-TST-002 — low_stock alert renders with amber styling', () => {
    const { fixture } = configure({ alerts: [alert({ type: 'low_stock' })] });
    const root = fixture.nativeElement as HTMLElement;
    const card = root.querySelector('a[href="/inventory"]') as HTMLAnchorElement;
    expect(card).not.toBeNull();
    expect(card.className).toMatch(/amber-/);
    expect(card.className).not.toMatch(/rose-/);
    expect(card.textContent ?? '').toContain('Low stock');
  });

  // ── TC-TST-003 (sc-550) — Out-of-stock alert renders rose ──────────────────

  it('TC-TST-003 — out_of_stock alert renders with rose styling', () => {
    const { fixture } = configure({
      alerts: [alert({ id: 'a-2', type: 'out_of_stock', quantity: 0 })],
    });
    const root = fixture.nativeElement as HTMLElement;
    const card = root.querySelector('a[href="/inventory"]') as HTMLAnchorElement;
    expect(card.className).toMatch(/rose-/);
    expect(card.className).not.toMatch(/amber-/);
    expect(card.textContent ?? '').toContain('Out of stock');
  });

  // ── TC-TST-009 (sc-556) — Click-through to inventory ───────────────────────

  it('TC-TST-009 — clicking the toast routes to /inventory and marks the alert read', async () => {
    const markRead = vi.fn();
    const { fixture } = configure({ alerts: [alert({ id: 'x-9' })], markRead });
    const card = (fixture.nativeElement as HTMLElement).querySelector(
      'a[href="/inventory"]',
    ) as HTMLAnchorElement;
    card.click();
    expect(markRead).toHaveBeenCalledWith('x-9');
    // The href is the routerLink — proves the click target is /inventory.
    expect(card.getAttribute('href')).toBe('/inventory');
    // Let the RouterLink's async navigation settle before TestBed tears
    // down — otherwise a stray microtask throws NG0205 on a destroyed
    // injector. Test passes either way; this just keeps the unhandled
    // rejection log clean.
    await fixture.whenStable();
  });

  // ── TC-TST-010 (sc-557) — Dismiss button removes one toast ────────────────

  it('TC-TST-010 — clicking the dismiss × calls service.dismiss, not markRead', () => {
    const markRead = vi.fn();
    const dismiss = vi.fn();
    const { fixture } = configure({
      alerts: [alert({ id: 'x-10' })],
      markRead,
      dismiss,
    });
    const dismissBtn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Dismiss"]',
    ) as HTMLButtonElement;
    dismissBtn.click();
    expect(dismiss).toHaveBeenCalledWith('x-10');
    // The click handler must stop propagation so the parent <a> doesn't also
    // navigate / mark the alert read.
    expect(markRead).not.toHaveBeenCalled();
  });

  // ── TC-TST-008 (sc-555) — Auto-dismiss after 8s ────────────────────────────

  it('TC-TST-008 — auto-dismisses (markRead) after 8s', () => {
    vi.useFakeTimers();
    const markRead = vi.fn();
    configure({ alerts: [alert({ id: 'x-8' })], markRead });
    expect(markRead).not.toHaveBeenCalled();
    vi.advanceTimersByTime(8000);
    expect(markRead).toHaveBeenCalledWith('x-8');
  });

  // ── Other render coverage ──────────────────────────────────────────────────

  it('renders nothing when there are no unread alerts', () => {
    const { fixture } = configure({ alerts: [] });
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('a[href="/inventory"]')).toBeNull();
  });

  it('hides already-read alerts from the toast slot', () => {
    const { fixture } = configure({
      alerts: [alert({ id: 'a-r', read: true }), alert({ id: 'a-u', read: false })],
    });
    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('a[href="/inventory"]');
    expect(cards.length).toBe(1);
  });

  it('renders the product name + quantity in the toast', () => {
    const { fixture } = configure({
      alerts: [alert({ productName: 'Sour Diesel 1g', quantity: 1 })],
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Sour Diesel 1g');
    expect(text).toContain('1 left');
  });
});
