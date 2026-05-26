import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private queue: Queue;
  private redisConnection: Redis;

  onModuleInit() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);

    this.logger.log(`Connecting BullMQ to Redis at ${host}:${port}`);
    this.redisConnection = new Redis({
      host,
      port,
      maxRetriesPerRequest: null, // Required by BullMQ
    });

    this.queue = new Queue('feedback-queue', {
      connection: this.redisConnection,
    });
  }

  async addFeedbackJob(feedbackId: string, feedbackText: string, rating: number) {
    this.logger.log(`Queueing feedback analysis job for ID: ${feedbackId}`);
    await this.queue.add('analyze-feedback', {
      feedbackId,
      feedbackText,
      rating,
    });
  }

  async onModuleDestroy() {
    if (this.queue) {
      await this.queue.close();
    }
    if (this.redisConnection) {
      this.redisConnection.disconnect();
    }
  }
}
