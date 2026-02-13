import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { Cache } from 'cache-manager';
export declare class RedisHealthIndicator extends HealthIndicator {
    private cache;
    constructor(cache: Cache);
    isHealthy(key: string): Promise<HealthIndicatorResult>;
}
