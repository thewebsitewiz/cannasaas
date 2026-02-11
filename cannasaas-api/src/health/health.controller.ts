import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MongooseHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private mongoose: MongooseHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('postgres'),
      () => this.mongoose.pingCheck('mongodb'),
    ]);
  }

  @Get('postgres')
  @HealthCheck()
  checkPostgres() {
    return this.health.check([
      () => this.db.pingCheck('postgres', { timeout: 300 }),
    ]);
  }

  @Get('mongodb')
  @HealthCheck()
  checkMongoDB() {
    return this.health.check([
      () => this.mongoose.pingCheck('mongodb', { timeout: 300 }),
    ]);
  }
}
