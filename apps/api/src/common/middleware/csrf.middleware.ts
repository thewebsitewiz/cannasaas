import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    // Only check state-changing methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

    // Skip for API keys and Bearer token auth (not cookie-based)
    if (req.headers.authorization?.startsWith('Bearer ')) return next();

    // For cookie-based requests, verify origin
    const origin = req.headers.origin || req.headers.referer;
    if (!origin) return next(); // Non-browser clients

    const allowedOrigins = (
      process.env['CORS_ORIGINS'] ||
      'http://localhost:5173,http://localhost:5174,http://localhost:5175'
    ).split(',');
    const requestOrigin = new URL(origin).origin;

    if (!allowedOrigins.includes(requestOrigin)) {
      throw new ForbiddenException('Invalid origin');
    }
    next();
  }
}
