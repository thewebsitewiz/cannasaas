import { Module } from '@nestjs/common';
import { CustomerProfile, CustomerAddress, AgeVerification } from './entities/customer.entity';
import { CustomerService } from './customer.service';
import { CustomerResolver } from './customer.resolver';
import { SegmentationService } from './segmentation.service';

@Module({
  providers: [CustomerService, CustomerResolver, SegmentationService],
  exports: [CustomerService, SegmentationService],
})
export class CustomerModule {}
