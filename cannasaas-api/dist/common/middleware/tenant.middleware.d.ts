import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
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
export declare class TenantMiddleware implements NestMiddleware {
    private tenantRepository;
    private tenantService;
    constructor(tenantRepository: Repository<Tenant>, tenantService: TenantService);
    use(req: Request, res: Response, next: NextFunction): any;
    private extractSubdomain;
}
