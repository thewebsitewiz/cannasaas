import { Module } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { MarketingResolver } from './marketing.resolver';

@Module({
  providers: [MarketingService, MarketingResolver],
  exports: [MarketingService],
})
export class MarketingModule {}
