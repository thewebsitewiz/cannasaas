import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';

@Controller('tenants')
export class TenantsController {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  @Get('public')
  async getPublicTenants() {
    return this.tenantRepository.find({
      select: ['id', 'name', 'subdomain'],
    });
  }
}
