import { HealthCheckService, TypeOrmHealthIndicator, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health';
export declare class HealthController {
    private health;
    private db;
    private memory;
    private disk;
    private redis;
    constructor(health: HealthCheckService, db: TypeOrmHealthIndicator, memory: MemoryHealthIndicator, disk: DiskHealthIndicator, redis: RedisHealthIndicator);
    liveness(): Promise<import("@nestjs/terminus").HealthCheckResult>;
    readiness(): Promise<import("@nestjs/terminus").HealthCheckResult>;
}
