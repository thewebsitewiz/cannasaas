import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from './entities/inventory.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { InventoryService } from './inventory.service';
import { InventoryResolver } from './inventory.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Inventory, InventoryTransaction])],
  providers: [InventoryService, InventoryResolver],
  exports: [TypeOrmModule, InventoryService],
})
export class InventoryModule {}
