// cannasaas-api/src/modules/inventory/inventory.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(InventoryItem) private invRepo: Repository<InventoryItem>,
    @InjectRepository(StockMovement) private movementRepo: Repository<StockMovement>,
    private dataSource: DataSource,
    private eventEmitter: EventEmitter2,
  ) {}

  async adjustStock(dto: {
    productId: string; variantId?: string; locationId: string;
    quantity: number; reason: string; userId: string;
    type: 'receive' | 'sell' | 'adjust' | 'return' | 'damage';
  }) {
    return this.dataSource.transaction(async (manager) => {
      const item = await manager.findOne(InventoryItem, {
        where: { productId: dto.productId, variantId: dto.variantId,
          locationId: dto.locationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!item) throw new BadRequestException('Inventory item not found');

      const previousQty = item.quantityOnHand;
      item.quantityOnHand += dto.quantity;
      if (item.quantityOnHand < 0)
        throw new BadRequestException('Insufficient stock');

      await manager.save(item);
      await manager.save(StockMovement, {
        inventoryItemId: item.id, type: dto.type,
        quantity: dto.quantity, previousQuantity: previousQty,
        newQuantity: item.quantityOnHand,
        reason: dto.reason, userId: dto.userId,
      });

      // Low stock alert
      if (item.quantityOnHand <= item.lowStockThreshold
          && previousQty > item.lowStockThreshold) {
        this.eventEmitter.emit('inventory.low_stock', {
          productId: dto.productId, current: item.quantityOnHand,
          threshold: item.lowStockThreshold,
        });
      }

      // Restock notification
      if (previousQty <= 0 && item.quantityOnHand > 0) {
        this.eventEmitter.emit('inventory.restocked', {
          productId: dto.productId, variantId: dto.variantId,
        });
      }

      return item;
    });
  }

  async reserveStock(items: { productId: string; variantId?: string;
    locationId: string; quantity: number }[]) {
    return this.dataSource.transaction(async (manager) => {
      for (const item of items) {
        const inv = await manager.findOne(InventoryItem, {
          where: { productId: item.productId, variantId: item.variantId,
            locationId: item.locationId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!inv || inv.quantityOnHand - inv.quantityReserved < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${item.productId}`);
        }
        inv.quantityReserved += item.quantity;
        await manager.save(inv);
      }
    });
  }
}
