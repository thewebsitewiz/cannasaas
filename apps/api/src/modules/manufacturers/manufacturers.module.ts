import { Module } from '@nestjs/common';
import { Manufacturer } from './entities/manufacturer.entity';
import { ManufacturersService } from './manufacturers.service';
import { ManufacturersResolver } from './manufacturers.resolver';

@Module({
  providers: [ManufacturersService, ManufacturersResolver],
  exports: [ManufacturersService],
})
export class ManufacturersModule {}
