import { HealthCheckService, TypeOrmHealthIndicator, MongooseHealthIndicator } from '@nestjs/terminus';
export declare class HealthController {
    private health;
    private db;
    private mongoose;
    constructor(health: HealthCheckService, db: TypeOrmHealthIndicator, mongoose: MongooseHealthIndicator);
    check(): any;
    checkPostgres(): any;
    checkMongoDB(): any;
}
