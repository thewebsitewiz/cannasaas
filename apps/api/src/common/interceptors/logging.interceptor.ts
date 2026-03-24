import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject, Logger, Optional } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';
import { MetricsService } from '../services/metrics.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  constructor(
    @Optional() @Inject(MetricsService) private readonly metrics?: MetricsService,
  ) {}

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
        const status = String(req.res?.statusCode ?? 200);
        this.logger.log(`${method} ${url} ${ms}ms [${requestId}]`);

        // Track request count and duration for Prometheus
        this.metrics?.increment('http_requests_total', { method, status });
        this.metrics?.observe('http_request_duration_ms', ms, { method });
      }),
    );
  }
}
