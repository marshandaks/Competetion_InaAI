import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CacheService } from '../cache/cache.service';
import { GeminiService } from '../gemini/gemini.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly gemini: GeminiService,
  ) {}

  async getOverviewAnalytics(): Promise<any> {
    const cachedData = await this.cache.get('analytics:overview');
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    this.logger.log('Cache miss. Generating new dashboard analytics...');

    // 1. Core aggregations from Postgres
    const [totalFeedbacks, avgRatingGroup, sentiments, feedbacks] = await Promise.all([
      this.prisma.feedback.count(),
      this.prisma.feedback.aggregate({ _avg: { rating: true } }),
      this.prisma.feedback.groupBy({
        by: ['sentiment'],
        _count: { sentiment: true },
      }),
      this.prisma.feedback.findMany({
        select: { rating: true, sentiment: true, topics: true, createdAt: true, confidenceScore: true },
      }),
    ]);

    const averageRating = avgRatingGroup._avg.rating ? parseFloat(avgRatingGroup._avg.rating.toFixed(2)) : 0;

    // 2. Sentiment percentages
    let positive = 0;
    let neutral = 0;
    let negative = 0;

    for (const group of sentiments) {
      const count = group._count.sentiment;
      if (group.sentiment === 'positive') positive = count;
      if (group.sentiment === 'neutral') neutral = count;
      if (group.sentiment === 'negative') negative = count;
    }

    const positivePercent = totalFeedbacks > 0 ? parseFloat(((positive / totalFeedbacks) * 100).toFixed(1)) : 0;
    const neutralPercent = totalFeedbacks > 0 ? parseFloat(((neutral / totalFeedbacks) * 100).toFixed(1)) : 0;
    const negativePercent = totalFeedbacks > 0 ? parseFloat(((negative / totalFeedbacks) * 100).toFixed(1)) : 0;

    // 3. Issue topics count
    const topicCounts: Record<string, number> = {};
    feedbacks.forEach((f) => {
      if (f.topics) {
        f.topics.forEach((topic) => {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });
      }
    });

    let topIssue = 'None';
    let maxCount = 0;
    const topicList = Object.entries(topicCounts).map(([name, value]) => {
      if (value > maxCount && name !== 'other') {
        maxCount = value;
        topIssue = name;
      }
      return { name, value };
    });

    // 4. Trend over time (grouped by day of creation)
    const trends: Record<string, { positive: number; neutral: number; negative: number; count: number }> = {};
    
    feedbacks.forEach((f) => {
      const dateStr = f.createdAt.toISOString().split('T')[0];
      if (!trends[dateStr]) {
        trends[dateStr] = { positive: 0, neutral: 0, negative: 0, count: 0 };
      }
      trends[dateStr].count++;
      if (f.sentiment === 'positive') trends[dateStr].positive++;
      if (f.sentiment === 'neutral') trends[dateStr].neutral++;
      if (f.sentiment === 'negative') trends[dateStr].negative++;
    });

    const trendList = Object.entries(trends)
      .map(([date, data]) => ({
        date,
        count: data.count,
        positive: data.positive,
        neutral: data.neutral,
        negative: data.negative,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7); // Get latest 7 days

    // 5. Rating distribution (calculated in-memory to save database queries)
    const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalConfidence = 0;
    let confidenceCount = 0;

    feedbacks.forEach((f) => {
      if (f.rating >= 1 && f.rating <= 5) {
        ratingCounts[f.rating]++;
      }
      if (typeof f.confidenceScore === 'number') {
        totalConfidence += f.confidenceScore;
        confidenceCount++;
      }
    });

    const ratingDistribution = [1, 2, 3, 4, 5].map((star) => ({
      rating: star,
      count: ratingCounts[star],
    }));

    // Average sentiment confidence score from Gemini
    const averageConfidence = confidenceCount > 0 ? parseFloat((totalConfidence / confidenceCount).toFixed(2)) : 0.85;

    const payload = {
      totalFeedback: totalFeedbacks,
      averageRating,
      averageConfidence,
      topIssue: topIssue.toUpperCase(),
      sentimentDistribution: {
        positive,
        neutral,
        negative,
        positivePercent,
        neutralPercent,
        negativePercent,
      },
      topicBreakdown: topicList,
      trendChart: trendList,
      ratingDistribution,
    };

    // Cache the aggregates for 1 hour
    await this.cache.set('analytics:overview', JSON.stringify(payload), 3600);

    return payload;
  }

  async getAiInsights(): Promise<any> {
    const cachedData = await this.cache.get('analytics:insights');
    if (cachedData) {
      try {
        return JSON.parse(cachedData);
      } catch {
        // Cache corrupted, regenerate
      }
    }

    this.logger.log('Cache miss. Invoking Gemini API to generate insights...');

    // Fetch feedbacks
    const feedbacks = await this.prisma.feedback.findMany({
      select: { rating: true, feedback: true },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    let insights: any[];
    if (feedbacks.length === 0) {
      // Return static/db insights if no data is uploaded yet
      const dbInsights = await this.prisma.aiInsight.findMany({
        orderBy: { createdAt: 'desc' },
      });
      insights = dbInsights.map((i) => ({
        type: i.type,
        title: i.title,
        summary: i.content,
        rootCauses: [],
        businessImpact: [],
        recommendations: [],
        severity: 'Medium',
        confidenceScore: 0.75,
        relatedTopics: [],
        trend: 'Stable',
      }));
    } else {
      // Call Gemini API for structured insights
      insights = await this.gemini.generateBusinessInsights(feedbacks);
    }

    // Cache the insights list for 30 minutes
    await this.cache.set('analytics:insights', JSON.stringify(insights), 1800);

    return insights;
  }

}
