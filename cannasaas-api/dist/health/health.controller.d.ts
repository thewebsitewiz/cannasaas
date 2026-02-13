import { HealthCheckService, TypeOrmHealthIndicator, MongooseHealthIndicator } from '@nestjs/terminus';
export declare class HealthController {
    private health;
    private db;
    private mongoose;
    constructor(health: HealthCheckService, db: TypeOrmHealthIndicator, mongoose: MongooseHealthIndicator);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult>;
    checkPostgres(): Promise<import("@nestjs/terminus").HealthCheckResult>;
    checkMongoDB(): Promise<import("@nestjs/terminus").HealthCheckResult>;
}
