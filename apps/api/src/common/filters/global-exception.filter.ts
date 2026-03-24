import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { randomUUID } from 'crypto';

const isProd = process.env['NODE_ENV'] === 'production';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

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
      throw new GraphQLError(isProd ? 'Internal server error' : errMsg, {
        extensions: { code: 'INTERNAL_SERVER_ERROR', errorId },
      });
    }

    // REST context — extract full request context for logging
    const req = host.switchToHttp().getRequest<any>();
    const res = host.switchToHttp().getResponse<{ status: (n: number) => { json: (o: unknown) => void } }>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const requestId = req?.headers?.['x-request-id'] || errorId;
    const userId = req?.user?.sub ?? req?.user?.id ?? 'anonymous';

    // Log every exception with full context (URL, method, user ID, stack trace)
    this.logger.error(
      `[${requestId}] ${req?.method} ${req?.url} - User: ${userId} - Status: ${status} - ${errMsg}`,
      errStack,
    );

    // In production, mask internal error details but log them server-side
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
