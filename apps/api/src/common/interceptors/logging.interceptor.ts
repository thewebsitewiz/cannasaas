import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const requestId = req.headers['x-request-id'] || randomUUID();
    const method = req.method;
    const url = req.url;
    const now = Date.now();

    // Attach request ID for tracing
    if (req.res) req.res.setHeader('x-request-id', requestId);

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - now;
        this.logger.log(`${method} ${url} ${ms}ms [${requestId}]`);
      }),
    );
  }
}
