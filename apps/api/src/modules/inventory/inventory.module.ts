import { Module } from '@nestjs/common';
import { Inventory } from './entities/inventory.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { InventoryService } from './inventory.service';
import { InventoryResolver } from './inventory.resolver';
import { ReorderSuggestionService } from './reorder-suggestion.service';

@Module({
  providers: [InventoryService, InventoryResolver, ReorderSuggestionService],
  exports: [InventoryService, ReorderSuggestionService],
})
export class InventoryModule {}
