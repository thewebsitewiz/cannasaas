import { Module } from '@nestjs/common';
import { Dispensary } from './entities/dispensary.entity';
import { DispensariesService } from './dispensaries.service';
import { DispensariesResolver } from './dispensaries.resolver';

@Module({
  providers: [DispensariesService, DispensariesResolver],
  exports: [DispensariesService],
})
export class DispensariesModule {}
