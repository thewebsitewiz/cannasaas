import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Request,
  Body,
} from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { ComplianceEventType } from './entities/compliance-log.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('compliance')
@UseGuards(JwtAuthGuard)
export class ComplianceController {
  constructor(private complianceService: ComplianceService) {}

  @Get('logs')
  getComplianceLogs(
    @Query('dispensaryId') dispensaryId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('eventType') eventType?: ComplianceEventType,
  ) {
    return this.complianceService.getComplianceLogs(
      dispensaryId,
      new Date(startDate),
      new Date(endDate),
      eventType,
    );
  }

  @Get('purchase-limit')
  checkPurchaseLimit(
    @Request() req,
    @Query('dispensaryId') dispensaryId: string,
    @Query('weight') weight: string,
  ) {
    return this.complianceService.checkPurchaseLimit(
      dispensaryId,
      req.user.userId,
      parseFloat(weight),
    );
  }

  @Post('reports/daily')
  generateDailyReport(@Body() body: { dispensaryId: string; date: string }) {
    return this.complianceService.generateDailyReport(
      body.dispensaryId,
      body.date,
    );
  }

  @Get('analytics/sales')
  getSalesAnalytics(
    @Query('dispensaryId') dispensaryId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.complianceService.getSalesAnalytics(
      dispensaryId,
      startDate,
      endDate,
    );
  }

  @Get('analytics/top-products')
  getTopProducts(
    @Query('dispensaryId') dispensaryId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit') limit?: string,
  ) {
    return this.complianceService.getTopProducts(
      dispensaryId,
      new Date(startDate),
      new Date(endDate),
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('analytics/revenue')
  getRevenueByPeriod(
    @Query('dispensaryId') dispensaryId: string,
    @Query('period') period: 'day' | 'week' | 'month',
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.complianceService.getRevenueByPeriod(
      dispensaryId,
      period,
      new Date(startDate),
      new Date(endDate),
    );
  }
}
