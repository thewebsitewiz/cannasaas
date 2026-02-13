import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { AnalyticsEvent } from './entities/analytics-event.entity';
export declare class AdvancedAnalyticsService {
    private orderRepo;
    private eventRepo;
    constructor(orderRepo: Repository<Order>, eventRepo: Repository<AnalyticsEvent>);
    getRevenueTrends(orgId: string, days?: number): Promise<any>;
    getCohortAnalysis(orgId: string): Promise<any>;
    getConversionFunnel(orgId: string, days?: number): Promise<{
        step: string;
        sessions: number;
    }[]>;
}
