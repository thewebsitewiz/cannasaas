import { Module } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyResolver } from './loyalty.resolver';

@Module({
  providers: [LoyaltyService, LoyaltyResolver],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
