"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
let NotificationGateway = NotificationGateway_1 = class NotificationGateway {
    constructor(jwt) {
        this.jwt = jwt;
        this.logger = new common_1.Logger(NotificationGateway_1.name);
    }
    async handleConnection(client) {
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
        }
        catch (e) {
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.data?.userId}`);
    }
    handleOrderSubscribe(client, orderId) {
        client.join(`order:${orderId}`);
    }
    sendToUser(userId, event, data) {
        this.server.to(`user:${userId}`).emit(event, data);
    }
    sendToOrg(orgId, event, data) {
        this.server.to(`org:${orgId}`).emit(event, data);
    }
    sendToOrder(orderId, event, data) {
        this.server.to(`order:${orderId}`).emit(event, data);
    }
    sendToAdmin(orgId, event, data) {
        this.server.to(`admin:${orgId}`).emit(event, data);
    }
};
exports.NotificationGateway = NotificationGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe:order'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], NotificationGateway.prototype, "handleOrderSubscribe", null);
exports.NotificationGateway = NotificationGateway = NotificationGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: process.env.FRONTEND_URL, credentials: true },
        namespace: '/ws',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], NotificationGateway);
//# sourceMappingURL=notification.gateway.js.map