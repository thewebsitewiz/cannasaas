import { ComplianceService } from './compliance.service';
import { ComplianceEventType } from './entities/compliance-log.entity';
export declare class ComplianceController {
    private complianceService;
    constructor(complianceService: ComplianceService);
    getComplianceLogs(dispensaryId: string, startDate: string, endDate: string, eventType?: ComplianceEventType): Promise<{}>;
    checkPurchaseLimit(req: any, dispensaryId: string, weight: string): Promise<{
        withinLimit: boolean;
        dailyTotal: number;
        limit: number;
    }>;
    generateDailyReport(body: {
        dispensaryId: string;
        date: string;
    }): Promise<import("./entities/daily-sales-report.entity").DailySalesReport>;
    getSalesAnalytics(dispensaryId: string, startDate: string, endDate: string): Promise<{}>;
    getTopProducts(dispensaryId: string, startDate: string, endDate: string, limit?: string): Promise<{}>;
    getRevenueByPeriod(dispensaryId: string, period: 'day' | 'week' | 'month', startDate: string, endDate: string): Promise<{}>;
}
