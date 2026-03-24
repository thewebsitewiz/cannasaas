import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Manufacturer } from './entities/manufacturer.entity';
import { ManufacturersService } from './manufacturers.service';
import { ManufacturersResolver } from './manufacturers.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Manufacturer])],
  providers: [ManufacturersService, ManufacturersResolver],
  exports: [TypeOrmModule, ManufacturersService],
})
export class ManufacturersModule {}
