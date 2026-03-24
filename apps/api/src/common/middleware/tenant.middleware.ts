import { Injectable, type NestMiddleware, UnauthorizedException } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

export interface TenantContext { organizationId: string; dispensaryId: string; }
type RequestWithTenant = Request & { tenantContext?: TenantContext };

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: RequestWithTenant, _res: Response, next: NextFunction): void {
    const organizationId = req.headers['x-organization-id'] as string | undefined;
    const dispensaryId   = req.headers['x-dispensary-id']   as string | undefined;
    const publicPaths = ['/v1/auth', '/health', '/metrics', '/docs', '/graphql'];
    const isPublic = publicPaths.some((p) => req.path.startsWith(p) || req.originalUrl.startsWith(p));
    if (!isPublic && (!organizationId || !dispensaryId)) {
      throw new UnauthorizedException('Missing tenant context headers');
    }
    if (organizationId && dispensaryId) req.tenantContext = { organizationId, dispensaryId };
    next();
  }
}
