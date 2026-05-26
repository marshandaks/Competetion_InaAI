import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma.service';
import { GeminiService } from './gemini/gemini.service';
import { QueueService } from './queue/queue.service';
import { CacheService } from './cache/cache.service';
import { FeedbackProcessor } from './queue/feedback.processor';
import { EventsGateway } from './websocket/events.gateway';
import { FeedbackController } from './feedback/feedback.controller';
import { FeedbackService } from './feedback/feedback.service';
import { AnalyticsController } from './analytics/analytics.controller';
import { AnalyticsService } from './analytics/analytics.service';

@Module({
  imports: [AuthModule],
  controllers: [FeedbackController, AnalyticsController],
  providers: [
    PrismaService,
    GeminiService,
    QueueService,
    CacheService,
    FeedbackProcessor,
    EventsGateway,
    FeedbackService,
    AnalyticsService,
  ],
})
export class AppModule {}
