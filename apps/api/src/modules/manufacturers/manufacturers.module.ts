import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Manufacturer } from './entities/manufacturer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Manufacturer])],
  exports: [TypeOrmModule],
})
export class ManufacturersModule {}
