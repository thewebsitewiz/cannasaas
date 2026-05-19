import { Injectable, Signal, computed, effect, inject, signal } from '@angular/core';
import { Socket, io } from 'socket.io-client';

import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

const MUTED_KEY = 'cs.staff.stockAlerts.muted';

export type StockAlertKind = 'low_stock' | 'out_of_stock';

export interface StockAlert {
  readonly id: string;
  readonly type: StockAlertKind;
  readonly productName: string;
  readonly quantity: number;
  readonly timestamp: string;
  /** True once the budtender has seen + dismissed it. */
  readonly read: boolean;
}

interface InventoryAlertPayload {
  readonly type?: StockAlertKind;
  readonly productName?: string;
  readonly quantity?: number;
  readonly timestamp?: string;
}

/**
 * Subscribes to `inventory:alert` on the staff WS room and exposes a
 * bounded queue of recent alerts. Used by `StockAlertToasts` to render
 * a brief toast for every alert, with a localStorage-backed mute toggle
 * (matches the pattern documented in apps/staff/CLAUDE.md for new-order
 * sound cues).
 *
 * Connection lifecycle:
 * - Opens lazily once the AuthService has a token + dispensary scope.
 * - Token rotation tears the socket down and reopens it.
 * - The gateway auto-joins authenticated staff to `staff:{dispensaryId}`,
 *   so this service does not have to opt-in to a room.
 */
@Injectable({ providedIn: 'root' })
export class StockAlertsService {
  private readonly auth = inject(AuthService);

  private readonly _alerts = signal<readonly StockAlert[]>([]);
  private readonly _muted = signal<boolean>(readMuted());
  private readonly _connected = signal(false);

  readonly alerts: Signal<readonly StockAlert[]> = this._alerts.asReadonly();
  readonly muted: Signal<boolean> = this._muted.asReadonly();
  readonly connected: Signal<boolean> = this._connected.asReadonly();
  readonly latest = computed<StockAlert | null>(() => this._alerts()[0] ?? null);
  readonly unreadCount = computed(() => this._alerts().filter((a) => !a.read).length);

  private socket: Socket | null = null;

  constructor() {
    effect(() => {
      const token = this.auth.accessToken();
      this.closeSocket();
      if (token) this.openSocket(token);
    });
  }

  toggleMute(): void {
    this._muted.update((m) => !m);
    writeMuted(this._muted());
  }

  setMuted(muted: boolean): void {
    this._muted.set(muted);
    writeMuted(muted);
  }

  markRead(id: string): void {
    this._alerts.update((alerts) => alerts.map((a) => (a.id === id ? { ...a, read: true } : a)));
  }

  dismiss(id: string): void {
    this._alerts.update((alerts) => alerts.filter((a) => a.id !== id));
  }

  /** Test-only: inject a fake alert without going through the socket. */
  ingestForTest(payload: InventoryAlertPayload): void {
    this.handleAlert(payload);
  }

  private openSocket(token: string): void {
    const socket = io(environment.apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => this._connected.set(true));
    socket.on('disconnect', () => this._connected.set(false));
    socket.on('connect_error', (err: Error) =>
      console.warn('[StockAlertsService] connect_error', err.message),
    );
    socket.on('inventory:alert', (payload: InventoryAlertPayload) => this.handleAlert(payload));

    this.socket = socket;
  }

  private closeSocket(): void {
    if (!this.socket) return;
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
    this._connected.set(false);
  }

  private handleAlert(payload: InventoryAlertPayload): void {
    if (!payload.type || !payload.productName || payload.quantity == null) return;
    const alert: StockAlert = {
      id: payload.productName + ':' + (payload.timestamp ?? Date.now()),
      type: payload.type,
      productName: payload.productName,
      quantity: payload.quantity,
      timestamp: payload.timestamp ?? new Date().toISOString(),
      read: false,
    };
    this._alerts.update((alerts) => {
      // Replace any earlier alert for the same product; newest first.
      const filtered = alerts.filter((a) => a.productName !== alert.productName);
      return [alert, ...filtered].slice(0, 10);
    });
    if (!this._muted()) playBeep();
  }
}

function readMuted(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(MUTED_KEY) === '1';
}

function writeMuted(muted: boolean): void {
  if (typeof localStorage === 'undefined') return;
  if (muted) localStorage.setItem(MUTED_KEY, '1');
  else localStorage.removeItem(MUTED_KEY);
}

/**
 * Tiny synthesized beep — no audio file dependency. Matches the
 * "subtle sound cue" requirement for staff notifications. Fails
 * silent if the page hasn't had a user gesture yet (browser autoplay
 * policy) — that's acceptable since the first interaction is login.
 */
function playBeep(): void {
  if (typeof window === 'undefined') return;
  const Ctor = (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext;
  if (!Ctor) return;
  try {
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
    osc.onended = () => void ctx.close();
  } catch {
    // Autoplay blocked or AudioContext unavailable — ignore.
  }
}
