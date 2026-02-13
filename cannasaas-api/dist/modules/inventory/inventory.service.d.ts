import { Repository, DataSource } from 'typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class InventoryService {
    private invRepo;
    private movementRepo;
    private dataSource;
    private eventEmitter;
    private readonly logger;
    constructor(invRepo: Repository<InventoryItem>, movementRepo: Repository<StockMovement>, dataSource: DataSource, eventEmitter: EventEmitter2);
    adjustStock(dto: {
        productId: string;
        variantId?: string;
        locationId: string;
        quantity: number;
        reason: string;
        userId: string;
        type: 'receive' | 'sell' | 'adjust' | 'return' | 'damage';
    }): Promise<InventoryItem>;
    reserveStock(items: {
        productId: string;
        variantId?: string;
        locationId: string;
        quantity: number;
    }[]): Promise<void>;
}
