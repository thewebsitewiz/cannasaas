import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryZone } from './entities/delivery-zone.entity';
import { DeliveryTimeSlot } from './entities/delivery-time-slot.entity';
import { OrderTracking } from './entities/order-tracking.entity';
import { FulfillmentService } from './fulfillment.service';
import { FulfillmentResolver } from './fulfillment.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryZone, DeliveryTimeSlot, OrderTracking])],
  providers: [FulfillmentService, FulfillmentResolver],
  exports: [FulfillmentService],
})
export class FulfillmentModule {}
