// cannasaas-api/src/common/interceptors/metrics.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext,
  CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private metrics: MetricsService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const request = ctx.switchToHttp().getRequest();
    const route = request.route?.path || request.url;
    const method = request.method;
    const end = this.metrics.httpDuration.startTimer({ method, route });

    return next.handle().pipe(tap({
      next: () => {
        const status = ctx.switchToHttp().getResponse().statusCode;
        end({ status_code: String(status) });
        this.metrics.httpTotal.inc({ method, route, status_code: String(status) });
      },
      error: () => {
        end({ status_code: '500' });
        this.metrics.httpTotal.inc({ method, route, status_code: '500' });
      },
    }));
  }
}
