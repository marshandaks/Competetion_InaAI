'use client';

import React, { useState } from 'react';
import { RefreshCw, AlertTriangle, TrendingUp, Info, Zap, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { AiInsight } from '@/lib/api';

interface Props {
  insights: AiInsight[];
  onGenerate: () => void;
  loading: boolean;
  topicBreakdown?: { name: string; value: number }[];
}

const TYPE_CONFIG: Record<string, { color: string; bg: string; Icon: any }> = {
  warning:    { color: '#D97706', bg: '#FFFBEB', Icon: AlertTriangle },
  critical:   { color: '#DC2626', bg: '#FEF2F2', Icon: Zap },
  opportunity:{ color: '#2563EB', bg: '#EFF6FF', Icon: TrendingUp },
  positive:   { color: '#059669', bg: '#ECFDF5', Icon: CheckCircle2 },
  trend:      { color: '#7C3AED', bg: '#F5F3FF', Icon: TrendingUp },
  info:       { color: '#0369A1', bg: '#F0F9FF', Icon: Info },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type?.toLowerCase()] || TYPE_CONFIG.info;
}

function InsightCard({ insight, delay }: { insight: AiInsight; delay: number }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = getConfig(insight.type || insight.severity || 'info');

  return (
    <div className="insight-card" style={{ animationDelay: `${delay * 0.07}s` }}>
      <div className="insight-header">
        <div style={{ flexShrink: 0, padding: '6px 10px', borderRadius: 8, background: cfg.bg, display: 'flex', alignItems: 'center', gap: 5 }}>
          <cfg.Icon size={14} color={cfg.color} strokeWidth={2.5} />
          <span style={{ fontSize: 10.5, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {insight.type || 'Insight'}
          </span>
        </div>
        {insight.trend && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9CA3AF', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: '2px 8px', fontWeight: 500 }}>
            {insight.trend}
          </span>
        )}
      </div>

      <h3 className="insight-title">{insight.title}</h3>
      <p className="insight-summary">{insight.summary || insight.content}</p>

      {/* Confidence */}
      {typeof insight.confidenceScore === 'number' && (
        <div style={{ marginBottom: 14 }}>
          <p className="insight-section-title">Confidence Score</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="confidence-bar" style={{ flex: 1 }}>
              <div className="confidence-fill" style={{ width: `${Math.round(insight.confidenceScore * 100)}%` }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', width: 32 }}>
              {Math.round(insight.confidenceScore * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Expand toggle */}
      {(insight.rootCauses?.length > 0 || insight.businessImpact?.length > 0 || insight.recommendations?.length > 0) && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 600, color: '#6B7280',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 0, fontFamily: 'inherit', marginBottom: expanded ? 14 : 0,
            }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Hide details' : 'Show details'}
          </button>

          {expanded && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {insight.rootCauses?.length > 0 && (
                <div>
                  <p className="insight-section-title">Root Causes</p>
                  <ul className="insight-list">
                    {insight.rootCauses.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
              {insight.businessImpact?.length > 0 && (
                <div>
                  <p className="insight-section-title">Business Impact</p>
                  <ul className="insight-list">
                    {insight.businessImpact.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
              )}
              {insight.recommendations?.length > 0 && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <p className="insight-section-title">Recommendations</p>
                  <ul className="insight-list">
                    {insight.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Related Topics */}
      {insight.relatedTopics?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
          {insight.relatedTopics.map((t) => (
            <span key={t} style={{ fontSize: 11, background: '#F3F4F6', color: '#6B7280', borderRadius: 6, padding: '2px 8px', fontWeight: 500 }}>
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function InsightsList({ insights, onGenerate, loading, topicBreakdown }: Props) {
  return (
    <div>
      {/* Top Issues Section */}
      {topicBreakdown && topicBreakdown.length > 0 && (
        <div className="chart-card" style={{ marginBottom: 24 }}>
          <p className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 14px', fontSize: 13.5 }}>
            <Zap size={15} color="#7C3AED" /> Top complained issues this week
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            {topicBreakdown
              .filter(t => t.name !== 'other')
              .sort((a, b) => b.value - a.value)
              .slice(0, 3)
              .map((topic, index) => {
                const colors = [
                  { bg: '#FEF2F2', border: '#FCA5A5', text: '#DC2626', icon: '🚚' }, // 1st
                  { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706', icon: '📦' }, // 2nd
                  { bg: '#EFF6FF', border: '#BFDBFE', text: '#2563EB', icon: '📱' }, // 3rd
                ][index] || { bg: '#F3F4F6', border: '#E5E7EB', text: '#4B5563', icon: '🏷️' };

                const getTopicIcon = (name: string) => {
                  const n = name.toLowerCase();
                  if (n.includes('delivery') || n.includes('kirim')) return '🚚';
                  if (n.includes('pack') || n.includes('kemas')) return '📦';
                  if (n.includes('app') || n.includes('bug') || n.includes('error') || n.includes('crash')) return '📱';
                  if (n.includes('price') || n.includes('harga') || n.includes('mahal')) return '💰';
                  if (n.includes('service') || n.includes('cs') || n.includes('pelayanan')) return '📞';
                  return colors.icon;
                };

                return (
                  <div key={topic.name} style={{
                    background: colors.bg,
                    border: `1.5px solid ${colors.border}`,
                    borderRadius: 12,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}>
                    <div style={{
                      width: 36, height: 36,
                      borderRadius: 10,
                      background: '#FFFFFF',
                      border: `1px solid ${colors.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0
                    }}>
                      {getTopicIcon(topic.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1F2937', textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {topic.name}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 600, color: colors.text }}>
                        {topic.value} complaints detected
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 13, color: '#6B7280' }}>
            {insights.length} AI-generated insights from customer feedback data
          </p>
        </div>
        <button className="btn btn-primary" onClick={onGenerate} disabled={loading}>
          {loading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <RefreshCw size={14} />}
          {loading ? 'Generating…' : 'Generate Insights'}
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="spinner" style={{ margin: '0 auto 12px', width: 28, height: 28 }} />
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>AI sedang menganalisis data Anda…</p>
        </div>
      )}

      {!loading && insights.length === 0 && (
        <div style={{ textAlign: 'center', padding: 64, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB' }}>
          <Info size={36} color="#D1D5DB" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>No insights yet</p>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
            Click "Generate Insights" to run Gemini AI analysis
          </p>
        </div>
      )}

      {!loading && insights.map((insight, i) => (
        <InsightCard key={insight.id ?? i} insight={insight} delay={i} />
      ))}
    </div>
  );
}
