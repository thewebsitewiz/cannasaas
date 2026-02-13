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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Delivery = exports.DeliveryStatus = void 0;
const typeorm_1 = require("typeorm");
var DeliveryStatus;
(function (DeliveryStatus) {
    DeliveryStatus["PENDING"] = "pending";
    DeliveryStatus["ASSIGNED"] = "assigned";
    DeliveryStatus["PICKED_UP"] = "picked_up";
    DeliveryStatus["IN_TRANSIT"] = "in_transit";
    DeliveryStatus["ARRIVING"] = "arriving";
    DeliveryStatus["DELIVERED"] = "delivered";
    DeliveryStatus["CANCELLED"] = "cancelled";
})(DeliveryStatus || (exports.DeliveryStatus = DeliveryStatus = {}));
let Delivery = class Delivery {
};
exports.Delivery = Delivery;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Delivery.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'order_id', type: 'uuid' }),
    __metadata("design:type", String)
], Delivery.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'organization_id', type: 'uuid' }),
    __metadata("design:type", String)
], Delivery.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'driver_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "driverId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'driver_name', length: 255, nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "driverName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.PENDING }),
    __metadata("design:type", String)
], Delivery.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7 }),
    __metadata("design:type", Number)
], Delivery.prototype, "lat", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7 }),
    __metadata("design:type", Number)
], Delivery.prototype, "lng", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'current_lat', type: 'decimal', precision: 10, scale: 7, nullable: true }),
    __metadata("design:type", Number)
], Delivery.prototype, "currentLat", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'current_lng', type: 'decimal', precision: 10, scale: 7, nullable: true }),
    __metadata("design:type", Number)
], Delivery.prototype, "currentLng", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'estimated_minutes', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Delivery.prototype, "estimatedMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'delivery_address', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "deliveryAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'customer_phone', length: 20, nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "customerPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assigned_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Delivery.prototype, "assignedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'picked_up_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Delivery.prototype, "pickedUpAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'delivered_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Delivery.prototype, "deliveredAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Delivery.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Delivery.prototype, "updatedAt", void 0);
exports.Delivery = Delivery = __decorate([
    (0, typeorm_1.Entity)('deliveries'),
    (0, typeorm_1.Index)(['orderId']),
    (0, typeorm_1.Index)(['driverId', 'status'])
], Delivery);
//# sourceMappingURL=delivery.entity.js.map