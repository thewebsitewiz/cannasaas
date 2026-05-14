import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Logger,
  Optional,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';
import { MetricsService } from '../services/metrics.service';

interface IncomingRes {
  setHeader?(name: string, value: string): void;
  statusCode?: number;
}

interface IncomingRequest {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  res?: IncomingRes;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  constructor(
    @Optional()
    @Inject(MetricsService)
    private readonly metrics?: MetricsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const contextType = context.getType<string>();
    let req: IncomingRequest | null = null;
    try {
      req = context.switchToHttp().getRequest<IncomingRequest>();
    } catch {
      /* GraphQL/WS context */
    }

    const headerVal = req?.headers?.['x-request-id'];
    const headerRequestId = Array.isArray(headerVal) ? headerVal[0] : headerVal;
    const requestId = headerRequestId ?? randomUUID();
    const method =
      req?.method ?? (contextType === 'graphql' ? 'GQL' : contextType);
    const url = req?.url ?? '';
    const now = Date.now();

    if (req?.res?.setHeader) req.res.setHeader('x-request-id', requestId);

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - now;
        const status = String(req?.res?.statusCode ?? 200);
        if (contextType !== 'graphql')
          this.logger.log(`${method} ${url} ${String(ms)}ms [${requestId}]`);

        this.metrics?.increment('http_requests_total', { method, status });
        this.metrics?.observe('http_request_duration_ms', ms, { method });
      }),
    );
  }
}
