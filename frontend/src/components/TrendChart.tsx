'use client';

import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { AnalyticsData } from '@/lib/api';

interface Props {
  data: AnalyticsData['recentTrend'];
}

const fmt = (d: string) => {
  try {
    return new Date(d).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
  } catch {
    return d;
  }
};

export default function TrendChart({ data }: Props) {
  const chartData = (data || []).map((d) => ({
    ...d,
    date: fmt(d.date),
  }));

  return (
    <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
      <p className="chart-title">Sentiment Trend</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#F3F4F6" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'Plus Jakarta Sans' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'Plus Jakarta Sans' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 10, fontFamily: 'Plus Jakarta Sans' }}
          />
          <Line
            type="monotone"
            dataKey="positive"
            name="Positive"
            stroke="#10B981"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#10B981', strokeWidth: 1 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="neutral"
            name="Neutral"
            stroke="#9CA3AF"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#9CA3AF', strokeWidth: 1 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="negative"
            name="Negative"
            stroke="#EF4444"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#EF4444', strokeWidth: 1 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
