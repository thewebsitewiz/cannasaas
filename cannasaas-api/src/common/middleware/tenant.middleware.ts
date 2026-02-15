// src/common/middleware/tenant.middleware.ts
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
    if (req.method === "OPTIONS") { next(); return; }
    // Try x-tenant-id header first (dev), then subdomain (production)
    const headerTenantId = req.headers['x-tenant-id'] as string;
    const subdomain = this.extractSubdomain(req.hostname);
    console.log('🔍 Middleware hit:', { headerTenantId, subdomain });

    let tenant: Tenant | null = null;

    if (headerTenantId) {
      // DEBUG: raw query test
      const rawResult = await this.tenantRepository.query(
        `SELECT * FROM tenants WHERE subdomain = $1`,
        [headerTenantId],
      );
      console.log('🔍 Raw query result:', rawResult);
      // Check if it's a UUID format
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          headerTenantId,
        );
      console.log('🔍 isUuid:', isUuid);

      if (isUuid) {
        tenant = await this.tenantRepository.findOne({
          where: [{ id: headerTenantId }, { subdomain: headerTenantId }],
        });
      } else {
        tenant = await this.tenantRepository.findOne({
          where: { subdomain: headerTenantId },
        });
      }
    } else if (subdomain) {
      tenant = await this.tenantRepository.findOne({
        where: { subdomain },
      });
    }

    console.log('🔍 Tenant result:', tenant);
    if (!tenant) {
      throw new NotFoundException(
        'Tenant not found. Provide x-tenant-id header or use a valid subdomain.',
      );
    }

    this.tenantService.setTenantId(tenant.id);
    req.tenant = tenant;
    next();
  }

  private extractSubdomain(hostname: string): string {
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return parts[0];
    }
    return '';
  }
}
