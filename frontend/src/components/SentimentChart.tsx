'use client';

import React from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts';
import { AnalyticsData } from '@/lib/api';

interface Props {
  data: AnalyticsData['sentimentBreakdown'];
}

const COLORS = ['#10B981', '#9CA3AF', '#EF4444'];
const LABELS = ['Positive', 'Neutral', 'Negative'];

export default function SentimentChart({ data }: Props) {
  const chartData = [
    { name: 'Positive', value: data.positive },
    { name: 'Neutral',  value: data.neutral  },
    { name: 'Negative', value: data.negative },
  ];
  const total = data.positive + data.neutral + data.negative;

  return (
    <div className="chart-card">
      <p className="chart-title">Sentiment Distribution</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val, name) => {
                  const n = Number(val) || 0;
                  return [`${n} (${total ? Math.round(n / total * 100) : 0}%)`, String(name)];
                }}
                contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>{total}</span>
            <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>TOTAL</span>
          </div>
        </div>

        <div className="donut-legend" style={{ flex: 1 }}>
          {chartData.map((item, i) => (
            <div className="legend-item" key={item.name}>
              <span className="legend-dot" style={{ background: COLORS[i] }} />
              <span className="legend-label">{LABELS[i]}</span>
              <span className="legend-sub">
                {item.value} · {total ? Math.round(item.value / total * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
