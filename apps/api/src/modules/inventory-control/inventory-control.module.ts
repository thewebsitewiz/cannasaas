import { Module } from '@nestjs/common';
import { InventoryTransfer, InventoryTransferItem, InventoryCount, InventoryCountItem, InventoryAdjustment, LkpAdjustmentReason } from './entities/inventory-control.entity';
import { InventoryControlService } from './inventory-control.service';
import { InventoryControlResolver } from './inventory-control.resolver';

@Module({
  providers: [InventoryControlService, InventoryControlResolver],
  exports: [InventoryControlService],
})
export class InventoryControlModule {}
