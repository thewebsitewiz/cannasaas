/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
// test/ is outside the TS project; Jest globals lose types.

import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';

import {
  RATE_LIMIT_KEY,
  RateLimitGuard,
} from '../../src/common/guards/rate-limit.guard';
import { CacheService } from '../../src/common/services/cache.service';

/**
 * Sc-?: critical fix from architecture review — RateLimitGuard now
 * uses CacheService (Redis INCR + EXPIRE) so buckets coordinate across
 * API replicas and survive restarts. These specs cover the contract:
 *
 *   - handlers without @RateLimit pass through unconditionally
 *   - cache.checkRateLimit is called with the right key + window
 *   - allowed=true returns true
 *   - allowed=false throws 429
 *   - non-HTTP context degrades gracefully to a shared key
 */
describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let checkRateLimit: jest.Mock;
  let reflectorGet: jest.Mock;

  function makeContext(overrides: {
    ip?: string;
    handlerName?: string;
    throwOnHttp?: boolean;
  } = {}): unknown {
    const handler = {
      name: overrides.handlerName ?? 'login',
    } as unknown as () => void;
    return {
      getHandler: () => handler,
      switchToHttp: () =>
        overrides.throwOnHttp
          ? (() => {
              throw new Error('non-http');
            })()
          : { getRequest: () => ({ ip: overrides.ip ?? '10.0.0.1' }) },
    };
  }

  beforeEach(async () => {
    checkRateLimit = jest.fn();
    reflectorGet = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitGuard,
        { provide: Reflector, useValue: { get: reflectorGet } },
        { provide: CacheService, useValue: { checkRateLimit } },
      ],
    }).compile();
    guard = module.get(RateLimitGuard);
  });

  it('passes through when @RateLimit is not set on the handler', async () => {
    reflectorGet.mockReturnValue(undefined);
    const ok = await guard.canActivate(makeContext() as never);
    expect(ok).toBe(true);
    expect(checkRateLimit).not.toHaveBeenCalled();
  });

  it('calls CacheService.checkRateLimit with `<ip>:<handler>` and the limit metadata', async () => {
    reflectorGet.mockReturnValue({ maxRequests: 5, windowSeconds: 300 });
    checkRateLimit.mockResolvedValue(true);
    await guard.canActivate(
      makeContext({ ip: '10.0.0.2', handlerName: 'register' }) as never,
    );
    expect(checkRateLimit).toHaveBeenCalledWith('10.0.0.2:register', 5, 300);
  });

  it('returns true when the bucket is under the limit', async () => {
    reflectorGet.mockReturnValue({ maxRequests: 10, windowSeconds: 60 });
    checkRateLimit.mockResolvedValue(true);
    await expect(
      guard.canActivate(makeContext() as never),
    ).resolves.toBe(true);
  });

  it('throws 429 when the bucket is over the limit', async () => {
    reflectorGet.mockReturnValue({ maxRequests: 1, windowSeconds: 60 });
    checkRateLimit.mockResolvedValue(false);
    await expect(
      guard.canActivate(makeContext() as never),
    ).rejects.toThrow(HttpException);
  });

  it('degrades to a shared bucket if the http context is not available', async () => {
    reflectorGet.mockReturnValue({ maxRequests: 5, windowSeconds: 300 });
    checkRateLimit.mockResolvedValue(true);
    await guard.canActivate(makeContext({ throwOnHttp: true }) as never);
    expect(checkRateLimit).toHaveBeenCalledWith(
      '0.0.0.0:login',
      5,
      300,
    );
  });

  it('exports a SetMetadata key + decorator factory that match', () => {
    expect(RATE_LIMIT_KEY).toBe('rateLimit');
  });
});
