import { Module } from '@nestjs/common';
import { Tenant } from './entities/tenant.entity';
import { TenantsController } from './tenants.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  controllers: [TenantsController],
  exports: [TypeOrmModule],
})
export class TenantsModule {}
