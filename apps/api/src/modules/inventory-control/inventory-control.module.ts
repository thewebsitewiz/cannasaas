import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryTransfer, InventoryTransferItem, InventoryCount, InventoryCountItem, InventoryAdjustment, LkpAdjustmentReason } from './entities/inventory-control.entity';
import { InventoryControlService } from './inventory-control.service';
import { InventoryControlResolver } from './inventory-control.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryTransfer,
      InventoryTransferItem,
      InventoryCount,
      InventoryCountItem,
      InventoryAdjustment,
      LkpAdjustmentReason,
    ]),
  ],
  providers: [InventoryControlService, InventoryControlResolver],
  exports: [InventoryControlService],
})
export class InventoryControlModule {}
