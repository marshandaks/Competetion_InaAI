'use client';

import React from 'react';
import { AnalyticsData } from '@/lib/api';

interface Props {
  data: AnalyticsData['topTopics'];
}

export default function TopicCloud({ data }: Props) {
  const items = (data || []).slice(0, 8);
  const max = items[0]?.count || 1;

  return (
    <div className="chart-card">
      <p className="chart-title">Top Topics</p>
      {items.length === 0 ? (
        <p style={{ fontSize: 13, color: '#9CA3AF' }}>No topics yet</p>
      ) : (
        <div>
          {items.map((t) => (
            <div className="topic-row" key={t.topic}>
              <span className="topic-label">{t.topic}</span>
              <div className="topic-bar-wrap">
                <div
                  className="topic-bar-fill"
                  style={{ width: `${Math.round((t.count / max) * 100)}%` }}
                />
              </div>
              <span className="topic-count">{t.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
