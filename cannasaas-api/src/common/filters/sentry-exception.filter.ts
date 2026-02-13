// cannasaas-api/src/common/filters/sentry-exception.filter.ts
import { Catch, ArgumentsHost, HttpException,
  HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const status = exception instanceof HttpException
      ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500) {
      Sentry.withScope(scope => {
        scope.setTag('organizationId', request['organizationId']);
        scope.setTag('requestId', request['requestId']);
        scope.setUser({ id: request['user']?.id, email: request['user']?.email });
        scope.setExtra('url', request.originalUrl);
        scope.setExtra('method', request.method);
        scope.setExtra('body', request.body);
        Sentry.captureException(exception);
      });
    }
    super.catch(exception, host);
  }
}
