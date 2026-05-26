'use client';

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { AnalyticsData } from '@/lib/api';

interface Props {
  data: AnalyticsData['ratingDistribution'];
}

const BAR_COLOR = '#10B981';

export default function RatingChart({ data }: Props) {
  // ensure all 5 stars are shown even with 0 counts, supporting both raw numbers and '★X' string formats
  const normalized = [1, 2, 3, 4, 5].map((star) => {
    const found = (data || []).find((d) => {
      const r = d.rating as any;
      if (typeof r === 'number') return r === star;
      if (typeof r === 'string') {
        const num = parseInt(r.replace(/\D/g, ''), 10);
        return num === star;
      }
      // handle dynamic types
      const numVal = parseInt(String(r).replace(/\D/g, ''), 10);
      return numVal === star;
    });
    return { rating: `★${star}`, count: found?.count ?? 0 };
  });

  return (
    <div className="chart-card">
      <p className="chart-title">Rating Distribution</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={normalized} barSize={22} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#F3F4F6" />
          <XAxis
            dataKey="rating"
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
            cursor={{ fill: '#F0FDF4' }}
          />
          <Bar dataKey="count" radius={[5, 5, 0, 0]}>
            {normalized.map((_, i) => (
              <Cell key={i} fill={BAR_COLOR} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
