import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

interface TenantRequest extends Request {
  tenantId?: string;
  dispensaryId?: string;
}

export const CurrentTenant = createParamDecorator(
  (
    _: unknown,
    ctx: ExecutionContext,
  ): { tenantId?: string; dispensaryId?: string } => {
    const req = ctx.switchToHttp().getRequest<TenantRequest>();
    return { tenantId: req.tenantId, dispensaryId: req.dispensaryId };
  },
);
