import { Module } from '@nestjs/common';
import { HealthController, StatusController } from './health.controller';
import { StatusService } from './status.service';

@Module({
  controllers: [HealthController, StatusController],
  providers: [StatusService],
})
export class HealthModule {}
