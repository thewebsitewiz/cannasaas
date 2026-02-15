import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { CartService } from '../cart/cart.service';
import { ProductsModule } from '../products/products.module';
import { ComplianceModule } from '../compliance/compliance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, OrderStatusHistory]),
    ProductsModule,
    ComplianceModule,
  ],
  providers: [OrdersService, CartService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
