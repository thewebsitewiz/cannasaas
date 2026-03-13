import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';
export const RateLimit = (maxRequests: number, windowSeconds: number) =>
  SetMetadata(RATE_LIMIT_KEY, { maxRequests, windowSeconds });

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();

  constructor(private reflector: Reflector) {
    setInterval(() => { const n = Date.now(); for (const [k, b] of this.buckets.entries()) { if (b.resetAt < n) this.buckets.delete(k); } }, 300000);
  }

  canActivate(context: ExecutionContext): boolean {
    const limit = this.reflector.get<{ maxRequests: number; windowSeconds: number } | undefined>(RATE_LIMIT_KEY, context.getHandler());
    if (!limit) return true;
    let ip = '0.0.0.0';
    try { const req = context.switchToHttp().getRequest(); ip = req?.ip || '0.0.0.0'; } catch {}
    const key = ip + ':' + context.getHandler().name;
    const now = Date.now();
    let bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt < now) { bucket = { count: 0, resetAt: now + limit.windowSeconds * 1000 }; this.buckets.set(key, bucket); }
    bucket.count++;
    if (bucket.count > limit.maxRequests) {
      this.logger.warn('Rate limit exceeded: ' + key);
      throw new HttpException({ message: 'Too many requests', statusCode: 429 }, HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }
}
