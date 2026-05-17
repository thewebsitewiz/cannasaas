import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
  Optional,
} from '@nestjs/common';
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
    const errMsg =
      exception instanceof Error ? exception.message : String(exception);
    const errStack = exception instanceof Error ? exception.stack : undefined;

    if (contextType === 'graphql') {
      if (exception instanceof HttpException) {
        const response = exception.getResponse();
        const detail =
          typeof response === 'object' ? JSON.stringify(response) : response;
        const statusCode = exception.getStatus() as HttpStatus;
        this.logger.error(
          `[${errorId}] GraphQL ${String(statusCode)}: ${detail}`,
          errStack,
        );
        let code: string;
        switch (statusCode) {
          case HttpStatus.UNAUTHORIZED:
            code = 'UNAUTHENTICATED';
            break;
          case HttpStatus.NOT_FOUND:
            code = 'NOT_FOUND';
            break;
          case HttpStatus.CONFLICT:
            code = 'CONFLICT';
            break;
          case HttpStatus.TOO_MANY_REQUESTS:
            code = 'TOO_MANY_REQUESTS';
            break;
          default:
            code = 'BAD_REQUEST';
        }
        throw new GraphQLError(exception.message, {
          extensions: {
            code,
            status: statusCode,
            errorId,
            detail: isProd
              ? undefined
              : typeof response === 'object'
                ? response
                : undefined,
          },
        });
      }
      this.logger.error(`[${errorId}] Unhandled GraphQL: ${errMsg}`, errStack);
      if (exception instanceof Error) {
        void this.sentry?.captureException(exception, {
          errorId,
          context: 'graphql',
        });
      }
      throw new GraphQLError(isProd ? 'Internal server error' : errMsg, {
        extensions: { code: 'INTERNAL_SERVER_ERROR', errorId },
      });
    }

    // REST context — safely extract request context
    interface RestRequest {
      method?: string;
      url?: string;
      headers?: Record<string, string | string[] | undefined>;
    }
    interface RestResponse {
      status?: (code: number) => RestResponse;
      json?: (body: unknown) => RestResponse;
    }
    let req: RestRequest | undefined;
    let res: RestResponse | undefined;
    try {
      req = host.switchToHttp().getRequest<RestRequest>();
      res = host.switchToHttp().getResponse<RestResponse>();
    } catch {
      this.logger.error(`[${errorId}] Non-HTTP exception: ${errMsg}`, errStack);
      return;
    }

    if (!res || typeof res.status !== 'function') {
      this.logger.error(`[${errorId}] No response object: ${errMsg}`, errStack);
      return;
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const headerVal = req?.headers?.['x-request-id'];
    const headerRequestId = Array.isArray(headerVal) ? headerVal[0] : headerVal;
    const requestId = headerRequestId ?? errorId;

    this.logger.error(
      `[${requestId}] ${req?.method ?? '?'} ${req?.url ?? '?'} - Status: ${String(status)} - ${errMsg}`,
      errStack,
    );

    const clientMessage =
      exception instanceof HttpException
        ? errMsg
        : isProd
          ? 'Internal server error'
          : errMsg;

    const statusFn = res.status;
    const result = statusFn.call(res, status);
    if (result && typeof result.json === 'function') {
      result.json({
        statusCode: status,
        message: clientMessage,
        requestId,
      });
    }
  }
}
