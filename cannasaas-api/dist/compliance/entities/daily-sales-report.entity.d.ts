import { Dispensary } from '../../dispensaries/entities/dispensary.entity';
export declare class DailySalesReport {
    id: string;
    dispensaryId: string;
    reportDate: string;
    totalOrders: number;
    totalRevenue: number;
    totalTax: number;
    totalExciseTax: number;
    totalItemsSold: number;
    averageOrderValue: number;
    uniqueCustomers: number;
    salesByType: Record<string, {
        count: number;
        revenue: number;
    }>;
    salesByCategory: Record<string, {
        count: number;
        revenue: number;
    }>;
    cancelledOrders: number;
    refundedAmount: number;
    dispensary: Dispensary;
    createdAt: Date;
}
