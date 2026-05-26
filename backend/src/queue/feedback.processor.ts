import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { GeminiService } from '../gemini/gemini.service';
import { EventsGateway } from '../websocket/events.gateway';
import { CacheService } from '../cache/cache.service';
import Redis from 'ioredis';

@Injectable()
export class FeedbackProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FeedbackProcessor.name);
  private worker: Worker;
  private redisConnection: Redis;

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly eventsGateway: EventsGateway,
    private readonly cacheService: CacheService,
  ) {}

  onModuleInit() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);

    this.redisConnection = new Redis({
      host,
      port,
      maxRetriesPerRequest: null,
    });

    this.worker = new Worker(
      'feedback-queue',
      async (job: Job) => {
        const { feedbackId, feedbackText, rating } = job.data;
        this.logger.log(`Processing job ${job.id} for Feedback ID: ${feedbackId}`);

        try {
          // 1. Call Gemini to perform AI analysis
          const result = await this.gemini.analyzeFeedback(feedbackText, rating);
          this.logger.log(`Gemini analysis result: ${JSON.stringify(result)}`);

          // 2. Save analysis into database and increment version (standard optimistic lock)
          const updatedFeedback = await this.prisma.feedback.update({
            where: { id: feedbackId },
            data: {
              sentiment: result.sentiment,
              confidenceScore: result.confidenceScore,
              topics: result.topics,
              summary: result.summary,
              version: { increment: 1 },
            },
          });

          this.logger.log(`Feedback database updated successfully for ID: ${feedbackId}`);

          // 3. Invalidate Redis Caches
          await this.cacheService.clearAnalyticsCache();

          // 4. Emit real-time Socket.IO event to push feedback analysis updates to frontend
          this.eventsGateway.broadcast('feedback:analyzed', {
            feedback: updatedFeedback,
            message: `Feedback dari ${updatedFeedback.customerName} selesai dianalisis oleh Gemini AI!`,
          });
        } catch (e) {
          this.logger.error(`Error processing job ${job.id} for Feedback ID: ${feedbackId}`, e.stack);
          throw e;
        }
      },
      {
        connection: this.redisConnection,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} completed successfully!`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed with error: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
    if (this.redisConnection) {
      this.redisConnection.disconnect();
    }
  }
}
