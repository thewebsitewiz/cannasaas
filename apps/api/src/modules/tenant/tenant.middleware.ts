import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from './tenant.service';
import { ConfigService } from '@nestjs/config';

export interface TenantRequest extends Request {
  tenantId?: string;
  dispensaryId?: string;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private tenants: TenantService,
    private config: ConfigService,
  ) {}

  async use(req: TenantRequest, _res: Response, next: NextFunction) {
    const host = req.hostname;
    const domain = this.config.get('APP_DOMAIN', 'cannasaas.com');
    const subdomain = host.replace(`.${domain}`, '');

    if (subdomain && subdomain !== host) {
      const dispensary = await this.tenants.resolveBySlug(subdomain);
      if (!dispensary) throw new NotFoundException(`Tenant not found: ${subdomain}`);
      req.tenantId = dispensary.company_id;
      req.dispensaryId = dispensary.entity_id;
    }

    next();
  }
}
