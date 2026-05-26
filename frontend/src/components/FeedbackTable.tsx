'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, ChevronDown, Download, RotateCcw,
  Eye, X, ChevronLeft, ChevronRight, RefreshCw,
  Flag, CheckCircle, User, Calendar, Tag, Cpu,
  Zap, AlertTriangle, TrendingUp, Smile, Frown, Meh,
} from 'lucide-react';
import { api, Feedback } from '@/lib/api';

/* ================================================================
   TYPES
================================================================ */
interface Props {
  feedbackList: Feedback[];
  total: number;
  page: number;
  onPageChange: (p: number) => void;
  onRefresh: () => void;
}

type SentimentFilter = 'all' | 'positive' | 'neutral' | 'negative';
type RatingFilter    = 'all' | '1' | '2' | '3' | '4' | '5';

interface GeminiAnalysis {
  summary:        string;
  root_cause:     string;
  impact:         'low' | 'medium' | 'high';
  recommendation: string;
  emotion:        'frustrated' | 'happy' | 'neutral' | 'disappointed' | 'satisfied';
}

/* ================================================================
   HELPERS
================================================================ */
function sentimentBadge(s: string | null, size: 'sm' | 'lg' = 'sm') {
  const base = size === 'lg'
    ? { padding: '6px 16px', fontSize: 13, borderRadius: 999 }
    : { padding: '3px 10px', fontSize: 11, borderRadius: 999 };
  if (!s) return <span style={{ ...base, background: '#F3F4F6', color: '#6B7280', fontWeight: 700, display: 'inline-block' }}>—</span>;
  if (s === 'positive') return <span style={{ ...base, background: '#DCFCE7', color: '#15803D', fontWeight: 700, display: 'inline-block' }}>Positive</span>;
  if (s === 'negative') return <span style={{ ...base, background: '#FEE2E2', color: '#DC2626', fontWeight: 700, display: 'inline-block' }}>Negative</span>;
  return <span style={{ ...base, background: '#F3F4F6', color: '#6B7280', fontWeight: 700, display: 'inline-block' }}>Neutral</span>;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ letterSpacing: 1, fontSize: 13 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < rating ? '#F59E0B' : '#D1D5DB' }}>★</span>
      ))}
    </span>
  );
}

function RatingBadge({ rating }: { rating: number }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      background: '#FFFBEB',
      border: '1px solid #FDE68A',
      color: '#D97706',
      padding: '3px 8px',
      borderRadius: 8,
      fontSize: 11.5,
      fontWeight: 700
    }}>
      <span style={{ color: '#F59E0B', letterSpacing: 0.5 }}>
        {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
      </span>
      <span style={{ fontSize: 11 }}>{rating}.0</span>
    </span>
  );
}

function TopicTags({ topics }: { topics: string[] }) {
  if (!topics?.length) return <span style={{ color: '#9CA3AF', fontSize: 12 }}>—</span>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {topics.slice(0, 3).map((t) => (
        <span key={t} style={{
          background: '#F3F4F6', color: '#6B7280',
          fontSize: 10.5, fontWeight: 600, padding: '2px 7px',
          borderRadius: 6, whiteSpace: 'nowrap',
        }}>#{t}</span>
      ))}
    </div>
  );
}

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return d; }
};

