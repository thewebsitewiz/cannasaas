import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
export declare class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwt;
    server: Server;
    private readonly logger;
    constructor(jwt: JwtService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleOrderSubscribe(client: Socket, orderId: string): void;
    sendToUser(userId: string, event: string, data: any): void;
    sendToOrg(orgId: string, event: string, data: any): void;
    sendToOrder(orderId: string, event: string, data: any): void;
    sendToAdmin(orgId: string, event: string, data: any): void;
}
