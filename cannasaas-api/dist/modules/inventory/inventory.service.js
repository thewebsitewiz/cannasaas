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
var InventoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const inventory_item_entity_1 = require("./entities/inventory-item.entity");
const stock_movement_entity_1 = require("./entities/stock-movement.entity");
const event_emitter_1 = require("@nestjs/event-emitter");
let InventoryService = InventoryService_1 = class InventoryService {
    constructor(invRepo, movementRepo, dataSource, eventEmitter) {
        this.invRepo = invRepo;
        this.movementRepo = movementRepo;
        this.dataSource = dataSource;
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(InventoryService_1.name);
    }
    async adjustStock(dto) {
        return this.dataSource.transaction(async (manager) => {
            const item = await manager.findOne(inventory_item_entity_1.InventoryItem, {
                where: { productId: dto.productId, variantId: dto.variantId,
                    locationId: dto.locationId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!item)
                throw new common_1.BadRequestException('Inventory item not found');
            const previousQty = item.quantityOnHand;
            item.quantityOnHand += dto.quantity;
            if (item.quantityOnHand < 0)
                throw new common_1.BadRequestException('Insufficient stock');
            await manager.save(item);
            await manager.save(stock_movement_entity_1.StockMovement, {
                inventoryItemId: item.id, type: dto.type,
                quantity: dto.quantity, previousQuantity: previousQty,
                newQuantity: item.quantityOnHand,
                reason: dto.reason, userId: dto.userId,
            });
            if (item.quantityOnHand <= item.lowStockThreshold
                && previousQty > item.lowStockThreshold) {
                this.eventEmitter.emit('inventory.low_stock', {
                    productId: dto.productId, current: item.quantityOnHand,
                    threshold: item.lowStockThreshold,
                });
            }
            if (previousQty <= 0 && item.quantityOnHand > 0) {
                this.eventEmitter.emit('inventory.restocked', {
                    productId: dto.productId, variantId: dto.variantId,
                });
            }
            return item;
        });
    }
    async reserveStock(items) {
        return this.dataSource.transaction(async (manager) => {
            for (const item of items) {
                const inv = await manager.findOne(inventory_item_entity_1.InventoryItem, {
                    where: { productId: item.productId, variantId: item.variantId,
                        locationId: item.locationId },
                    lock: { mode: 'pessimistic_write' },
                });
                if (!inv || inv.quantityOnHand - inv.quantityReserved < item.quantity) {
                    throw new common_1.BadRequestException(`Insufficient stock for product ${item.productId}`);
                }
                inv.quantityReserved += item.quantity;
                await manager.save(inv);
            }
        });
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = InventoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inventory_item_entity_1.InventoryItem)),
    __param(1, (0, typeorm_1.InjectRepository)(stock_movement_entity_1.StockMovement)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        event_emitter_1.EventEmitter2])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map