import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TenantService } from '../tenant/tenant.service';

      declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant;
    }
  }
      }
    

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    private tenantService: TenantService,
  ) {}



  async use(req: Request, res: Response, next: NextFunction) {

    // Extract subdomain from hostname
    const hostname = req.hostname;
    const subdomain = this.extractSubdomain(hostname);

    if (!subdomain) {
      throw new NotFoundException('Tenant not found');
    }

    // Find tenant by subdomain
    const tenant = await this.tenantRepository.findOne({
      where: { subdomain },
    });

    if (!tenant) {
      throw new NotFoundException(
        `Tenant with subdomain "${subdomain}" not found`,
      );
    }

    // Set tenant ID in request-scoped service
    this.tenantService.setTenantId(tenant.id);

    // Also attach to request object for easy access
  req.tenant = tenant;

    next();
  }

  private extractSubdomain(hostname: string): string {
    // Example: demo.cannasaas.com -> demo
    // For development: demo.localhost -> demo
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return parts[0];
    }
    return '';
  }
} 