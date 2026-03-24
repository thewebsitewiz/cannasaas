import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dispensary } from './entities/dispensary.entity';
import { DispensariesService } from './dispensaries.service';
import { DispensariesResolver } from './dispensaries.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Dispensary])],
  providers: [DispensariesService, DispensariesResolver],
  exports: [TypeOrmModule, DispensariesService],
})
export class DispensariesModule {}
