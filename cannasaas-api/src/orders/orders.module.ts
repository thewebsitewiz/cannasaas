import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ComplianceModule } from '../compliance/compliance.module';

@Module({
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}
