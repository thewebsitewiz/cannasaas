import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { GraphQLError } from 'graphql';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  catch(exception: unknown, host: ArgumentsHost): void {
    const contextType = host.getType<string>();
    if (contextType === 'graphql') {
      if (exception instanceof HttpException) {
        const response = exception.getResponse();
        const detail = typeof response === 'object' ? JSON.stringify(response) : response;
        this.logger.error(`GraphQL HttpException: ${detail}`);
        throw new GraphQLError(exception.message, {
          extensions: {
            code: exception.getStatus() === HttpStatus.UNAUTHORIZED ? 'UNAUTHENTICATED' : 'BAD_REQUEST',
            status: exception.getStatus(),
            detail: typeof response === 'object' ? response : undefined,
          },
        });
      }
      const errMsg = exception instanceof Error ? exception.message : String(exception);
      const errStack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(`Unhandled GraphQL exception: ${errMsg}`, errStack);
      throw new GraphQLError(errMsg, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
    const res = host.switchToHttp().getResponse<{ status: (n: number) => { json: (o: unknown) => void } }>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    this.logger.error('Unhandled exception', exception);
    res.status(status).json({ statusCode: status, message: 'Internal server error' });
  }
}
