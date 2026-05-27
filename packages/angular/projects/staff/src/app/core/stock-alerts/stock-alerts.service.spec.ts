import { TestBed } from '@angular/core/testing';
import { signal, type Signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';

interface FakeSocket {
  on: Mock;
  removeAllListeners: Mock;
  disconnect: Mock;
  handlers: Map<string, (payload: unknown) => void>;
}

const ioMock = vi.fn();

vi.mock('socket.io-client', () => {
  return {
    io: (...args: unknown[]): FakeSocket => ioMock(...args) as FakeSocket,
  };
});

import { AuthService } from '../auth/auth.service';
import { StockAlertsService } from './stock-alerts.service';

function makeFakeSocket(): FakeSocket {
  const handlers = new Map<string, (payload: unknown) => void>();
  const on = vi.fn((event: string, handler: (payload: unknown) => void) => {
    handlers.set(event, handler);
  });
  return {
    on,
    removeAllListeners: vi.fn(),
    disconnect: vi.fn(),
    handlers,
  };
}

class FakeAuthService {
  private readonly _accessToken = signal<string | null>(null);
  readonly accessToken: Signal<string | null> = this._accessToken.asReadonly();
  setToken(token: string | null): void {
    this._accessToken.set(token);
  }
}

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

// ── Socket lifecycle + beep (TC-TST-001, 004, 005, 012) ─────────────────────

describe('StockAlertsService — socket + beep', () => {
  let auth: FakeAuthService;
  let svc: StockAlertsService;

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') localStorage.clear();
    ioMock.mockReset();
    ioMock.mockImplementation(() => makeFakeSocket());
    auth = new FakeAuthService();
    TestBed.configureTestingModule({
      providers: [StockAlertsService, { provide: AuthService, useValue: auth }],
    });
    svc = TestBed.inject(StockAlertsService);
  });

  it('TC-TST-001 (sc-548) — setting a login token opens a socket', () => {
    expect(ioMock).not.toHaveBeenCalled();
    auth.setToken('tok-1');
    TestBed.tick();
    expect(ioMock).toHaveBeenCalledTimes(1);
    const opts = ioMock.mock.calls[0][1] as { auth?: { token?: string } };
    expect(opts.auth?.token).toBe('tok-1');
  });

  it('TC-TST-001 — connected flips to true when the socket connect handler fires', () => {
    auth.setToken('tok-1');
    TestBed.tick();
    const sock = ioMock.mock.results[0].value as FakeSocket;
    expect(svc.connected()).toBe(false);
    sock.handlers.get('connect')?.(undefined);
    expect(svc.connected()).toBe(true);
  });

  it('TC-TST-012 (sc-559) — token rotation closes the old socket and opens a new one', () => {
    auth.setToken('tok-1');
    TestBed.tick();
    const sock1 = ioMock.mock.results[0].value as FakeSocket;

    auth.setToken('tok-2');
    TestBed.tick();
    expect(ioMock).toHaveBeenCalledTimes(2);
    expect(sock1.disconnect).toHaveBeenCalledTimes(1);
    const opts = ioMock.mock.calls[1][1] as { auth?: { token?: string } };
    expect(opts.auth?.token).toBe('tok-2');
  });

  it('TC-TST-012 — clearing the token closes the socket without reopening', () => {
    auth.setToken('tok-1');
    TestBed.tick();
    const sock = ioMock.mock.results[0].value as FakeSocket;

    auth.setToken(null);
    TestBed.tick();
    expect(sock.disconnect).toHaveBeenCalledTimes(1);
    expect(ioMock).toHaveBeenCalledTimes(1); // not reopened
    expect(svc.connected()).toBe(false);
  });

  it('TC-TST-004 (sc-551) — ingesting an alert calls AudioContext when unmuted', () => {
    const audioCtor = vi.fn(() => ({
      createOscillator: () => ({
        frequency: { value: 0 },
        connect: () => ({ connect: () => undefined }),
        start: () => undefined,
        stop: () => undefined,
        onended: null as null | (() => void),
      }),
      createGain: () => ({
        gain: {
          setValueAtTime: () => undefined,
          exponentialRampToValueAtTime: () => undefined,
        },
        connect: () => ({ connect: () => undefined }),
      }),
      currentTime: 0,
      destination: {},
      close: () => Promise.resolve(),
    }));
    const original = (window as unknown as { AudioContext?: unknown }).AudioContext;
    (window as unknown as { AudioContext: unknown }).AudioContext = audioCtor;

    expect(svc.muted()).toBe(false);
    svc.ingestForTest({
      type: 'low_stock',
      productName: 'Beep Strain',
      quantity: 2,
      timestamp: '2026-05-19T12:00:00Z',
    });
    expect(audioCtor).toHaveBeenCalledTimes(1);

    (window as unknown as { AudioContext?: unknown }).AudioContext = original;
  });

  it('TC-TST-005 (sc-552) — when muted, ingesting an alert does NOT call AudioContext', () => {
    const audioCtor = vi.fn();
    const original = (window as unknown as { AudioContext?: unknown }).AudioContext;
    (window as unknown as { AudioContext: unknown }).AudioContext = audioCtor;

    svc.setMuted(true);
    svc.ingestForTest({
      type: 'low_stock',
      productName: 'Silent Strain',
      quantity: 1,
      timestamp: '2026-05-19T12:00:00Z',
    });
    expect(audioCtor).not.toHaveBeenCalled();

    (window as unknown as { AudioContext?: unknown }).AudioContext = original;
  });
});
