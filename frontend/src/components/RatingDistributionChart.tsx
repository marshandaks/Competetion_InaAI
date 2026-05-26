'use client';

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList, Tooltip
} from 'recharts';
import { AnalyticsData } from '@/lib/api';

interface Props {
  data: AnalyticsData['ratingDistribution'];
}

// Gradient mapping from Red (1 star) to Green/Emerald (5 stars)
const GRADIENTS = {
  1: { from: '#EF4444', to: '#B91C1C', id: 'grad-1' }, // Red
  2: { from: '#F97316', to: '#C2410C', id: 'grad-2' }, // Orange
  3: { from: '#FBBF24', to: '#B45309', id: 'grad-3' }, // Yellow/Gold
  4: { from: '#A3E635', to: '#4D7C0F', id: 'grad-4' }, // Lime/Light Green
  5: { from: '#10B981', to: '#047857', id: 'grad-5' }, // Emerald/Green
};

export default function RatingDistributionChart({ data = [] }: Props) {
  const total = data.reduce((sum, d) => sum + (d.count || 0), 0);

  // Normalize data from 5★ down to 1★ (standard e-commerce layout)
  const normalizedData = [5, 4, 3, 2, 1].map((star) => {
    const found = data.find((d) => {
      const r = d.rating as any;
      if (typeof r === 'number') return r === star;
      const num = parseInt(String(r).replace(/\D/g, ''), 10);
      return num === star;
    });

    const count = found ? found.count : 0;
    const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';

    return {
      name: `${star} Star`,
      rating: star,
      count,
      percentage: `${pct}%`,
      display: `${count} (${pct}%)`,
    };
  });

  const renderCustomizedLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    
    // Position text inside the bar if wide enough, otherwise place it just after the bar
    const isWide = width > 75;
    const textAnchor = isWide ? 'end' : 'start';
    const xPos = isWide ? x + width - 10 : x + width + 8;
    const fill = isWide ? '#FFFFFF' : '#4B5563';

    return (
      <text
        x={xPos}
        y={y + height / 2 + 4}
        fill={fill}
        textAnchor={textAnchor}
        fontSize={11.5}
        fontWeight={700}
        fontFamily="inherit"
      >
        {value}
      </text>
    );
  };

  return (
    <div className="chart-card" style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <p className="chart-title" style={{ margin: 0 }}>Rating Distribution</p>
        <span style={{ fontSize: 11.5, color: '#6B7280', fontWeight: 600, background: '#F3F4F6', padding: '3px 9px', borderRadius: 999 }}>
          {total} Reviews Total
        </span>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={normalizedData}
          layout="vertical"
          margin={{ top: 0, right: 45, left: -10, bottom: 0 }}
        >
          {/* Define beautiful color gradients */}
          <defs>
            {Object.entries(GRADIENTS).map(([star, color]) => (
              <linearGradient id={color.id} key={star} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={color.from} />
                <stop offset="100%" stopColor={color.to} />
              </linearGradient>
            ))}
          </defs>

          <XAxis type="number" hide />
          
          <YAxis
            dataKey="name"
            type="category"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#4B5563', fontWeight: 700 }}
            width={65}
          />

          <Tooltip
            formatter={(value: any, name: any, props: any) => [
              `${value} feedback (${props.payload.percentage})`,
              'Total'
            ]}
            contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, fontWeight: 500 }}
            cursor={{ fill: '#F9FAFB', opacity: 0.5 }}
          />

          <Bar
            dataKey="count"
            radius={[0, 6, 6, 0]}
            background={{ fill: '#F3F4F6', radius: 6 }}
          >
            {normalizedData.map((entry, index) => {
              const grad = GRADIENTS[entry.rating as 1|2|3|4|5] || GRADIENTS[5];
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#${grad.id})`}
                />
              );
            })}
            <LabelList dataKey="display" content={renderCustomizedLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