function exportToCsv(data: Feedback[]) {
  const header = ['Customer', 'Rating', 'Sentiment', 'Feedback', 'Topics', 'Date'];
  const rows = data.map((f) => [
    `"${f.customerName}"`, f.rating, f.sentiment || '',
    `"${f.feedback.replace(/"/g, '""')}"`,
    `"${(f.topics || []).join(', ')}"`, fmtDate(f.createdAt),
  ]);
  const csv  = [header, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `sentiview-feedback-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

/* ================================================================
   GEMINI API CALL
================================================================ */
async function analyzeWithGemini(
  feedbackText: string,
  sentiment: string | null,
  rating: number,
): Promise<GeminiAnalysis> {
  const GEMINI_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!GEMINI_KEY) throw new Error('Gemini API key not configured');

  const prompt = `Kamu adalah AI analyst untuk sistem customer feedback.

Analisa feedback pelanggan berikut dan berikan ringkasan dalam format JSON:
{
  "summary": "ringkasan 1-2 kalimat dalam bahasa Indonesia",
  "root_cause": "akar masalah utama yang dikeluhkan",
  "impact": "dampak ke bisnis (low/medium/high)",
  "recommendation": "rekomendasi tindakan konkret untuk tim",
  "emotion": "emosi dominan pelanggan (frustrated/happy/neutral/disappointed/satisfied)"
}

Feedback: "${feedbackText}"
Sentiment: ${sentiment || 'unknown'}
Rating: ${rating}/5

Jawab HANYA dengan JSON murni, tanpa markdown, tanpa backtick.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  );

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(json)?/, '').replace(/```$/, '').trim();
  }
  
  return JSON.parse(cleaned) as GeminiAnalysis;
}

/* ================================================================
   EMOTION / IMPACT DISPLAY
================================================================ */
const EMOTION_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
  happy:        { label: 'Happy',        color: '#059669', bg: '#ECFDF5', Icon: Smile },
  satisfied:    { label: 'Satisfied',    color: '#2563EB', bg: '#EFF6FF', Icon: Smile },
  neutral:      { label: 'Neutral',      color: '#6B7280', bg: '#F3F4F6', Icon: Meh },
  frustrated:   { label: 'Frustrated',   color: '#DC2626', bg: '#FEF2F2', Icon: Frown },
  disappointed: { label: 'Disappointed', color: '#D97706', bg: '#FFFBEB', Icon: Frown },
};

const IMPACT_CONFIG: Record<string, { color: string; bg: string }> = {
  low:    { color: '#059669', bg: '#ECFDF5' },
  medium: { color: '#D97706', bg: '#FFFBEB' },
  high:   { color: '#DC2626', bg: '#FEF2F2' },
};

/* ================================================================
   SIDE PANEL
================================================================ */
function InteractiveStars({ rating, onChange }: { rating: number; onChange: (r: number) => void }) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  return (
    <span style={{ letterSpacing: 3, fontSize: 16 }}>
      {Array.from({ length: 5 }, (_, i) => {
        const starVal = i + 1;
        const active = hoverRating !== null ? starVal <= hoverRating : starVal <= rating;
        return (
          <span
            key={i}
            onMouseEnter={() => setHoverRating(starVal)}
            onMouseLeave={() => setHoverRating(null)}
            onClick={() => onChange(starVal)}
            style={{ color: active ? '#F59E0B' : '#D1D5DB', cursor: 'pointer', transition: 'color 0.1s' }}
          >
            ★
          </span>
        );
      })}
    </span>
  );
}

function SidePanel({
  feedback,
  onClose,
  onUpdate,
}: {
  feedback: Feedback;
  onClose: () => void;
  onUpdate: (updated: Feedback) => void;
}) {
  const [gemini, setGemini]       = useState<GeminiAnalysis | null>(null);
  const [geminiLoading, setLoading] = useState(true);
  const [geminiError, setError]   = useState('');

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editedFeedback, setEditedFeedback] = useState(feedback.feedback);
  const [editedRating, setEditedRating] = useState(feedback.rating);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    setGemini(null); setError(''); setLoading(true);

    analyzeWithGemini(feedback.feedback, feedback.sentiment, feedback.rating)
      .then((result) => { if (!cancelled) setGemini(result); })
      .catch((e)     => { if (!cancelled) setError(e.message || 'Gagal menganalisis'); })
      .finally(()    => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [feedback.id]);

  useEffect(() => {
    setEditedFeedback(feedback.feedback);
    setEditedRating(feedback.rating);
    setIsEditing(false);
    setErrorMsg('');
  }, [feedback.id]);

  const handleSave = async () => {
    if (!editedFeedback.trim()) {
      setErrorMsg('Feedback text cannot be empty');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const updated = await api.updateFeedback(feedback.id, {
        feedback: editedFeedback,
        rating: editedRating,
        version: feedback.version,
      });
      setIsEditing(false);
      onUpdate(updated);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Gagal menyimpan perubahan');
    } finally {
      setSaving(false);
    }
  };

  const conf = typeof feedback.confidenceScore === 'number'
    ? Math.round(feedback.confidenceScore * 100)
    : typeof feedback.confidence === 'number'
    ? Math.round(feedback.confidence * 100)
    : null;

  const emotionCfg = gemini ? (EMOTION_CONFIG[gemini.emotion] || EMOTION_CONFIG.neutral) : null;
  const impactCfg  = gemini ? (IMPACT_CONFIG[gemini.impact]   || IMPACT_CONFIG.medium)  : null;

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)',
        zIndex: 200, backdropFilter: 'blur(2px)',
      }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 440,
        background: '#fff', zIndex: 201,
        boxShadow: '-4px 0 32px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '18px 20px', borderBottom: '1px solid #E5E7EB',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: '#ECFDF5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <User size={16} color="#059669" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{feedback.customerName}</p>
            <p style={{ fontSize: 12, color: '#9CA3AF' }}>Feedback Detail + Gemini Analysis</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                background: '#EFF6FF', border: '1.5px solid #BFDBFE', cursor: 'pointer',
                borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#2563EB',
                display: 'flex', alignItems: 'center', gap: 4, marginRight: 8, fontFamily: 'inherit',
                transition: 'all 0.12s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#DBEAFE'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#EFF6FF'; }}
            >
              Edit
            </button>
          )}
          <button onClick={onClose} style={{
            background: '#F3F4F6', border: 'none', cursor: 'pointer',
            borderRadius: 8, padding: 6, display: 'flex', alignItems: 'center',
          }}>
            <X size={16} color="#6B7280" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {/* Locking Conflict / Error Message */}
          {errorMsg && (
            <div style={{
              background: '#FEF2F2', border: '1.5px solid #FCA5A5',
              borderRadius: 10, padding: 14, fontSize: 13, color: '#DC2626',
              marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                <AlertTriangle size={15} />
                <span>Conflict / Error</span>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5 }}>{errorMsg}</p>
            </div>
          )}

          {/* Full Feedback or Textarea */}
          {isEditing ? (
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 6 }}>
                Edit Feedback Text
              </label>
              <textarea
                value={editedFeedback}
                onChange={(e) => setEditedFeedback(e.target.value)}
                style={{
                  width: '100%', minHeight: 100, padding: '10px 12px',
                  borderRadius: 8, border: '1.5px solid #D1D5DB', fontSize: 13.5,
                  fontFamily: 'inherit', color: '#1F2937', outline: 'none',
                  transition: 'border-color 0.15s', resize: 'vertical'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#10B981'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#D1D5DB'}
              />
            </div>
          ) : (
            <p style={{
              fontSize: 14.5, color: '#1F2937', lineHeight: 1.75,
              fontStyle: 'italic', borderLeft: '3px solid #10B981',
              padding: '14px 16px', background: '#F9FAFB',
              borderRadius: '0 8px 8px 0', marginBottom: 22,
            }}>
              "{feedback.feedback}"
            </p>
          )}

          {/* Sentiment + Confidence (from backend) */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 20,
          }}>
            {sentimentBadge(feedback.sentiment)}
            {conf !== null && (
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11.5, color: '#9CA3AF', fontWeight: 500 }}>Confidence</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>{conf}%</span>
                </div>
                <div style={{ height: 5, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${conf}%`, borderRadius: 99,
                    background: 'linear-gradient(90deg, #10B981, #059669)',
                  }} />
                </div>
              </div>
            )}
          </div>

          {/* ======= GEMINI AI ANALYSIS ======= */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Zap size={14} color="#7C3AED" />
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C3AED' }}>
                Gemini AI Analysis
              </p>
            </div>

            {/* Loading */}
            {geminiLoading && (
              <div style={{
                background: '#FAFAF9', border: '1px solid #E5E7EB',
                borderRadius: 12, padding: 24, textAlign: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <div className="spinner" style={{ width: 18, height: 18 }} />
                  <p style={{ fontSize: 13, color: '#6B7280' }}>Gemini sedang menganalisis feedback…</p>
                </div>
              </div>
            )}

            {/* Error */}
            {!geminiLoading && geminiError && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FECACA',
                borderRadius: 10, padding: 14, fontSize: 13, color: '#DC2626',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <AlertTriangle size={14} /> {geminiError}
              </div>
            )}

            {/* Result */}
            {!geminiLoading && gemini && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* Summary */}
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: 14 }}>
                  <p style={{ fontSize: 10.5, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Summary</p>
                  <p style={{ fontSize: 13.5, color: '#1F2937', lineHeight: 1.6 }}>{gemini.summary}</p>
                </div>

                {/* Root Cause */}
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: 14 }}>
                  <p style={{ fontSize: 10.5, fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Root Cause</p>
                  <p style={{ fontSize: 13, color: '#1F2937', lineHeight: 1.6 }}>{gemini.root_cause}</p>
                </div>

                {/* Recommendation */}
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: 14 }}>
                  <p style={{ fontSize: 10.5, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Recommendation</p>
                  <p style={{ fontSize: 13, color: '#1F2937', lineHeight: 1.6 }}>{gemini.recommendation}</p>
                </div>

                {/* Impact + Emotion row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {/* Impact */}
                  <div style={{ background: impactCfg!.bg, borderRadius: 10, padding: 12, border: '1px solid #E5E7EB' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Business Impact</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <TrendingUp size={14} color={impactCfg!.color} />
                      <span style={{ fontSize: 14, fontWeight: 800, color: impactCfg!.color, textTransform: 'uppercase' }}>
                        {gemini.impact}
                      </span>
                    </div>
                  </div>

                  {/* Emotion */}
                  <div style={{ background: emotionCfg!.bg, borderRadius: 10, padding: 12, border: '1px solid #E5E7EB' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Emotion</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {emotionCfg && <emotionCfg.Icon size={14} color={emotionCfg.color} />}
                      <span style={{ fontSize: 13, fontWeight: 700, color: emotionCfg!.color, textTransform: 'capitalize' }}>
                        {gemini.emotion}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Topics (from backend) */}
          {feedback.topics?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Tag size={13} color="#9CA3AF" />
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9CA3AF' }}>Topics Detected</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {feedback.topics.map((t) => (
                  <span key={t} style={{
                    background: '#ECFDF5', color: '#059669', fontSize: 12,
                    fontWeight: 600, padding: '3px 10px', borderRadius: 6,
                  }}>#{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Details */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Calendar size={13} color="#9CA3AF" />
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9CA3AF' }}>Details</p>
            </div>
            <div style={{ background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              {[
                { label: 'Customer', value: feedback.customerName },
                {
                  label: 'Rating',
                  value: isEditing ? (
                    <InteractiveStars rating={editedRating} onChange={setEditedRating} />
                  ) : (
                    <Stars rating={feedback.rating} />
                  )
                },
                { label: 'Date',     value: fmtDate(feedback.createdAt) },
                ...(isEditing ? [{ label: 'Version (Lock)', value: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4B5563' }}>v{feedback.version}</span> }] : [])
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', borderBottom: '1px solid #E5E7EB',
                }}>
                  <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: 13, color: '#111827', fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: 10 }}>
          {isEditing ? (
            <>
              <button
                disabled={saving}
                onClick={() => { setIsEditing(false); setErrorMsg(''); setEditedFeedback(feedback.feedback); setEditedRating(feedback.rating); }}
                style={{
                  flex: 1, padding: '9px 14px', border: '1.5px solid #D1D5DB',
                  borderRadius: 8, color: '#4B5563', background: 'transparent',
                  fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontFamily: 'inherit', opacity: saving ? 0.6 : 1, transition: 'all 0.12s'
                }}
                onMouseEnter={(e) => { if(!saving) e.currentTarget.style.background = '#F3F4F6'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                Cancel
              </button>
              <button
                disabled={saving}
                onClick={handleSave}
                style={{
                  flex: 1, padding: '9px 14px', border: 'none', borderRadius: 8,
                  color: '#fff', background: 'linear-gradient(135deg, #059669, #10B981)',
                  fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontFamily: 'inherit', opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? (
                  <>
                    <div className="spinner" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block', verticalAlign: 'middle', marginRight: 5, borderRadius: '50%' }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} /> Save Changes
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button style={{
                flex: 1, padding: '9px 14px', border: '1.5px solid #EF4444',
                borderRadius: 8, color: '#DC2626', background: 'transparent',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontFamily: 'inherit',
              }}>
                <Flag size={14} /> Flag for Review
              </button>
              <button style={{
                flex: 1, padding: '9px 14px', border: 'none', borderRadius: 8,
                color: '#fff', background: 'linear-gradient(135deg, #059669, #10B981)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontFamily: 'inherit',
              }}>
                <CheckCircle size={14} /> Mark Resolved
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ================================================================
   MAIN COMPONENT
================================================================ */
const LIMIT = 10;

export default function FeedbackTable({ feedbackList, total, page, onPageChange, onRefresh }: Props) {
  const [search,    setSearch]    = useState('');
  const [sentiment, setSentiment] = useState<SentimentFilter>('all');
  const [rating,    setRating]    = useState<RatingFilter>('all');
  const [dateFrom,  setDateFrom]  = useState('');
  const [dateTo,    setDateTo]    = useState('');
  const [selected,  setSelected]  = useState<Feedback | null>(null);

  const filtered = useMemo(() => {
    return feedbackList.filter((f) => {
      if (search) {
        const q = search.toLowerCase();
        if (!f.customerName.toLowerCase().includes(q) && !f.feedback.toLowerCase().includes(q)) return false;
      }
      if (sentiment !== 'all' && f.sentiment !== sentiment) return false;
      if (rating !== 'all' && f.rating !== Number(rating)) return false;
      if (dateFrom && new Date(f.createdAt) < new Date(dateFrom)) return false;
      if (dateTo   && new Date(f.createdAt) > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [feedbackList, search, sentiment, rating, dateFrom, dateTo]);

  const pos = feedbackList.filter((f) => f.sentiment === 'positive').length;
  const neu = feedbackList.filter((f) => f.sentiment === 'neutral').length;
  const neg = feedbackList.filter((f) => f.sentiment === 'negative').length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * LIMIT, safePage * LIMIT);

  const resetFilters = () => { setSearch(''); setSentiment('all'); setRating('all'); setDateFrom(''); setDateTo(''); };

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB',
    fontSize: 13, color: '#374151', background: '#fff',
    fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s',
  };

  return (
    <div>
      {/* Mini Summary Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Positive', count: pos, bg: '#DCFCE7', color: '#15803D' },
          { label: 'Neutral',  count: neu, bg: '#F3F4F6', color: '#6B7280' },
          { label: 'Negative', count: neg, bg: '#FEE2E2', color: '#DC2626' },
        ].map((s) => (
          <span key={s.label} style={{
            background: s.bg, color: s.color,
            fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 999,
          }}>{s.label}: {s.count}</span>
        ))}
        <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 4 }}>{total} records total</span>
        <button onClick={onRefresh} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <RefreshCw size={14} color="#9CA3AF" />
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{
        background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
        padding: '14px 16px', marginBottom: 16,
        display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
      }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
          <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" placeholder="Search customer or feedback..." value={search}
            onChange={(e) => { setSearch(e.target.value); onPageChange(1); }}
            style={{ ...inputStyle, width: '100%', paddingLeft: 32 }} />
        </div>
        <div style={{ position: 'relative' }}>
          <select value={sentiment} onChange={(e) => { setSentiment(e.target.value as SentimentFilter); onPageChange(1); }}
            style={{ ...inputStyle, paddingRight: 28, appearance: 'none', cursor: 'pointer' }}>
            <option value="all">All Sentiments</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
          <ChevronDown size={13} color="#9CA3AF" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
        <div style={{ position: 'relative' }}>
          <select value={rating} onChange={(e) => { setRating(e.target.value as RatingFilter); onPageChange(1); }}
            style={{ ...inputStyle, paddingRight: 28, appearance: 'none', cursor: 'pointer' }}>
            <option value="all">All Ratings</option>
            {[1,2,3,4,5].map((r) => <option key={r} value={r}>{'★'.repeat(r)} {r} Star</option>)}
          </select>
          <ChevronDown size={13} color="#9CA3AF" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); onPageChange(1); }} style={inputStyle} title="From date" />
        <input type="date" value={dateTo}   onChange={(e) => { setDateTo(e.target.value);   onPageChange(1); }} style={inputStyle} title="To date" />
        <button onClick={() => exportToCsv(filtered)} style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 600, color: '#374151' }}>
          <Download size={13} color="#6B7280" /> Export CSV
        </button>
        <button onClick={resetFilters} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit', padding: '8px 4px' }}>
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Customer', 'Feedback', 'Topics', 'Rating', 'Sentiment', 'Date', 'Action'].map((col) => (
                  <th key={col} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>No feedback found matching your filters.</td></tr>
              ) : paged.map((f) => (
                <tr key={f.id} onClick={() => setSelected(f)} style={{ borderBottom: '1px solid #F3F4F6', cursor: 'pointer', transition: 'background 0.12s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F0FDF4')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}>

                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>{f.customerName.charAt(0).toUpperCase()}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{f.customerName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', maxWidth: 280 }}>
                    <p style={{ fontSize: 12.5, color: '#4B5563', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{f.feedback}</p>
                  </td>
                  <td style={{ padding: '12px 16px', minWidth: 100 }}><TopicTags topics={f.topics || []} /></td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}><RatingBadge rating={f.rating} /></td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{sentimentBadge(f.sentiment)}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{fmtDate(f.createdAt)}</td>
                  <td style={{ padding: '12px 16px' }} onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setSelected(f)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 12, fontWeight: 600, color: '#6B7280', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#10B981'; e.currentTarget.style.color = '#059669'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#6B7280'; }}>
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderTop: '1px solid #F3F4F6', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, color: '#9CA3AF', marginRight: 4 }}>
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * LIMIT + 1}–{Math.min(safePage * LIMIT, filtered.length)} of {filtered.length} records
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
            <button onClick={() => onPageChange(Math.max(1, safePage - 1))} disabled={safePage <= 1}
              style={{ padding: '5px 10px', borderRadius: 7, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 12, fontWeight: 600, color: '#6B7280', cursor: safePage <= 1 ? 'not-allowed' : 'pointer', opacity: safePage <= 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
              <ChevronLeft size={13} /> Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => onPageChange(p)}
                style={{ width: 32, height: 32, borderRadius: 7, border: '1.5px solid ' + (p === safePage ? '#10B981' : '#E5E7EB'), background: p === safePage ? '#10B981' : '#fff', color: p === safePage ? '#fff' : '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {p}
              </button>
            ))}
            <button onClick={() => onPageChange(Math.min(totalPages, safePage + 1))} disabled={safePage >= totalPages}
              style={{ padding: '5px 10px', borderRadius: 7, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 12, fontWeight: 600, color: '#6B7280', cursor: safePage >= totalPages ? 'not-allowed' : 'pointer', opacity: safePage >= totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Side Panel */}
      {selected && (
        <SidePanel
          feedback={selected}
          onClose={() => setSelected(null)}
          onUpdate={(updated) => {
            setSelected(updated);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
