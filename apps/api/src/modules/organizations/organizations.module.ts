import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { OrganizationsService } from './organizations.service';
import { OrganizationsResolver } from './organizations.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Organization])],
  providers: [OrganizationsService, OrganizationsResolver],
  exports: [TypeOrmModule, OrganizationsService],
})
export class OrganizationsModule {}
