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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("./entities/order.entity");
const order_item_entity_1 = require("./entities/order-item.entity");
const order_status_history_entity_1 = require("./entities/order-status-history.entity");
const cart_service_1 = require("./cart.service");
const products_service_1 = require("../products/products.service");
const compliance_service_1 = require("../compliance/compliance.service");
let OrdersService = class OrdersService {
    constructor(orderRepository, orderItemRepository, statusHistoryRepository, cartService, productsService, dataSource, complianceService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.cartService = cartService;
        this.productsService = productsService;
        this.dataSource = dataSource;
        this.complianceService = complianceService;
    }
    async checkout(userId, tenantId, dto) {
        const cartSummary = await this.cartService.getCartSummary(userId, dto.dispensaryId);
        if (cartSummary.items.length === 0) {
            throw new common_1.BadRequestException('Cart is empty');
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const subtotal = cartSummary.subtotal;
            const taxRate = 0.08875;
            const exciseTaxRate = 0.09;
            const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
            const exciseTax = Math.round(subtotal * exciseTaxRate * 100) / 100;
            const total = subtotal + taxAmount + exciseTax;
            const orderNumber = await this.generateOrderNumber(dto.dispensaryId);
            const order = this.orderRepository.create({
                orderNumber,
                userId,
                dispensaryId: dto.dispensaryId,
                tenantId,
                subtotal,
                taxAmount,
                exciseTax,
                total,
                fulfillmentType: dto.fulfillmentType,
                customerName: dto.customerName,
                customerEmail: dto.customerEmail,
                customerPhone: dto.customerPhone,
                deliveryAddress: dto.deliveryAddress,
                notes: dto.notes,
                status: order_entity_1.OrderStatus.PENDING,
            });
            const savedOrder = await queryRunner.manager.save(order);
            for (const cartItem of cartSummary.items) {
                const orderItem = this.orderItemRepository.create({
                    orderId: savedOrder.id,
                    productId: cartItem.variant.product.id,
                    variantId: cartItem.variantId,
                    productName: cartItem.variant.product.name,
                    variantName: cartItem.variant.name,
                    unitPrice: cartItem.unitPrice,
                    quantity: cartItem.quantity,
                    lineTotal: Number(cartItem.unitPrice) * cartItem.quantity,
                    batchNumber: cartItem.variant.product.batchNumber,
                    licenseNumber: cartItem.variant.product.licenseNumber,
                });
                await queryRunner.manager.save(orderItem);
                await this.productsService.updateInventory(cartItem.variantId, -cartItem.quantity);
            }
            const statusHistory = this.statusHistoryRepository.create({
                orderId: savedOrder.id,
                fromStatus: null,
                toStatus: order_entity_1.OrderStatus.PENDING,
                changedBy: userId,
                notes: 'Order placed',
            });
            await queryRunner.manager.save(statusHistory);
            await this.cartService.clearCart(userId, dto.dispensaryId);
            await queryRunner.commitTransaction();
            const fullOrder = await this.findOne(savedOrder.id);
            await this.complianceService.logSale(fullOrder, userId);
            return this.findOne(savedOrder.id);
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async findOne(id) {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: ['items', 'statusHistory'],
            order: { statusHistory: { createdAt: 'ASC' } },
        });
        if (!order) {
            throw new common_1.NotFoundException(`Order ${id} not found`);
        }
        return order;
    }
    async findByUser(userId, dispensaryId) {
        const where = { userId };
        if (dispensaryId)
            where.dispensaryId = dispensaryId;
        return this.orderRepository.find({
            where,
            relations: ['items'],
            order: { createdAt: 'DESC' },
        });
    }
    async findByDispensary(dispensaryId, status) {
        const where = { dispensaryId };
        if (status)
            where.status = status;
        return this.orderRepository.find({
            where,
            relations: ['items'],
            order: { createdAt: 'DESC' },
        });
    }
    async updateStatus(orderId, newStatus, changedBy, notes) {
        const order = await this.findOne(orderId);
        const oldStatus = order.status;
        this.validateStatusTransition(oldStatus, newStatus);
        order.status = newStatus;
        if (newStatus === order_entity_1.OrderStatus.CONFIRMED)
            order.confirmedAt = new Date();
        if (newStatus === order_entity_1.OrderStatus.COMPLETED)
            order.completedAt = new Date();
        if (newStatus === order_entity_1.OrderStatus.CANCELLED) {
            order.cancelledAt = new Date();
            for (const item of order.items) {
                await this.productsService.updateInventory(item.variantId, item.quantity);
            }
        }
        await this.orderRepository.save(order);
        const statusHistory = this.statusHistoryRepository.create({
            orderId,
            fromStatus: oldStatus,
            toStatus: newStatus,
            changedBy,
            notes,
        });
        await this.statusHistoryRepository.save(statusHistory);
        return this.findOne(orderId);
    }
    validateStatusTransition(from, to) {
        const validTransitions = {
            [order_entity_1.OrderStatus.PENDING]: [order_entity_1.OrderStatus.CONFIRMED, order_entity_1.OrderStatus.CANCELLED],
            [order_entity_1.OrderStatus.CONFIRMED]: [order_entity_1.OrderStatus.PREPARING, order_entity_1.OrderStatus.CANCELLED],
            [order_entity_1.OrderStatus.PREPARING]: [
                order_entity_1.OrderStatus.READY_FOR_PICKUP,
                order_entity_1.OrderStatus.OUT_FOR_DELIVERY,
                order_entity_1.OrderStatus.CANCELLED,
            ],
            [order_entity_1.OrderStatus.READY_FOR_PICKUP]: [
                order_entity_1.OrderStatus.COMPLETED,
                order_entity_1.OrderStatus.CANCELLED,
            ],
            [order_entity_1.OrderStatus.OUT_FOR_DELIVERY]: [
                order_entity_1.OrderStatus.COMPLETED,
                order_entity_1.OrderStatus.CANCELLED,
            ],
            [order_entity_1.OrderStatus.COMPLETED]: [order_entity_1.OrderStatus.REFUNDED],
            [order_entity_1.OrderStatus.CANCELLED]: [],
            [order_entity_1.OrderStatus.REFUNDED]: [],
        };
        if (!validTransitions[from]?.includes(to)) {
            throw new common_1.BadRequestException(`Cannot transition from ${from} to ${to}`);
        }
    }
    async generateOrderNumber(dispensaryId) {
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const count = await this.orderRepository.count({
            where: { dispensaryId },
        });
        const seq = String(count + 1).padStart(4, '0');
        return `ORD-${today}-${seq}`;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(order_item_entity_1.OrderItem)),
    __param(2, (0, typeorm_1.InjectRepository)(order_status_history_entity_1.OrderStatusHistory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository, typeof (_a = typeof cart_service_1.CartService !== "undefined" && cart_service_1.CartService) === "function" ? _a : Object, products_service_1.ProductsService,
        typeorm_2.DataSource,
        compliance_service_1.ComplianceService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map