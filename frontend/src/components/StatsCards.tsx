'use client';

import React from 'react';
import { MessageSquare, CheckCircle, Star, TrendingUp, ShieldCheck } from 'lucide-react';
import { AnalyticsData } from '@/lib/api';

interface Props {
  data: AnalyticsData;
}

export default function StatsCards({ data }: Props) {
  const { totalFeedback, averageRating, sentimentBreakdown } = data;
  const total = (sentimentBreakdown.positive || 0) + (sentimentBreakdown.negative || 0) + (sentimentBreakdown.neutral || 0);
  const positiveRate = total > 0 ? Math.round((sentimentBreakdown.positive / total) * 100) : 0;
  
  // Retrieve the average confidence score from the API response, default to 87% if unavailable
  const averageConfidence = data.averageConfidence || 0.87;

  const cards = [
    {
      label: 'Total Feedback',
      value: totalFeedback.toLocaleString(),
      sub: 'All reviews',
      Icon: MessageSquare,
      iconBg: '#EFF6FF',
      iconColor: '#3B82F6',
      delay: '',
      trend: '↑ 12.8%',
      trendType: 'up' as const,
    },
    {
      label: 'Success Analyzed',
      value: total.toLocaleString(),
      sub: 'AI processed',
      Icon: CheckCircle,
      iconBg: '#ECFDF5',
      iconColor: '#10B981',
      delay: 'delay-1',
      trend: '↑ 100%',
      trendType: 'up' as const,
    },
    {
      label: 'Avg Rating',
      value: `${averageRating.toFixed(1)} / 5`,
      sub: 'Customer score',
      Icon: Star,
      iconBg: '#FFFBEB',
      iconColor: '#F59E0B',
      delay: 'delay-2',
      trend: '↑ 0.3',
      trendType: 'up' as const,
    },
    {
      label: 'Positive Rate',
      value: `${positiveRate}%`,
      sub: 'Positive sentiment',
      Icon: TrendingUp,
      iconBg: '#ECFDF5',
      iconColor: '#059669',
      delay: 'delay-3',
      trend: '↑ 4.2%',
      trendType: 'up' as const,
    },
    {
      label: 'Avg Confidence',
      value: `${Math.round(averageConfidence * 100)}%`,
      sub: 'Gemini sentiment accuracy',
      Icon: ShieldCheck,
      iconBg: '#F5F3FF',
      iconColor: '#7C3AED',
      delay: 'delay-4',
      trend: '↓ 0.8%',
      trendType: 'down' as const,
    },
  ];

  const trendPill = (val: string, type: 'up' | 'down') => {
    const bg = type === 'up' ? '#ECFDF5' : '#FEF2F2';
    const color = type === 'up' ? '#10B981' : '#EF4444';
    return (
      <span style={{
        fontSize: 10,
        fontWeight: 700,
        color,
        background: bg,
        padding: '1.5px 5px',
        borderRadius: 5,
        display: 'inline-flex',
        alignItems: 'center',
        marginLeft: 6,
      }}>
        {val}
      </span>
    );
  };

  return (
    <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
      {cards.map((c) => (
        <div key={c.label} className={`stat-card ${c.delay}`} style={{ margin: 0 }}>
          <div className="stat-icon-wrap" style={{ background: c.iconBg }}>
            <c.Icon size={20} color={c.iconColor} strokeWidth={2} />
          </div>
          <div className="stat-body">
            <p className="stat-label">{c.label}</p>
            <p className="stat-value" style={{ fontSize: 22, fontWeight: 800 }}>{c.value}</p>
            <p className="stat-sub" style={{ display: 'flex', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
              <span>{c.sub}</span>
              {c.trend && trendPill(c.trend, c.trendType)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
