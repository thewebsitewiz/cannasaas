import { DesignSystemResolver } from './design-system.resolver';
import { DispensariesResolver } from './dispensaries.resolver';
import { DispensariesService } from './dispensaries.service';
import { Dispensary } from './entities/dispensary.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Dispensary])],
  providers: [DispensariesService, DispensariesResolver],
  exports: [TypeOrmModule, DispensariesService],
})
export class DispensariesModule {}
