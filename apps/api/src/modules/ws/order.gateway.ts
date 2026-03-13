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

interface ConnectedClient {
  userId: string;
  email: string;
  role: string;
  dispensaryId?: string;
  rooms: Set<string>;
}

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
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

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        this.logger.warn('WS connection rejected — no token');
        client.disconnect();
        return;
      }

      const payload = this.jwt.verify(token, { secret: this.config.get('jwt.secret') });
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
        client.join(dispRoom);
        info.rooms.add(dispRoom);
      }

      const userRoom = 'user:' + info.userId;
      client.join(userRoom);
      info.rooms.add(userRoom);

      // Staff joins staff-specific room
      if (['budtender', 'shift_lead', 'dispensary_admin', 'org_admin', 'super_admin'].includes(info.role)) {
        const staffRoom = 'staff:' + info.dispensaryId;
        client.join(staffRoom);
        info.rooms.add(staffRoom);
      }

      this.logger.log('WS connected: ' + info.email + ' (' + info.role + ') [' + client.id + ']');
      client.emit('connected', { userId: info.userId, rooms: [...info.rooms] });

    } catch (err: any) {
      this.logger.warn('WS auth failed: ' + err.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const info = this.clients.get(client.id);
    if (info) {
      this.logger.log('WS disconnected: ' + info.email + ' [' + client.id + ']');
      this.clients.delete(client.id);
    }
  }

  // ── Client Messages ───────────────────────────────────────────────────

  @SubscribeMessage('subscribe:order')
  handleSubscribeOrder(@ConnectedSocket() client: Socket, @MessageBody() data: { orderId: string }): void {
    const room = 'order:' + data.orderId;
    client.join(room);
    const info = this.clients.get(client.id);
    if (info) info.rooms.add(room);
    client.emit('subscribed', { room });
  }

  @SubscribeMessage('unsubscribe:order')
  handleUnsubscribeOrder(@ConnectedSocket() client: Socket, @MessageBody() data: { orderId: string }): void {
    const room = 'order:' + data.orderId;
    client.leave(room);
    const info = this.clients.get(client.id);
    if (info) info.rooms.delete(room);
  }

  @SubscribeMessage('driver:location')
  handleDriverLocation(@ConnectedSocket() client: Socket, @MessageBody() data: { driverId: string; lat: number; lng: number }): void {
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
  handleOrderCompleted(payload: any): void {
    const event = {
      type: 'order.confirmed',
      orderId: payload.orderId,
      status: 'confirmed',
      dispensaryId: payload.dispensaryId,
      total: payload.total,
      orderType: payload.orderType,
      timestamp: new Date().toISOString(),
    };

    // Notify customer
    if (payload.customerUserId) {
      this.server.to('user:' + payload.customerUserId).emit('order:update', event);
    }

    // Notify dispensary staff
    if (payload.dispensaryId) {
      this.server.to('staff:' + payload.dispensaryId).emit('order:new', event);
    }

    this.logger.log('WS broadcast: order.confirmed ' + payload.orderId);
  }

  @OnEvent('order.status_changed')
  handleOrderStatusChanged(payload: { orderId: string; dispensaryId: string; customerUserId?: string; status: string; total?: number; orderType?: string }): void {
    const event = {
      type: 'order.status_changed',
      orderId: payload.orderId,
      status: payload.status,
      dispensaryId: payload.dispensaryId,
      timestamp: new Date().toISOString(),
    };

    // Notify anyone subscribed to this order
    this.server.to('order:' + payload.orderId).emit('order:update', event);

    // Notify customer
    if (payload.customerUserId) {
      this.server.to('user:' + payload.customerUserId).emit('order:update', event);
    }

    // Notify dispensary staff
    if (payload.dispensaryId) {
      this.server.to('staff:' + payload.dispensaryId).emit('order:update', event);
    }

    this.logger.log('WS broadcast: ' + payload.status + ' → ' + payload.orderId);
  }

  @OnEvent('inventory.low_stock')
  handleLowStock(payload: { dispensaryId: string; productName: string; quantity: number }): void {
    this.server.to('staff:' + payload.dispensaryId).emit('inventory:alert', {
      type: 'low_stock',
      productName: payload.productName,
      quantity: payload.quantity,
      timestamp: new Date().toISOString(),
    });
  }

  @OnEvent('delivery.status_changed')
  handleDeliveryUpdate(payload: { dispensaryId: string; tripId: string; driverId: string; status: string; orderId?: string; customerUserId?: string }): void {
    const event = {
      type: 'delivery.update',
      tripId: payload.tripId,
      driverId: payload.driverId,
      status: payload.status,
      timestamp: new Date().toISOString(),
    };

    // Staff
    this.server.to('staff:' + payload.dispensaryId).emit('delivery:update', event);

    // Customer tracking their delivery
    if (payload.customerUserId) {
      this.server.to('user:' + payload.customerUserId).emit('delivery:update', event);
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
    return [...this.clients.values()].map(c => ({ userId: c.userId, email: c.email, role: c.role }));
  }
}
