import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ALLOWED_ORIGINS } from '../cors-origins';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    // Only check state-changing methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

    // Skip for API keys and Bearer token auth (not cookie-based)
    if (req.headers.authorization?.startsWith('Bearer ')) return next();

    // For cookie-based requests, verify origin
    const origin = req.headers.origin || req.headers.referer;
    if (!origin) return next(); // Non-browser clients

    const requestOrigin = new URL(origin).origin;
    if (!ALLOWED_ORIGINS.includes(requestOrigin)) {
      throw new ForbiddenException('Invalid origin');
    }
    next();
  }
}
