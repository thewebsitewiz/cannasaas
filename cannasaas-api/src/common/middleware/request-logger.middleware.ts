// cannasaas-api/src/common/middleware/request-logger.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = nanoid(12);
    const start = Date.now();
    req['requestId'] = requestId;
    res.setHeader('X-Request-ID', requestId);

    res.on('finish', () => {
      this.logger.log({
        requestId, method: req.method, url: req.originalUrl,
        statusCode: res.statusCode, duration: `${Date.now() - start}ms`,
        orgId: req['organizationId'], userId: req['user']?.id,
        ip: req.ip, userAgent: req.get('user-agent'),
      });
    });
    next();
  }
}
