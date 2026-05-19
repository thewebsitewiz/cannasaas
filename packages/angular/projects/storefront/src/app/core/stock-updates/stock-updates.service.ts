import { Injectable, Signal, computed, effect, inject, signal } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { DispensaryContextService } from '../tenant/dispensary-context.service';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface StockUpdate {
  readonly variantId: string;
  readonly available: number;
  readonly status: StockStatus;
  readonly timestamp: string;
}

interface StockChangedPayload {
  readonly type?: string;
  readonly variantId?: string;
  readonly available?: number;
  readonly status?: StockStatus;
  readonly timestamp?: string;
}

/**
 * Anonymous storefront WS feed for per-variant stock changes.
 *
 * Connection
 * ──────────
 * Opens a Socket.IO connection with `{ auth: { storefrontDispensaryId } }`
 * once the DispensaryContextService has resolved the tenant. The API
 * gateway accepts this anonymous handshake (see OrderGateway) and
 * auto-joins the `storefront:{dispensaryId}` room, which only receives
 * the public stock projection — no productName, threshold, or other
 * operator context.
 *
 * On tenant change the socket is torn down and re-opened for the new
 * `storefrontDispensaryId`. On tenant clear the socket closes.
 *
 * Consumption
 * ───────────
 * Components read `entryFor(variantId)` (or `updates()` directly) to
 * overlay a fresher status/quantity on top of whatever the initial
 * product query returned. The map is in-memory only — refreshing the
 * page hits the API again for the canonical value.
 */
@Injectable({ providedIn: 'root' })
export class StockUpdatesService {
  private readonly dispensary = inject(DispensaryContextService);
  private readonly _updates = signal<ReadonlyMap<string, StockUpdate>>(new Map());
  private readonly _connected = signal(false);

  readonly updates: Signal<ReadonlyMap<string, StockUpdate>> = this._updates.asReadonly();
  readonly connected: Signal<boolean> = this._connected.asReadonly();

  private socket: Socket | null = null;
  private connectedDispensaryId: string | null = null;

  constructor() {
    effect(() => {
      const dispensaryId = this.dispensary.entityId();
      if (dispensaryId === this.connectedDispensaryId) return;
      this.closeSocket();
      if (dispensaryId) this.openSocket(dispensaryId);
    });
  }

  entryFor(variantId: string): Signal<StockUpdate | null> {
    return computed(() => this._updates().get(variantId) ?? null);
  }

  private openSocket(dispensaryId: string): void {
    const socket = io(environment.apiUrl, {
      auth: { storefrontDispensaryId: dispensaryId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10_000,
      reconnectionAttempts: Number.POSITIVE_INFINITY,
    });

    socket.on('stock:changed', (payload: StockChangedPayload) => {
      if (!payload.variantId || payload.available == null || !payload.status) return;
      const update: StockUpdate = {
        variantId: payload.variantId,
        available: payload.available,
        status: payload.status,
        timestamp: payload.timestamp ?? new Date().toISOString(),
      };
      this._updates.update((prev) => {
        const next = new Map(prev);
        next.set(update.variantId, update);
        return next;
      });
    });

    socket.on('connect', () => this._connected.set(true));
    socket.on('disconnect', () => this._connected.set(false));
    socket.on('connect_error', (err: Error) => {
      this._connected.set(false);
      console.warn('[StockUpdatesService] connect_error', err.message);
    });

    this.socket = socket;
    this.connectedDispensaryId = dispensaryId;
  }

  private closeSocket(): void {
    if (!this.socket) return;
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
    this.connectedDispensaryId = null;
    this._connected.set(false);
    this._updates.set(new Map());
  }
}
