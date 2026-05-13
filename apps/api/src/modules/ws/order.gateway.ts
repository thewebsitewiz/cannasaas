import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ALLOWED_ORIGINS } from '../../common/cors-origins';

interface ConnectedClient {
  userId: string;
  email: string;
  role: string;
  dispensaryId?: string;
  rooms: Set<string>;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  dispensaryId?: string;
}

interface OrderCompletedPayload {
  orderId: string;
  dispensaryId?: string;
  customerUserId?: string;
  total?: number;
  orderType?: string;
}

interface OrderStatusChangedPayload {
  orderId: string;
  dispensaryId: string;
  customerUserId?: string;
  status: string;
  total?: number;
  orderType?: string;
}

interface LowStockPayload {
  dispensaryId: string;
  productName: string;
  quantity: number;
}

interface DeliveryStatusChangedPayload {
  dispensaryId: string;
  tripId: string;
  driverId: string;
  status: string;
  orderId?: string;
  customerUserId?: string;
}

const STAFF_ROLES: ReadonlySet<string> = new Set([
  'budtender',
  'shift_lead',
  'dispensary_admin',
  'org_admin',
  'super_admin',
]);

@WebSocketGateway({
  cors: {
    // ALLOWED_ORIGINS resolves at module load from CORS_ORIGINS env (or a
    // dev fallback if unset). Decorator metadata cannot reach ConfigService,
    // so a top-level constant is the cleanest available path.
    origin: [...ALLOWED_ORIGINS],
    credentials: true,
  },
  namespace: '/',
  transports: ['websocket', 'polling'],
})
export class OrderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(OrderGateway.name);
  private clients = new Map<string, ConnectedClient>();

  constructor(
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // ── Connection Lifecycle ──────────────────────────────────────────────

  handleConnection(client: Socket): void {
    try {
      const handshakeAuth = client.handshake.auth as
        | { token?: string }
        | undefined;
      const authHeader = client.handshake.headers.authorization;
      const token = handshakeAuth?.token ?? authHeader?.replace('Bearer ', '');
      if (!token) {
        this.logger.warn('WS connection rejected — no token');
        client.disconnect();
        return;
      }

      const payload = this.jwt.verify<JwtPayload>(token, {
        secret: this.config.get<string>('jwt.secret'),
      });
      const info: ConnectedClient = {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
        dispensaryId: payload.dispensaryId,
        rooms: new Set(),
      };

      this.clients.set(client.id, info);

      // Auto-join rooms based on role
      if (info.dispensaryId) {
        const dispRoom = 'dispensary:' + info.dispensaryId;
        void client.join(dispRoom);
        info.rooms.add(dispRoom);
      }

      const userRoom = 'user:' + info.userId;
      void client.join(userRoom);
      info.rooms.add(userRoom);

      if (STAFF_ROLES.has(info.role) && info.dispensaryId) {
        const staffRoom = 'staff:' + info.dispensaryId;
        void client.join(staffRoom);
        info.rooms.add(staffRoom);
      }

      this.logger.log(
        'WS connected: ' +
          info.email +
          ' (' +
          info.role +
          ') [' +
          client.id +
          ']',
      );
      client.emit('connected', { userId: info.userId, rooms: [...info.rooms] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn('WS auth failed: ' + message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const info = this.clients.get(client.id);
    if (info) {
      this.logger.log(
        'WS disconnected: ' + info.email + ' [' + client.id + ']',
      );
      this.clients.delete(client.id);
    }
  }

  // ── Client Messages ───────────────────────────────────────────────────

  @SubscribeMessage('subscribe:order')
  handleSubscribeOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ): void {
    const room = 'order:' + data.orderId;
    void client.join(room);
    const info = this.clients.get(client.id);
    if (info) info.rooms.add(room);
    client.emit('subscribed', { room });
  }

  @SubscribeMessage('unsubscribe:order')
  handleUnsubscribeOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ): void {
    const room = 'order:' + data.orderId;
    void client.leave(room);
    const info = this.clients.get(client.id);
    if (info) info.rooms.delete(room);
  }

  @SubscribeMessage('driver:location')
  handleDriverLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { driverId: string; lat: number; lng: number },
  ): void {
    const info = this.clients.get(client.id);
    if (!info) return;
    // Broadcast to dispensary staff
    if (info.dispensaryId) {
      this.server.to('staff:' + info.dispensaryId).emit('driver:location', {
        driverId: data.driverId,
        lat: data.lat,
        lng: data.lng,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): void {
    client.emit('pong', { timestamp: Date.now() });
  }

  // ── Event Listeners (from EventEmitter2) ──────────────────────────────

  @OnEvent('order.completed')
  handleOrderCompleted(payload: OrderCompletedPayload): void {
    const event = {
      type: 'order.confirmed',
      orderId: payload.orderId,
      status: 'confirmed',
      dispensaryId: payload.dispensaryId,
      total: payload.total,
      orderType: payload.orderType,
      timestamp: new Date().toISOString(),
    };

    if (payload.customerUserId) {
      this.server
        .to('user:' + payload.customerUserId)
        .emit('order:update', event);
    }

    if (payload.dispensaryId) {
      this.server.to('staff:' + payload.dispensaryId).emit('order:new', event);
    }

    this.logger.log('WS broadcast: order.confirmed ' + payload.orderId);
  }

  @OnEvent('order.status_changed')
  handleOrderStatusChanged(payload: OrderStatusChangedPayload): void {
    const event = {
      type: 'order.status_changed',
      orderId: payload.orderId,
      status: payload.status,
      dispensaryId: payload.dispensaryId,
      timestamp: new Date().toISOString(),
    };

    this.server.to('order:' + payload.orderId).emit('order:update', event);

    if (payload.customerUserId) {
      this.server
        .to('user:' + payload.customerUserId)
        .emit('order:update', event);
    }

    if (payload.dispensaryId) {
      this.server
        .to('staff:' + payload.dispensaryId)
        .emit('order:update', event);
    }

    this.logger.log(
      'WS broadcast: ' + payload.status + ' → ' + payload.orderId,
    );
  }

  @OnEvent('inventory.low_stock')
  handleLowStock(payload: LowStockPayload): void {
    this.server.to('staff:' + payload.dispensaryId).emit('inventory:alert', {
      type: 'low_stock',
      productName: payload.productName,
      quantity: payload.quantity,
      timestamp: new Date().toISOString(),
    });
  }

  @OnEvent('delivery.status_changed')
  handleDeliveryUpdate(payload: DeliveryStatusChangedPayload): void {
    const event = {
      type: 'delivery.update',
      tripId: payload.tripId,
      driverId: payload.driverId,
      status: payload.status,
      timestamp: new Date().toISOString(),
    };

    this.server
      .to('staff:' + payload.dispensaryId)
      .emit('delivery:update', event);

    if (payload.customerUserId) {
      this.server
        .to('user:' + payload.customerUserId)
        .emit('delivery:update', event);
    }

    if (payload.orderId) {
      this.server.to('order:' + payload.orderId).emit('delivery:update', event);
    }
  }

  // ── Utility ───────────────────────────────────────────────────────────

  getConnectedCount(): number {
    return this.clients.size;
  }

  getConnectedUsers(): { userId: string; email: string; role: string }[] {
    return [...this.clients.values()].map((c) => ({
      userId: c.userId,
      email: c.email,
      role: c.role,
    }));
  }
}
