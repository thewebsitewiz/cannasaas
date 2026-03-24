import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsResolver } from './analytics.resolver';
import { AnalyticsDigestService } from './analytics-digest.service';

@Module({
  providers: [AnalyticsService, AnalyticsResolver, AnalyticsDigestService],
  exports: [AnalyticsService, AnalyticsDigestService],
})
export class AnalyticsModule {}
