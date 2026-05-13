import { Injectable, Signal, effect, inject, signal } from '@angular/core';
import { Observable, Subject, defer, filter, finalize, share } from 'rxjs';
import { Socket, io } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

/**
 * `order:update` server event payload (gateway → customer/staff).
 * Fired when an order is created, status-changed, or completed.
 */
export interface OrderUpdateEvent {
  readonly kind: 'order';
  readonly type: string;
  readonly orderId: string;
  readonly status: string;
  readonly dispensaryId?: string;
  readonly total?: number;
  readonly orderType?: string;
  readonly timestamp: string;
}

/**
 * `delivery:update` server event payload (gateway → customer/staff).
 * Fired on delivery trip status changes.
 */
export interface DeliveryUpdateEvent {
  readonly kind: 'delivery';
  readonly type: string;
  readonly tripId: string;
  readonly driverId: string;
  readonly status: string;
  readonly orderId?: string;
  readonly lat?: number;
  readonly lng?: number;
  readonly timestamp: string;
}

export type OrderEvent = OrderUpdateEvent | DeliveryUpdateEvent;

interface OrderUpdatePayload {
  readonly type?: string;
  readonly orderId?: string;
  readonly status?: string;
  readonly dispensaryId?: string;
  readonly total?: number;
  readonly orderType?: string;
  readonly timestamp?: string;
}

interface DeliveryUpdatePayload {
  readonly type?: string;
  readonly tripId?: string;
  readonly driverId?: string;
  readonly status?: string;
  readonly orderId?: string;
  readonly lat?: number;
  readonly lng?: number;
  readonly timestamp?: string;
}

/**
 * Real-time order updates via the API's Socket.IO gateway. Mirrors
 * `apps/storefront/src/hooks/useOrderSocket.ts` but as an injectable
 * service so multiple components share one connection.
 *
 * Lifecycle
 * ─────────
 * - Lazy connect: socket opens on first subscriber to `events$`. Closes
 *   on the last unsubscribe (refcount via `share({ resetOnRefCountZero })`).
 * - Token-driven: an `effect` on `auth.accessToken()` tears down and
 *   reopens the socket whenever the token rotates. If the token becomes
 *   null the socket stays closed; the next non-null token + subscriber
 *   triggers a fresh connection.
 * - Transport-level reconnect (server restart, network blip) is handled
 *   natively by `socket.io-client`. No custom backoff layered on top.
 *
 * Auth model
 * ──────────
 * Token is sent in the Socket.IO auth payload (`{ auth: { token } }`),
 * which the gateway reads from `socket.handshake.auth.token` (with a
 * header fallback). Customer connections are auto-joined to a per-user
 * room (`user:<id>`) by the gateway, so this service does not need to
 * filter events to "the current user" — the server already does.
 *
 * Event surface
 * ─────────────
 * - `events$` — discriminated union of the two events the gateway emits
 *   to customers (`order:update`, `delivery:update`).
 * - `forOrder(orderId)` — filter helper for a single order.
 * - `subscribeToOrder(orderId)` / `unsubscribeFromOrder(orderId)` join
 *   and leave the gateway's `order:<id>` room — required only when a
 *   logged-out tracker (or staff) wants events about an order they
 *   wouldn't otherwise be auto-subscribed to.
 */
@Injectable({ providedIn: 'root' })
export class OrderSocketService {
  private readonly auth = inject(AuthService);

  private socket: Socket | null = null;
  private readonly _connected = signal(false);
  private readonly subject$ = new Subject<OrderEvent>();

  readonly connected: Signal<boolean> = this._connected.asReadonly();

  readonly events$: Observable<OrderEvent> = defer(() => {
    this.openSocket();
    return this.subject$.asObservable();
  }).pipe(
    finalize(() => this.closeSocket()),
    share({ resetOnRefCountZero: true }),
  );

  constructor() {
    // Token rotation: if a socket is currently open, tear it down so the
    // next subscriber (or this same effect's reopen below) connects with
    // the new credentials. If no socket is open, the lazy `events$` chain
    // will pick up the new token on its next subscribe.
    effect(() => {
      const token = this.auth.accessToken();
      if (!this.socket) return;
      this.closeSocket();
      if (token) this.openSocket();
    });
  }

  /** Convenience: filter `events$` to events about a specific orderId. */
  forOrder(orderId: string): Observable<OrderEvent> {
    return this.events$.pipe(
      filter((event) => {
        if (event.kind === 'order') return event.orderId === orderId;
        return event.orderId === orderId;
      }),
    );
  }

  /**
   * Join the gateway's `order:<orderId>` room so events for that order
   * arrive even when not auto-routed (e.g. a staff member tracking a
   * customer's order, or a customer subscribing before placing).
   */
  subscribeToOrder(orderId: string): void {
    this.socket?.emit('subscribe:order', { orderId });
  }

  unsubscribeFromOrder(orderId: string): void {
    this.socket?.emit('unsubscribe:order', { orderId });
  }

  private openSocket(): void {
    if (this.socket) return;
    const token = this.auth.accessToken();
    if (!token) return;

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
      console.warn('[OrderSocketService] connect_error', err.message),
    );

    socket.on('order:update', (payload: OrderUpdatePayload) => {
      if (!payload.orderId || !payload.status) return;
      this.subject$.next({
        kind: 'order',
        type: payload.type ?? 'order:update',
        orderId: payload.orderId,
        status: payload.status,
        dispensaryId: payload.dispensaryId,
        total: payload.total,
        orderType: payload.orderType,
        timestamp: payload.timestamp ?? new Date().toISOString(),
      });
    });

    socket.on('delivery:update', (payload: DeliveryUpdatePayload) => {
      if (!payload.tripId || !payload.driverId || !payload.status) return;
      this.subject$.next({
        kind: 'delivery',
        type: payload.type ?? 'delivery:update',
        tripId: payload.tripId,
        driverId: payload.driverId,
        status: payload.status,
        orderId: payload.orderId,
        lat: payload.lat,
        lng: payload.lng,
        timestamp: payload.timestamp ?? new Date().toISOString(),
      });
    });

    this.socket = socket;
  }

  private closeSocket(): void {
    if (!this.socket) return;
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
    this._connected.set(false);
  }
}
