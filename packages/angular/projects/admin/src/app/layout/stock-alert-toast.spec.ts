import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type StockAlert, StockAlertsService } from '../core/stock-alerts/stock-alerts.service';
import { StockAlertToast } from './stock-alert-toast';

function alert(overrides: Partial<StockAlert> = {}): StockAlert {
  return {
    type: 'low_stock',
    productName: 'Blue Dream',
    quantity: 4,
    timestamp: '2026-05-22T17:00:00Z',
    ...overrides,
  };
}

function configure(initialLatest: StockAlert | null = null) {
  const latest = signal<StockAlert | null>(initialLatest);
  const svc = {
    latest: latest.asReadonly(),
  } as unknown as StockAlertsService;
  TestBed.configureTestingModule({
    imports: [StockAlertToast],
    providers: [{ provide: StockAlertsService, useValue: svc }],
  });
  const fixture = TestBed.createComponent(StockAlertToast);
  fixture.detectChanges();
  return { fixture, latest };
}

describe('StockAlertToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when no alerts have arrived', () => {
    const { fixture } = configure();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[role="status"]')).toBeNull();
  });

  it('renders a toast when a new alert arrives', () => {
    const { fixture, latest } = configure();
    latest.set(alert({ productName: 'OG Kush', quantity: 2 }));
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const toast = root.querySelector('[role="status"]');
    expect(toast?.textContent).toContain('OG Kush');
    expect(toast?.textContent).toContain('2 left');
    expect(toast?.textContent).toContain('Low stock');
  });

  it('applies distinct styling for out_of_stock vs low_stock', () => {
    const { fixture, latest } = configure();
    latest.set(alert({ type: 'out_of_stock', productName: 'Sour D', quantity: 0 }));
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const toast = root.querySelector('[role="status"]') as HTMLElement;
    expect(toast.className).toContain('border-rose-300');
    expect(toast.textContent).toContain('Out of stock');
  });

  it('dismiss button removes the toast', () => {
    const { fixture, latest } = configure();
    latest.set(alert({ productName: 'OG Kush' }));
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const dismissBtn = root.querySelector(
      'button[aria-label="Dismiss OG Kush alert"]',
    ) as HTMLButtonElement;
    dismissBtn.click();
    fixture.detectChanges();
    expect(root.querySelector('[role="status"]')).toBeNull();
  });

  it('auto-dismisses after 6 seconds', () => {
    const { fixture, latest } = configure();
    latest.set(alert());
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="status"]')).not.toBeNull();
    vi.advanceTimersByTime(6000);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="status"]')).toBeNull();
  });

  it('stacks at most 3 toasts (FIFO drop)', () => {
    const { fixture, latest } = configure();
    latest.set(alert({ productName: 'A', timestamp: '2026-05-22T17:00:01Z' }));
    fixture.detectChanges();
    latest.set(alert({ productName: 'B', timestamp: '2026-05-22T17:00:02Z' }));
    fixture.detectChanges();
    latest.set(alert({ productName: 'C', timestamp: '2026-05-22T17:00:03Z' }));
    fixture.detectChanges();
    latest.set(alert({ productName: 'D', timestamp: '2026-05-22T17:00:04Z' }));
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const toasts = root.querySelectorAll('[role="status"]');
    expect(toasts.length).toBe(3);
    const text = root.textContent ?? '';
    expect(text).not.toContain('A —');
    expect(text).toContain('B');
    expect(text).toContain('C');
    expect(text).toContain('D');
  });

  it('does not re-push the same alert on identical key', () => {
    const { fixture, latest } = configure();
    const a = alert({ productName: 'X', timestamp: '2026-05-22T17:00:00Z' });
    latest.set(a);
    fixture.detectChanges();
    latest.set({ ...a });
    fixture.detectChanges();
    const toasts = (fixture.nativeElement as HTMLElement).querySelectorAll('[role="status"]');
    expect(toasts.length).toBe(1);
  });
});
