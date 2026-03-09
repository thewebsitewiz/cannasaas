import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderLineItem } from './entities/order-line-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderLineItem])],
  exports: [TypeOrmModule],
})
export class OrdersModule {}
