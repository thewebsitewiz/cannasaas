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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DeliveryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const delivery_entity_1 = require("./entities/delivery.entity");
const notification_gateway_1 = require("../notifications/notification.gateway");
const STATUS_FLOW = [
    delivery_entity_1.DeliveryStatus.PENDING, delivery_entity_1.DeliveryStatus.ASSIGNED,
    delivery_entity_1.DeliveryStatus.PICKED_UP, delivery_entity_1.DeliveryStatus.IN_TRANSIT,
    delivery_entity_1.DeliveryStatus.ARRIVING, delivery_entity_1.DeliveryStatus.DELIVERED,
];
let DeliveryService = DeliveryService_1 = class DeliveryService {
    constructor(deliveryRepo, notifications) {
        this.deliveryRepo = deliveryRepo;
        this.notifications = notifications;
        this.logger = new common_1.Logger(DeliveryService_1.name);
    }
    async assignDriver(deliveryId, driverId, driverName) {
        const delivery = await this.deliveryRepo.findOneOrFail({
            where: { id: deliveryId },
        });
        delivery.driverId = driverId;
        delivery.driverName = driverName;
        delivery.status = delivery_entity_1.DeliveryStatus.ASSIGNED;
        delivery.assignedAt = new Date();
        await this.deliveryRepo.save(delivery);
        this.notifications.sendToOrder(delivery.orderId, 'delivery:assigned', {
            driverName, estimatedMinutes: delivery.estimatedMinutes,
        });
        return delivery;
    }
    async updateStatus(deliveryId, status) {
        const delivery = await this.deliveryRepo.findOneOrFail({
            where: { id: deliveryId },
        });
        const currentIdx = STATUS_FLOW.indexOf(delivery.status);
        const newIdx = STATUS_FLOW.indexOf(status);
        if (newIdx <= currentIdx)
            throw new Error(`Cannot transition from ${delivery.status} to ${status}`);
        delivery.status = status;
        if (status === delivery_entity_1.DeliveryStatus.PICKED_UP)
            delivery.pickedUpAt = new Date();
        if (status === delivery_entity_1.DeliveryStatus.DELIVERED)
            delivery.deliveredAt = new Date();
        await this.deliveryRepo.save(delivery);
        this.notifications.sendToOrder(delivery.orderId, 'delivery:status', {
            status, timestamp: new Date(),
        });
        return delivery;
    }
    async updateLocation(deliveryId, lat, lng) {
        const delivery = await this.deliveryRepo.findOneOrFail({
            where: { id: deliveryId },
        });
        delivery.currentLat = lat;
        delivery.currentLng = lng;
        const distance = this.haversineDistance(lat, lng, delivery.lat, delivery.lng);
        delivery.estimatedMinutes = Math.max(2, Math.round(distance / 0.5));
        await this.deliveryRepo.save(delivery);
        this.notifications.sendToOrder(delivery.orderId, 'delivery:location', {
            lat, lng, estimatedMinutes: delivery.estimatedMinutes,
        });
    }
    haversineDistance(lat1, lng1, lat2, lng2) {
        const R = 3959;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
};
exports.DeliveryService = DeliveryService;
exports.DeliveryService = DeliveryService = DeliveryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(delivery_entity_1.Delivery)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        notification_gateway_1.NotificationGateway])
], DeliveryService);
//# sourceMappingURL=delivery.service.js.map