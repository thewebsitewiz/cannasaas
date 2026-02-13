import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
export declare class ForecastService {
    private orderRepo;
    private readonly anthropic;
    constructor(orderRepo: Repository<Order>);
    forecastDemand(orgId: string, productId: string, daysAhead?: number): Promise<{
        productId: string;
        historicalAvg: number;
        historicalStdDev: number;
        forecast: any;
    }>;
}
