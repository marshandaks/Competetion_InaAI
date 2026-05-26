'use client';

import React from 'react';
import { Feedback } from '@/lib/api';

interface Props {
  feedbackList: Feedback[];
  total: number;
  page: number;
  onPageChange: (p: number) => void;
  onRefresh: () => void;
}

export default function FeedbackFeed({ feedbackList, total, page, onPageChange, onRefresh }: Props) {
  const totalPages = Math.ceil(total / 20);

  const sentimentBadge = (s: string | null) => {
    if (!s) return <span className="text-xs text-[#64646c] italic">processing...</span>;
    const cls =
      s === 'positive' ? 'badge-positive' : s === 'negative' ? 'badge-negative' : 'badge-neutral';
    return <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${cls}`}>{s}</span>;
  };

  const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[#f5f5f5]">Customer Feedback</h2>
          <p className="text-sm text-[#64646c]">{total} total entries</p>
        </div>
        <button
          onClick={onRefresh}
          className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#111115] border border-[#1a1a1f] text-[#a0a0a8] hover:border-[#6366f1] hover:text-[#f5f5f5] transition-all"
        >
          ↻ Refresh
        </button>
      </div>

      <div className="space-y-3">
        {feedbackList.map((fb) => (
          <div key={fb.id} className="glass-card p-5 animate-fade-in">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {fb.customerName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#f5f5f5]">{fb.customerName}</p>
                    <p className="text-xs text-[#64646c]">
                      {new Date(fb.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-[#a0a0a8] leading-relaxed mb-3">{fb.feedback}</p>
                {fb.topics && fb.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {fb.topics.map((t) => (
                      <span key={t} className="topic-tag">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-sm text-[#f59e0b]">{stars(fb.rating)}</span>
                {sentimentBadge(fb.sentiment)}
                {fb.confidence != null && (
                  <span className="text-[10px] text-[#64646c]">
                    {Math.round(fb.confidence * 100)}% conf
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-3 py-1.5 rounded-lg text-xs bg-[#111115] border border-[#1a1a1f] text-[#a0a0a8] disabled:opacity-30 hover:border-[#2a2a35] transition-all"
          >
            ← Prev
          </button>
          <span className="text-xs text-[#64646c]">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-3 py-1.5 rounded-lg text-xs bg-[#111115] border border-[#1a1a1f] text-[#a0a0a8] disabled:opacity-30 hover:border-[#2a2a35] transition-all"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
