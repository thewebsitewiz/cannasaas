import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CacheService } from '../services/cache.service';

export const RATE_LIMIT_KEY = 'rateLimit';
export const RateLimit = (maxRequests: number, windowSeconds: number) =>
  SetMetadata(RATE_LIMIT_KEY, { maxRequests, windowSeconds });

/**
 * Per-handler rate limit. Backed by Redis (via `CacheService.checkRateLimit`)
 * so buckets are shared across API replicas and survive process restarts —
 * a fix for the original in-memory `Map` implementation that effectively
 * multiplied the limit by replica count and reset on every deploy.
 *
 * Key shape: `<ip>:<handler>`. IP comes from `req.ip` (Express, so it
 * already respects `trust proxy`).
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly cache: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const limit = this.reflector.get<
      { maxRequests: number; windowSeconds: number } | undefined
    >(RATE_LIMIT_KEY, context.getHandler());
    if (!limit) return true;

    let ip = '0.0.0.0';
    try {
      const req = context.switchToHttp().getRequest<{ ip?: string }>();
      ip = req.ip ?? '0.0.0.0';
    } catch {
      // Non-HTTP context (GraphQL subscription, WS) — degrade to a shared
      // bucket rather than failing closed.
    }
    const key = `${ip}:${context.getHandler().name}`;

    const allowed = await this.cache.checkRateLimit(
      key,
      limit.maxRequests,
      limit.windowSeconds,
    );
    if (!allowed) {
      this.logger.warn(`Rate limit exceeded: ${key}`);
      throw new HttpException(
        { message: 'Too many requests', statusCode: 429 },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
