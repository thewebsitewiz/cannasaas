import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  ComplianceLog,
  ComplianceEventType,
} from './entities/compliance-log.entity';
import { DailySalesReport } from './entities/daily-sales-report.entity';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class ComplianceService {
  constructor(
    @InjectRepository(ComplianceLog)
    private complianceLogRepository: Repository<ComplianceLog>,
    @InjectRepository(DailySalesReport)
    private dailyReportRepository: Repository<DailySalesReport>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  // --- Compliance Logging ---

  async logEvent(
    dispensaryId: string,
    eventType: ComplianceEventType,
    details: Record<string, any>,
    performedBy?: string,
    orderId?: string,
  ): Promise<ComplianceLog> {
    const log = this.complianceLogRepository.create({
      dispensaryId,
      eventType,
      details,
      performedBy,
      orderId,
    });
    return this.complianceLogRepository.save(log);
  }

  async logSale(order: Order, performedBy: string): Promise<ComplianceLog> {
    return this.logEvent(
      order.dispensaryId,
      ComplianceEventType.SALE,
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        items: order.items.map((item) => ({
          productName: item.productName,
          variantName: item.variantName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          batchNumber: item.batchNumber,
          licenseNumber: item.licenseNumber,
        })),
        subtotal: order.subtotal,
        taxAmount: order.taxAmount,
        exciseTax: order.exciseTax,
        total: order.total,
      },
      performedBy,
      order.id,
    );
  }

  async getComplianceLogs(
    dispensaryId: string,
    startDate: Date,
    endDate: Date,
    eventType?: ComplianceEventType,
  ): Promise<ComplianceLog[]> {
    const where: any = {
      dispensaryId,
      createdAt: Between(startDate, endDate),
    };
    if (eventType) where.eventType = eventType;

    return this.complianceLogRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  // --- Purchase Limit Checking ---
  // NY/NJ/CT have daily purchase limits for cannabis

  async checkPurchaseLimit(
    dispensaryId: string,
    userId: string,
    requestedWeight: number, // in grams
  ): Promise<{ withinLimit: boolean; dailyTotal: number; limit: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's orders for this customer
    const todaysOrders = await this.orderRepository.find({
      where: {
        dispensaryId,
        userId,
        createdAt: Between(today, tomorrow),
      },
      relations: ['items'],
    });

    // Calculate total weight purchased today
    const dailyTotal = todaysOrders.reduce((total, order) => {
      return (
        total +
        order.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0)
      );
    }, 0);

    // NY adult-use limit: 3 oz (85g) of flower per transaction
    // This is simplified — real limits vary by product type
    const limit = 85; // grams
    const withinLimit = dailyTotal + requestedWeight <= limit;

    // Log the check
    await this.logEvent(
      dispensaryId,
      ComplianceEventType.PURCHASE_LIMIT_CHECK,
      { userId, dailyTotal, requestedWeight, withinLimit, limit },
      userId,
    );

    return { withinLimit, dailyTotal, limit };
  }

  // --- Daily Sales Report Generation ---

  async generateDailyReport(
    dispensaryId: string,
    date: string, // YYYY-MM-DD
  ): Promise<DailySalesReport> {
    const startDate = new Date(`${date}T00:00:00Z`);
    const endDate = new Date(`${date}T23:59:59Z`);

    const orders = await this.orderRepository.find({
      where: {
        dispensaryId,
        createdAt: Between(startDate, endDate),
      },
      relations: ['items'],
    });

    const completedOrders = orders.filter((o) => o.status === 'completed');
    const cancelledOrders = orders.filter((o) => o.status === 'cancelled');
    const refundedOrders = orders.filter((o) => o.status === 'refunded');

    const totalRevenue = completedOrders.reduce(
      (sum, o) => sum + Number(o.total),
      0,
    );
    const totalTax = completedOrders.reduce(
      (sum, o) => sum + Number(o.taxAmount),
      0,
    );
    const totalExciseTax = completedOrders.reduce(
      (sum, o) => sum + Number(o.exciseTax),
      0,
    );
    const totalItemsSold = completedOrders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
      0,
    );
    const uniqueCustomers = new Set(completedOrders.map((o) => o.userId)).size;
    const refundedAmount = refundedOrders.reduce(
      (sum, o) => sum + Number(o.total),
      0,
    );

    const report = this.dailyReportRepository.create({
      dispensaryId,
      reportDate: date,
      totalOrders: completedOrders.length,
      totalRevenue,
      totalTax,
      totalExciseTax,
      totalItemsSold,
      averageOrderValue:
        completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
      uniqueCustomers,
      cancelledOrders: cancelledOrders.length,
      refundedAmount,
    });

    return this.dailyReportRepository.save(report);
  }

  // --- Analytics Queries ---

  async getSalesAnalytics(
    dispensaryId: string,
    startDate: string,
    endDate: string,
  ): Promise<DailySalesReport[]> {
    return this.dailyReportRepository.find({
      where: {
        dispensaryId,
        reportDate: Between(startDate, endDate),
      },
      order: { reportDate: 'ASC' },
    });
  }

  async getTopProducts(
    dispensaryId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10,
  ): Promise<any[]> {
    return this.orderRepository
      .createQueryBuilder('order')
      .select('item.product_name', 'productName')
      .addSelect('SUM(item.quantity)', 'totalQuantity')
      .addSelect('SUM(item.line_total)', 'totalRevenue')
      .innerJoin('order.items', 'item')
      .where('order.dispensaryId = :dispensaryId', { dispensaryId })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere("order.status = 'completed'")
      .groupBy('item.product_name')
      .orderBy('"totalRevenue"', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getRevenueByPeriod(
    dispensaryId: string,
    period: 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    const dateFormat =
      period === 'day'
        ? "TO_CHAR(order.created_at, 'YYYY-MM-DD')"
        : period === 'week'
          ? "TO_CHAR(DATE_TRUNC('week', order.created_at), 'YYYY-MM-DD')"
          : "TO_CHAR(DATE_TRUNC('month', order.created_at), 'YYYY-MM')";

    return this.orderRepository
      .createQueryBuilder('order')
      .select(dateFormat, 'period')
      .addSelect('COUNT(*)', 'orderCount')
      .addSelect('SUM(order.total)', 'totalRevenue')
      .addSelect('SUM(order.tax_amount)', 'totalTax')
      .addSelect('SUM(order.excise_tax)', 'totalExciseTax')
      .where('order.dispensaryId = :dispensaryId', { dispensaryId })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere("order.status = 'completed'")
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();
  }
}
