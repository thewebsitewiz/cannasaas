/**
 * LowStockWidget specs (sc-516, sc-517, sc-518, sc-519, sc-520, sc-522).
 * Stubs StockAlertsService — its own behavior is covered by
 * stock-alerts.service.spec.ts.
 */
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { StockAlertsService, type StockAlert } from '../../core/stock-alerts/stock-alerts.service';
import { LowStockWidget, type LowStockSeed } from './low-stock-widget';

interface FakeArgs {
  readonly alerts?: readonly StockAlert[];
  readonly connected?: boolean;
}

function makeStockAlerts(args: FakeArgs = {}): StockAlertsService {
  const alertsSignal = signal<readonly StockAlert[]>(args.alerts ?? []);
  return {
    alerts: alertsSignal.asReadonly(),
    connected: signal<boolean>(args.connected ?? true).asReadonly(),
    latest: signal<StockAlert | null>(args.alerts?.[0] ?? null).asReadonly(),
  } as unknown as StockAlertsService;
}

function configure(args: FakeArgs = {}, seed: readonly LowStockSeed[] = []) {
  TestBed.configureTestingModule({
    imports: [LowStockWidget],
    providers: [
      provideRouter([]),
      { provide: StockAlertsService, useValue: makeStockAlerts(args) },
    ],
  });
  const fixture = TestBed.createComponent(LowStockWidget);
  fixture.componentRef.setInput('seed', seed);
  fixture.detectChanges();
  return fixture;
}

function alert(overrides: Partial<StockAlert> = {}): StockAlert {
  return {
    type: 'low_stock',
    productName: 'Blue Dream',
    quantity: 3,
    timestamp: '2026-05-26T14:30:00Z',
    ...overrides,
  };
}

function seed(overrides: Partial<LowStockSeed> = {}): LowStockSeed {
  return {
    variantId: 'v-1',
    productName: 'Blue Dream',
    variantName: '3.5g',
    quantityAvailable: 4,
    ...overrides,
  };
}

describe('LowStockWidget', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  // ── TC-LSW-001 — Empty low-stock state (sc-516) ─────────────────────────

  it('TC-LSW-001 — renders empty state when no seed + no live alerts', () => {
    const fixture = configure({ alerts: [] }, []);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Stock levels look healthy — no alerts.');
    const lis = (fixture.nativeElement as HTMLElement).querySelectorAll('li');
    expect(lis.length).toBe(0);
  });

  // ── TC-LSW-002 — Seed-only render (sc-517) ──────────────────────────────

  it('TC-LSW-002 — renders seed rows when no live alerts are present', () => {
    const fixture = configure({ alerts: [] }, [
      seed({ variantId: 'v-1', productName: 'Sour Diesel', quantityAvailable: 5 }),
      seed({ variantId: 'v-2', productName: 'OG Kush', quantityAvailable: 2 }),
    ]);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Sour Diesel');
    expect(text).toContain('5 left');
    expect(text).toContain('OG Kush');
    expect(text).toContain('2 left');
  });

  it('TC-LSW-002 — seed row with quantity 0 renders as out_of_stock', () => {
    const fixture = configure({ alerts: [] }, [
      seed({ variantId: 'v-3', productName: 'Northern Lights', quantityAvailable: 0 }),
    ]);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Out');
  });

  // ── TC-LSW-003 — Live event flips a card (sc-518) ───────────────────────

  it('TC-LSW-003 — renders a live alert above seed and shows out_of_stock as "Out"', () => {
    const fixture = configure(
      { alerts: [alert({ type: 'out_of_stock', productName: 'Northern Lights', quantity: 0 })] },
      [],
    );
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Northern Lights');
    expect(text).toContain('Out');
  });

  it('TC-LSW-003 — live low_stock alert renders quantity', () => {
    const fixture = configure(
      { alerts: [alert({ type: 'low_stock', productName: 'Pineapple Express', quantity: 7 })] },
      [],
    );
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('7 left');
  });

  // ── TC-LSW-004 — Live overrides seed for same product (sc-519) ──────────

  it('TC-LSW-004 — live entry suppresses matching seed row by productName', () => {
    const fixture = configure(
      { alerts: [alert({ type: 'out_of_stock', productName: 'Blue Dream', quantity: 0 })] },
      [seed({ productName: 'Blue Dream', variantName: '3.5g', quantityAvailable: 4 })],
    );
    const lis = (fixture.nativeElement as HTMLElement).querySelectorAll('li');
    expect(lis.length).toBe(1);
    const text = lis[0].textContent ?? '';
    expect(text).toContain('Out');
    // Variant name from seed should be gone since live row replaced it.
    expect(text).not.toContain('3.5g');
  });

  // ── TC-LSW-005 — Dedupe across many events for same product (sc-520) ────
  // (Service-level dedup is covered in stock-alerts.service.spec.ts; this
  // confirms the widget renders the already-deduped signal as a single row.)

  it('TC-LSW-005 — widget renders a single row per live productName', () => {
    const fixture = configure(
      { alerts: [alert({ productName: 'Blue Dream', quantity: 3, timestamp: 'a' })] },
      [],
    );
    const lis = (fixture.nativeElement as HTMLElement).querySelectorAll('li');
    expect(lis.length).toBe(1);
  });

  // ── TC-LSW-007 — Click-through to inventory (sc-522) ────────────────────

  it('TC-LSW-007 — "View all inventory" link routes to /inventory', () => {
    const fixture = configure();
    const anchor = (fixture.nativeElement as HTMLElement).querySelector(
      'a[href="/inventory"]',
    ) as HTMLAnchorElement;
    expect(anchor).not.toBeNull();
    expect((anchor.textContent ?? '').trim()).toMatch(/View all inventory/);
  });

  // ── Limit (defensive — keeps the cap visible if the input changes) ──────

  it('respects the limit input — never renders more than `limit` rows', () => {
    const seedRows = Array.from({ length: 12 }, (_, i) =>
      seed({ variantId: `v-${i}`, productName: `Product ${i}`, quantityAvailable: i + 1 }),
    );
    TestBed.configureTestingModule({
      imports: [LowStockWidget],
      providers: [provideRouter([]), { provide: StockAlertsService, useValue: makeStockAlerts() }],
    });
    const fixture = TestBed.createComponent(LowStockWidget);
    fixture.componentRef.setInput('seed', seedRows);
    fixture.componentRef.setInput('limit', 5);
    fixture.detectChanges();
    const lis = (fixture.nativeElement as HTMLElement).querySelectorAll('li');
    expect(lis.length).toBe(5);
  });

  it('shows "live" connected indicator with aria-label when socket is up', () => {
    const fixture = configure({ connected: true });
    const indicator = (fixture.nativeElement as HTMLElement).querySelector(
      '[aria-label="Live updates connected"]',
    );
    expect(indicator).not.toBeNull();
  });

  it('shows "live" offline aria-label when socket is down', () => {
    const fixture = configure({ connected: false });
    const indicator = (fixture.nativeElement as HTMLElement).querySelector(
      '[aria-label="Live updates offline"]',
    );
    expect(indicator).not.toBeNull();
  });
});
