import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { MetricsService } from '../metrics/metrics.service';
export declare class MetricsInterceptor implements NestInterceptor {
    private metrics;
    constructor(metrics: MetricsService);
    intercept(ctx: ExecutionContext, next: CallHandler): Observable<any>;
}
