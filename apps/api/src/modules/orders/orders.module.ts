import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderLineItem } from './entities/order-line-item.entity';
import { OrdersService } from './orders.service';
import { OrdersResolver } from './orders.resolver';
import { StaffPosResolver } from './staff-pos.resolver';
import { MetrcModule } from '../metrc/metrc.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderLineItem]), MetrcModule],
  providers: [OrdersService, OrdersResolver, StaffPosResolver],
  exports: [OrdersService],
})
export class OrdersModule {}
