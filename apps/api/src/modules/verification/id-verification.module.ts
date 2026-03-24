import { Module } from '@nestjs/common';
import { IdVerificationService } from './id-verification.service';
import { IdVerificationResolver } from './id-verification.resolver';

@Module({
  providers: [IdVerificationService, IdVerificationResolver],
  exports: [IdVerificationService],
})
export class IdVerificationModule {}
