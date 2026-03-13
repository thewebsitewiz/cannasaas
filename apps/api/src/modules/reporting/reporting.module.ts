import { Module } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { ReportingResolver } from './reporting.resolver';
import { ReportController } from './report.controller';

@Module({
  providers: [ReportingService, ReportingResolver],
  controllers: [ReportController],
  exports: [ReportingService],
})
export class ReportingModule {}
