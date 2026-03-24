import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus, Inject, Logger, Optional } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { randomUUID } from 'crypto';
import { SentryService } from '../services/sentry.service';

const isProd = process.env['NODE_ENV'] === 'production';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(
    @Optional() @Inject(SentryService) private readonly sentry?: SentryService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const contextType = host.getType<string>();
    const errorId = randomUUID().slice(0, 8);
    const errMsg = exception instanceof Error ? exception.message : String(exception);
    const errStack = exception instanceof Error ? exception.stack : undefined;

    if (contextType === 'graphql') {
      if (exception instanceof HttpException) {
        const response = exception.getResponse();
        const detail = typeof response === 'object' ? JSON.stringify(response) : response;
        this.logger.error(`[${errorId}] GraphQL ${exception.getStatus()}: ${detail}`, errStack);
        throw new GraphQLError(exception.message, {
          extensions: {
            code: exception.getStatus() === HttpStatus.UNAUTHORIZED ? 'UNAUTHENTICATED'
              : exception.getStatus() === HttpStatus.NOT_FOUND ? 'NOT_FOUND'
              : exception.getStatus() === HttpStatus.CONFLICT ? 'CONFLICT'
              : exception.getStatus() === HttpStatus.TOO_MANY_REQUESTS ? 'TOO_MANY_REQUESTS'
              : 'BAD_REQUEST',
            status: exception.getStatus(),
            errorId,
            detail: isProd ? undefined : (typeof response === 'object' ? response : undefined),
          },
        });
      }
      this.logger.error(`[${errorId}] Unhandled GraphQL: ${errMsg}`, errStack);
      if (exception instanceof Error) {
        this.sentry?.captureException(exception, { errorId, context: 'graphql' });
      }
      throw new GraphQLError(isProd ? 'Internal server error' : errMsg, {
        extensions: { code: 'INTERNAL_SERVER_ERROR', errorId },
      });
    }

    // REST context — safely extract request context
    let req: any, res: any;
    try {
      req = host.switchToHttp().getRequest();
      res = host.switchToHttp().getResponse();
    } catch {
      // Not an HTTP context (e.g. WebSocket) — log and return
      this.logger.error(`[${errorId}] Non-HTTP exception: ${errMsg}`, errStack);
      return;
    }

    if (!res?.status) {
      this.logger.error(`[${errorId}] No response object: ${errMsg}`, errStack);
      return;
    }

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const requestId = req?.headers?.['x-request-id'] || errorId;

    this.logger.error(
      `[${requestId}] ${req?.method || '?'} ${req?.url || '?'} - Status: ${status} - ${errMsg}`,
      errStack,
    );

    const clientMessage = exception instanceof HttpException
      ? errMsg
      : (isProd ? 'Internal server error' : errMsg);

    res.status(status).json({
      statusCode: status,
      message: clientMessage,
      requestId,
    });
  }
}
