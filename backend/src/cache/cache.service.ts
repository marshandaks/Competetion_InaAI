import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: Redis;

  onModuleInit() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);

    this.logger.log(`Connecting Cache Service to Redis at ${host}:${port}`);
    this.client = new Redis({ host, port });
  }

  async get(key: string): Promise<string | null> {
    try {
      const data = await this.client.get(key);
      if (data) {
        this.logger.log(`Cache hit for key: "${key}"`);
      }
      return data;
    } catch (e) {
      this.logger.error(`Error reading cache key: ${key}`, e.message);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds = 3600): Promise<void> {
    try {
      this.logger.log(`Caching key: "${key}" with TTL: ${ttlSeconds}s`);
      await this.client.setex(key, ttlSeconds, value);
    } catch (e) {
      this.logger.error(`Error writing cache key: ${key}`, e.message);
    }
  }

  async del(key: string): Promise<void> {
    try {
      this.logger.log(`Invalidating cache key: "${key}"`);
      await this.client.del(key);
    } catch (e) {
      this.logger.error(`Error invalidating cache key: ${key}`, e.message);
    }
  }

  async clearAnalyticsCache(): Promise<void> {
    this.logger.log('Clearing all dashboard analytics and insights caches');
    await this.del('analytics:overview');
    await this.del('analytics:insights');
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }
}
