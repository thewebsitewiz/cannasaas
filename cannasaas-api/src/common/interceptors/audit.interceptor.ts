// cannasaas-api/src/common/interceptors/audit.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService, AuditAction, AuditSeverity } from
  '../../modules/compliance/audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private audit: AuditService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const request = ctx.switchToHttp().getRequest();
    const method = request.method;

    let action = AuditAction.ACCESS;
    if (method === 'POST') action = AuditAction.CREATE;
    if (method === 'PUT' || method === 'PATCH') action = AuditAction.UPDATE;
    if (method === 'DELETE') action = AuditAction.DELETE;

    return next.handle().pipe(tap(() => {
      this.audit.log({
        organizationId: request['organizationId'],
        userId: request.user?.id || 'anonymous',
        action,
        resource: ctx.getClass().name.replace('Controller', '').toLowerCase(),
        resourceId: request.params.id,
        severity: method === 'DELETE' ? AuditSeverity.HIGH : AuditSeverity.LOW,
        details: { method, url: request.originalUrl,
          body: method !== 'GET' ? request.body : undefined },
        ipAddress: request.ip,
      });
    }));
  }
}
