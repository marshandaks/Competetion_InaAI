import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Analytics')
@UseGuards(JwtAuthGuard)
@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get core aggregate analytics metrics for the dashboard' })
  @ApiResponse({ status: 200, description: 'Analytics aggregates successfully computed/retrieved.' })
  async getOverview() {
    return this.analyticsService.getOverviewAnalytics();
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get dynamic AI-generated business insights based on customer reviews' })
  @ApiResponse({ status: 200, description: 'AI actionable insights successfully computed/retrieved.' })
  async getInsights() {
    return this.analyticsService.getAiInsights();
  }
}
