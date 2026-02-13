// cannasaas-api/src/modules/health/redis.health.ts
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult,
  HealthCheckError } from '@nestjs/terminus';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) { super(); }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.cache.set('health_check', 'ok', 10);
      const val = await this.cache.get('health_check');
      if (val === 'ok') return this.getStatus(key, true);
      throw new Error('Redis read/write mismatch');
    } catch (e) {
      throw new HealthCheckError('Redis failed',
        this.getStatus(key, false, { message: e.message }));
    }
  }
}
