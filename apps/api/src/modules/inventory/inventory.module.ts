import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from './entities/inventory.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { InventoryService } from './inventory.service';
import { InventoryResolver } from './inventory.resolver';
import { InventoryAuditController } from './inventory-audit.controller';
import { ReorderSuggestionService } from './reorder-suggestion.service';
import { StockEventEmitterService } from './stock-event-emitter.service';

@Module({
  imports: [TypeOrmModule.forFeature([Inventory, InventoryTransaction])],
  providers: [
    InventoryService,
    InventoryResolver,
    ReorderSuggestionService,
    StockEventEmitterService,
  ],
  controllers: [InventoryAuditController],
  exports: [TypeOrmModule, InventoryService, ReorderSuggestionService],
})
export class InventoryModule {}
