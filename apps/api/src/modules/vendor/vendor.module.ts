import { Module } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { VendorResolver } from './vendor.resolver';

@Module({
  providers: [VendorService, VendorResolver],
  exports: [VendorService],
})
export class VendorModule {}
