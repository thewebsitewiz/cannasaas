import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from './entities/brand.entity';
import { BrandsService } from './brands.service';
import { BrandsResolver } from './brands.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Brand])],
  providers: [BrandsService, BrandsResolver],
  exports: [TypeOrmModule, BrandsService],
})
export class BrandsModule {}
