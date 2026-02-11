import { ComplianceController } from './compliance.controller';
import { ComplianceLog } from './entities/compliance-log.entity';
import { ComplianceService } from './compliance.service';
import { DailySalesReport } from './entities/daily-sales-report.entity';
import { Module } from '@nestjs/common';
import { Order } from '../orders/entities/order.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ComplianceLog, DailySalesReport, Order])],
  controllers: [ComplianceController],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}
