import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { AuthService } from '../auth/auth.service';
import { StockAlertsService } from './stock-alerts.service';

function makeAuthStub(): AuthService {
  const tokenSig = signal<string | null>(null);
  return {
    accessToken: tokenSig.asReadonly(),
  } as unknown as AuthService;
}

describe('StockAlertsService', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') localStorage.clear();
    TestBed.configureTestingModule({
      providers: [StockAlertsService, { provide: AuthService, useFactory: makeAuthStub }],
    });
  });

  it('ingests alerts and exposes them newest-first', () => {
    const service = TestBed.inject(StockAlertsService);
    service.ingestForTest({
      type: 'low_stock',
      productName: 'Blue Dream 1g',
      quantity: 3,
      timestamp: '2026-05-19T12:00:00Z',
    });
    service.ingestForTest({
      type: 'out_of_stock',
      productName: 'Sour Diesel 3.5g',
      quantity: 0,
      timestamp: '2026-05-19T12:01:00Z',
    });
    const list = service.alerts();
    expect(list).toHaveLength(2);
    expect(list[0].productName).toBe('Sour Diesel 3.5g');
    expect(list[0].type).toBe('out_of_stock');
  });

  it('replaces earlier alerts for the same productName (newest wins)', () => {
    const service = TestBed.inject(StockAlertsService);
    service.ingestForTest({
      type: 'low_stock',
      productName: 'Blue Dream 1g',
      quantity: 3,
      timestamp: '2026-05-19T12:00:00Z',
    });
    service.ingestForTest({
      type: 'out_of_stock',
      productName: 'Blue Dream 1g',
      quantity: 0,
      timestamp: '2026-05-19T12:05:00Z',
    });
    const list = service.alerts();
    expect(list).toHaveLength(1);
    expect(list[0].type).toBe('out_of_stock');
    expect(list[0].quantity).toBe(0);
  });

  it('drops malformed payloads silently', () => {
    const service = TestBed.inject(StockAlertsService);
    service.ingestForTest({ type: 'low_stock', productName: 'NoQty' } as never);
    service.ingestForTest({ productName: 'NoType', quantity: 1 } as never);
    service.ingestForTest({ type: 'low_stock', quantity: 1 } as never);
    expect(service.alerts()).toEqual([]);
  });

  it('caps the queue at 10 entries', () => {
    const service = TestBed.inject(StockAlertsService);
    for (let i = 0; i < 15; i++) {
      service.ingestForTest({
        type: 'low_stock',
        productName: 'Product ' + i,
        quantity: 1,
        timestamp: new Date(2026, 4, 19, 12, 0, i).toISOString(),
      });
    }
    expect(service.alerts()).toHaveLength(10);
    expect(service.alerts()[0].productName).toBe('Product 14');
  });

  it('persists the mute toggle to localStorage', () => {
    const service = TestBed.inject(StockAlertsService);
    expect(service.muted()).toBe(false);
    service.toggleMute();
    expect(service.muted()).toBe(true);
    expect(localStorage.getItem('cs.staff.stockAlerts.muted')).toBe('1');
    service.toggleMute();
    expect(service.muted()).toBe(false);
    expect(localStorage.getItem('cs.staff.stockAlerts.muted')).toBeNull();
  });

  it('markRead flips the read flag without removing the alert; dismiss removes it', () => {
    const service = TestBed.inject(StockAlertsService);
    service.ingestForTest({
      type: 'low_stock',
      productName: 'Blue Dream 1g',
      quantity: 3,
      timestamp: '2026-05-19T12:00:00Z',
    });
    const id = service.alerts()[0].id;
    service.markRead(id);
    expect(service.alerts()).toHaveLength(1);
    expect(service.alerts()[0].read).toBe(true);
    expect(service.unreadCount()).toBe(0);
    service.dismiss(id);
    expect(service.alerts()).toEqual([]);
  });
});
