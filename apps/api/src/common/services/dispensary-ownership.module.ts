import { Global, Module } from '@nestjs/common';
import { DispensaryOwnershipService } from './dispensary-ownership.service';

@Global()
@Module({
  providers: [DispensaryOwnershipService],
  exports: [DispensaryOwnershipService],
})
export class DispensaryOwnershipModule {}
