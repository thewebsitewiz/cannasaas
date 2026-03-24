import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis!: Redis;

  async onModuleInit() {
    this.redis = new Redis({
      host: process.env['REDIS_HOST'] || 'localhost',
      port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
      keyPrefix: 'cs:cache:',
    });
    this.logger.log('Cache service connected');
  }

  async onModuleDestroy() {
    await this.redis?.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    const val = await this.redis.get(key);
    return val ? JSON.parse(val) : null;
  }

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(`cs:cache:${pattern}`);
    if (keys.length) await this.redis.del(...keys);
  }

  /** Rate limiting using Redis (replaces in-memory Map) */
  async checkRateLimit(key: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
    const current = await this.redis.incr(`rl:${key}`);
    if (current === 1) await this.redis.expire(`rl:${key}`, windowSeconds);
    return current <= maxRequests;
  }

  /** Pub/sub for WebSocket scaling */
  async publish(channel: string, message: unknown): Promise<void> {
    await this.redis.publish(channel, JSON.stringify(message));
  }

  /** Session storage */
  async setSession(sessionId: string, data: unknown, ttlSeconds = 86400): Promise<void> {
    await this.redis.set(`session:${sessionId}`, JSON.stringify(data), 'EX', ttlSeconds);
  }

  async getSession<T>(sessionId: string): Promise<T | null> {
    const val = await this.redis.get(`session:${sessionId}`);
    return val ? JSON.parse(val) : null;
  }

  /** Real-time inventory counts */
  async getRealtimeStock(variantId: string): Promise<number | null> {
    const val = await this.redis.get(`stock:${variantId}`);
    return val ? parseInt(val, 10) : null;
  }

  async setRealtimeStock(variantId: string, quantity: number): Promise<void> {
    await this.redis.set(`stock:${variantId}`, String(quantity), 'EX', 300);
  }

  async decrStock(variantId: string, amount = 1): Promise<number> {
    return this.redis.decrby(`stock:${variantId}`, amount);
  }
}
