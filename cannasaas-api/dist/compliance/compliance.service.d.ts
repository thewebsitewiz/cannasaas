import { Repository } from 'typeorm';
import { ComplianceLog, ComplianceEventType } from './entities/compliance-log.entity';
import { DailySalesReport } from './entities/daily-sales-report.entity';
import { Order } from '../orders/entities/order.entity';
export declare class ComplianceService {
    private complianceLogRepository;
    private dailyReportRepository;
    private orderRepository;
    constructor(complianceLogRepository: Repository<ComplianceLog>, dailyReportRepository: Repository<DailySalesReport>, orderRepository: Repository<Order>);
    logEvent(dispensaryId: string, eventType: ComplianceEventType, details: Record<string, any>, performedBy?: string, orderId?: string): Promise<ComplianceLog>;
    logSale(order: Order, performedBy: string): Promise<ComplianceLog>;
    getComplianceLogs(dispensaryId: string, startDate: Date, endDate: Date, eventType?: ComplianceEventType): Promise<ComplianceLog[]>;
    checkPurchaseLimit(dispensaryId: string, userId: string, requestedWeight: number): Promise<{
        withinLimit: boolean;
        dailyTotal: number;
        limit: number;
    }>;
    generateDailyReport(dispensaryId: string, date: string): Promise<DailySalesReport>;
    getSalesAnalytics(dispensaryId: string, startDate: string, endDate: string): Promise<DailySalesReport[]>;
    getTopProducts(dispensaryId: string, startDate: Date, endDate: Date, limit?: number): Promise<any[]>;
    getRevenueByPeriod(dispensaryId: string, period: 'day' | 'week' | 'month', startDate: Date, endDate: Date): Promise<any[]>;
}
