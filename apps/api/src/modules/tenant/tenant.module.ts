import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantService } from './tenant.service';
import { TenantMiddleware } from './tenant.middleware';
import { Dispensary } from '../dispensaries/entities/dispensary.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Dispensary])],
  providers: [TenantService, TenantMiddleware],
  exports: [TenantService],
})
export class TenantModule {}
