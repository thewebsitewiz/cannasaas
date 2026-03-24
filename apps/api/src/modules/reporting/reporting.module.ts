import { Module } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { ReportingResolver } from './reporting.resolver';
import { ReportController } from './report.controller';
import { PdfReportService } from './pdf-report.service';

@Module({
  providers: [ReportingService, ReportingResolver, PdfReportService],
  controllers: [ReportController],
  exports: [ReportingService, PdfReportService],
})
export class ReportingModule {}
