import { Injectable, Signal, computed, effect, inject, signal } from '@angular/core';
import { Socket, io } from 'socket.io-client';

import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

export type StockAlertKind = 'low_stock' | 'out_of_stock';

export interface StockAlert {
  readonly type: StockAlertKind;
  readonly productName: string;
  readonly quantity: number;
  readonly timestamp: string;
}

interface InventoryAlertPayload {
  readonly type?: StockAlertKind;
  readonly productName?: string;
  readonly quantity?: number;
  readonly timestamp?: string;
}

/**
 * Admin-side passive listener for `inventory:alert`. The dashboard's
 * `LowStockWidget` merges the bootstrapped `dashboard.lowStockItems`
 * seed with this live stream — newer alerts replace older ones for
 * the same product, with `out_of_stock` superseding `low_stock`.
 *
 * Lighter than the staff equivalent: no mute toggle, no audio beep —
 * admin is observational; staff (`apps/staff`) gets the noisy variant.
 */
@Injectable({ providedIn: 'root' })
export class StockAlertsService {
  private readonly auth = inject(AuthService);

  private readonly _alerts = signal<readonly StockAlert[]>([]);
  private readonly _connected = signal(false);

  readonly alerts: Signal<readonly StockAlert[]> = this._alerts.asReadonly();
  readonly connected: Signal<boolean> = this._connected.asReadonly();
  readonly latest = computed<StockAlert | null>(() => this._alerts()[0] ?? null);

  private socket: Socket | null = null;

  constructor() {
    effect(() => {
      const token = this.auth.accessToken();
      this.closeSocket();
      if (token) this.openSocket(token);
    });
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
      type: payload.type,
      productName: payload.productName,
      quantity: payload.quantity,
      timestamp: payload.timestamp ?? new Date().toISOString(),
    };
    this._alerts.update((alerts) => {
      const filtered = alerts.filter((a) => a.productName !== alert.productName);
      return [alert, ...filtered].slice(0, 20);
    });
  }
}
