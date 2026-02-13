import { Response } from 'express';
import { MetricsService } from './metrics.service';
export declare class MetricsController {
    private metricsService;
    constructor(metricsService: MetricsService);
    getMetrics(res: Response): Promise<void>;
}
