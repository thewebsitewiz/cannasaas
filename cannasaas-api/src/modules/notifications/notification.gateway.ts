// cannasaas-api/src/modules/notifications/notification.gateway.ts
import { WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
  namespace: '/ws',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(NotificationGateway.name);

  constructor(private jwt: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const payload = this.jwt.verify(token);
      client.data.userId = payload.sub;
      client.data.orgId = payload.organizationId;

      client.join(`org:${payload.organizationId}`);
      client.join(`user:${payload.sub}`);
      if (['admin', 'manager', 'staff'].includes(payload.role)) {
        client.join(`admin:${payload.organizationId}`);
      }
    } catch (e) { client.disconnect(); }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.data?.userId}`);
  }

  @SubscribeMessage('subscribe:order')
  handleOrderSubscribe(client: Socket, orderId: string) {
    client.join(`order:${orderId}`);
  }

  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  sendToOrg(orgId: string, event: string, data: any) {
    this.server.to(`org:${orgId}`).emit(event, data);
  }

  sendToOrder(orderId: string, event: string, data: any) {
    this.server.to(`order:${orderId}`).emit(event, data);
  }

  sendToAdmin(orgId: string, event: string, data: any) {
    this.server.to(`admin:${orgId}`).emit(event, data);
  }
}
