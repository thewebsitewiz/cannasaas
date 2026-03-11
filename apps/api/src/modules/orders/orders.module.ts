import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderLineItem } from './entities/order-line-item.entity';
import { OrdersService } from './orders.service';
import { OrdersResolver } from './orders.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderLineItem])],
  providers: [OrdersService, OrdersResolver],
  exports: [OrdersService],
})
export class OrdersModule {}
