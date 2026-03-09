import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dispensary } from './entities/dispensary.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Dispensary])],
  exports: [TypeOrmModule],
})
export class DispensariesModule {}
