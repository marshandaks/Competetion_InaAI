'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Upload, MessageSquare, Lightbulb,
  Zap, LogOut, Wifi, WifiOff, Sparkles, Activity, AlertCircle, Star
} from 'lucide-react';
import { api, AnalyticsData, Feedback, AiInsight } from '@/lib/api';
import { getSocket, disconnectSocket } from '@/lib/socket';
import CsvUpload from '@/components/CsvUpload';
import StatsCards from '@/components/StatsCards';
import SentimentChart from '@/components/SentimentChart';
import RatingDistributionChart from '@/components/RatingDistributionChart';
import TrendChart from '@/components/TrendChart';
import TopicCloud from '@/components/TopicCloud';
import FeedbackTable from '@/components/FeedbackTable';
import InsightsList from '@/components/InsightsList';
import ImportHistoryTable from '@/components/ImportHistoryTable';
import { mockAnalytics, mockFeedbackList } from '@/lib/mockData';

type Tab = 'dashboard' | 'upload' | 'feedback' | 'insights';

const NAV = [
  { section: 'Analytics',     items: [{ id: 'dashboard' as Tab, label: 'Dashboard', Icon: LayoutDashboard }] },
  { section: 'Ingestion',     items: [
    { id: 'upload'    as Tab, label: 'Upload',    Icon: Upload },
    { id: 'feedback'  as Tab, label: 'Feedback',  Icon: MessageSquare },
  ]},
  { section: 'Intelligence',  items: [{ id: 'insights' as Tab, label: 'AI Insights', Icon: Lightbulb }] },
];

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [dataMode, setDataMode] = useState<'demo' | 'live'>('demo');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [feedbackTotal, setFeedbackTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();

  // Auth guard
  useEffect(() => {
    const token = localStorage.getItem('sentiview_token');
    if (!token) router.push('/login');
  }, [router]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadAnalytics = useCallback(async () => {
    try {
      const raw = await api.getAnalytics();
      const data: AnalyticsData = {
        ...raw,
        totalFeedback:       raw.totalFeedback ?? 0,
        averageRating:       raw.averageRating ?? 0,
        averageConfidence:   raw.averageConfidence,
        sentimentBreakdown:  raw.sentimentBreakdown  || raw.sentimentDistribution || { positive: 0, negative: 0, neutral: 0 },
        sentimentDistribution: raw.sentimentDistribution || raw.sentimentBreakdown || { positive: 0, negative: 0, neutral: 0 },
        topTopics:    raw.topTopics    || (raw.topicBreakdown || []).map((t: any) => ({ topic: t.name, count: t.value })),
        topicBreakdown: raw.topicBreakdown || [],
        ratingDistribution: raw.ratingDistribution || [],
        recentTrend: raw.recentTrend || raw.trendChart || [],
        trendChart:  raw.trendChart  || raw.recentTrend || [],
      };
      setAnalytics(data);
    } catch (e) {
      console.error('Failed to load analytics', e);
    }
  }, []);

  const loadFeedback = useCallback(async (p = 1) => {
    try {
      const data = await api.getFeedback(p, 20);
      setFeedbackList(data.items || data.data || []);
      setFeedbackTotal(data.total);
      setPage(p);
    } catch (e) {
      console.error('Failed to load feedback', e);
    }
  }, []);

  const loadInsights = useCallback(async () => {
    setInsightsLoading(true);
    try {
      const data = await api.getInsights();
      setInsights(data);
    } catch (e) {
      console.error('Failed to load insights', e);
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadAnalytics(), loadFeedback(1), loadInsights()]);
      setLoading(false);
    };
    init();

    const socket = getSocket();
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('feedback:analyzed', (data: { feedback: Feedback; message?: string }) => {
      if (data?.feedback) {
        setFeedbackList((prev) => {
          const exists = prev.some((f) => f.id === data.feedback.id);
          if (exists) return prev.map((f) => f.id === data.feedback.id ? data.feedback : f);
          return [data.feedback, ...prev].slice(0, 20);
        });
        loadAnalytics();
        if (data.message) showToast(data.message);
      }
    });
    socket.on('feedback:uploaded', (data: { message?: string }) => {
      if (data?.message) showToast(data.message);
      loadFeedback(1);
      loadAnalytics();
    });
    socket.on('feedback:updated', (data: { feedback: Feedback; message?: string }) => {
      if (data?.feedback) {
        setFeedbackList((prev) => prev.map((f) => f.id === data.feedback.id ? data.feedback : f));
        loadAnalytics();
        if (data.message) showToast(data.message);
      }
    });
    socket.on('analyticsUpdated', () => loadAnalytics());
    socket.on('insightsGenerated', () => loadInsights());

    return () => { disconnectSocket(); };
  }, [loadAnalytics, loadFeedback, loadInsights]);

  const handleUploadComplete = () => {
    showToast('CSV uploaded! AI is processing your feedback…');
    setTab('feedback');
    setDataMode('live');
    loadFeedback(1);
    loadAnalytics();
    setRefreshTrigger((p) => p + 1);
  };

  const handleSimulate = async () => {
    try {
      await api.simulateFeedback();
      showToast('Simulated feedback generated!');
      setDataMode('live');
      loadFeedback(1);
      setRefreshTrigger((p) => p + 1);
    } catch {
      showToast('Simulation failed');
    }
  };

  const handleGenerateInsights = async () => {
    setInsightsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('sentiview_token') : null;
      await fetch(`${apiUrl}/api/analytics/insights`, {
        headers: {
          'Cache-Control': 'no-cache',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      });
      await loadInsights();
      showToast('AI Insights berhasil di-generate!');
    } catch {
      showToast('Gagal generate insights');
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sentiview_token');
    router.push('/login');
  };

  const activeAnalytics = useMemo(() => {
    if (dataMode === 'demo') {
      return {
        totalFeedback: mockAnalytics.totalFeedback,
        averageRating: mockAnalytics.averageRating,
        sentimentBreakdown: mockAnalytics.sentimentBreakdown,
        sentimentDistribution: mockAnalytics.sentimentBreakdown,
        topTopics: mockAnalytics.topKeywords.map(k => ({ topic: k.text, count: k.count })),
        topicBreakdown: mockAnalytics.topKeywords.map(k => ({ name: k.text, value: k.count })),
        ratingDistribution: mockAnalytics.ratingDistribution.map(r => ({ rating: Number(r.rating), count: r.count })),
        recentTrend: mockAnalytics.sentimentTrend,
        trendChart: mockAnalytics.sentimentTrend,
      } as AnalyticsData;
    }
    return (analytics || {
      totalFeedback: 0,
      averageRating: 0,
      sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
      sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
      topTopics: [],
      topicBreakdown: [],
      ratingDistribution: [],
      recentTrend: [],
      trendChart: [],
    }) as AnalyticsData;
  }, [dataMode, analytics]);

  const activeFeedList = useMemo(() => {
    if (dataMode === 'demo') {
      return mockFeedbackList;
    }
    return feedbackList.slice(0, 5).map(f => ({
      id: f.id,
      customerName: f.customerName,
      rating: f.rating,
      feedback: f.feedback,
      sentiment: (f.sentiment || 'neutral') as 'positive' | 'neutral' | 'negative',
      topics: f.topics || [],
      createdAt: f.createdAt,
    }));
  }, [dataMode, feedbackList]);

  const isEmpty = dataMode === 'live' && activeAnalytics.totalFeedback === 0;

  const PAGE_TITLES: Record<Tab, string> = {
    dashboard: 'Dashboard',
    upload:    'Upload Data',
    feedback:  'Feedback Data',
    insights:  'AI Insights',
  };

  return (
    <div className="app-layout">
      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}

      {/* ===== SIDEBAR ===== */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">S</div>
          <span className="sidebar-logo-text">SentiView AI</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((group) => (
            <React.Fragment key={group.section}>
              <p className="sidebar-section">{group.section}</p>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  className={`sidebar-item${tab === item.id ? ' active' : ''}`}
                  onClick={() => setTab(item.id)}
                >
                  <item.Icon className="sidebar-icon" size={16} strokeWidth={2} />
                  {item.label}
                  {item.id === 'feedback' && (
                    <span className="sidebar-badge">
                      {dataMode === 'demo' ? 32 : (feedbackTotal > 99 ? '99+' : feedbackTotal)}
                    </span>
                  )}
                </button>
              ))}
            </React.Fragment>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="status-dot">
            <span className={`dot ${connected ? 'dot-green' : 'dot-red'}`} />
            <span>{connected ? 'Connected' : 'Offline'}</span>
            {connected ? <Wifi size={12} color="#10B981" style={{ marginLeft: 'auto' }} /> : <WifiOff size={12} color="#EF4444" style={{ marginLeft: 'auto' }} />}
          </div>
          <button className="sidebar-item" onClick={handleSimulate}>
            <Zap className="sidebar-icon" size={16} />
            Simulate Feedback
          </button>
          <button className="sidebar-item sidebar-item-danger" onClick={handleLogout}>
            <LogOut className="sidebar-icon" size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <main className="main-content">
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
            <div className="spinner" style={{ width: 28, height: 28 }} />
          </div>
        ) : (
          <>
            {/* Header with Demo/Live Toggle */}
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 className="page-title">{PAGE_TITLES[tab]}</h1>
                <p className="page-subtitle">Real-time Customer Experience and Sentiment Analytics Platform</p>
              </div>
              {tab === 'dashboard' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#FFFFFF',
                  border: '1.5px solid #E5E7EB',
                  borderRadius: 99,
                  padding: '3px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                  <button
                    onClick={() => setDataMode('demo')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 99,
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: dataMode === 'demo' ? '#10B981' : 'transparent',
                      color: dataMode === 'demo' ? '#FFFFFF' : '#6B7280',
                      transition: 'all 0.15s',
                      fontFamily: 'inherit'
                    }}
                  >
                    Demo Mode
                  </button>
                  <button
                    onClick={() => setDataMode('live')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 99,
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: dataMode === 'live' ? '#10B981' : 'transparent',
                      color: dataMode === 'live' ? '#FFFFFF' : '#6B7280',
                      transition: 'all 0.15s',
                      fontFamily: 'inherit'
                    }}
                  >
                    Live DB
                  </button>
                </div>
              )}
            </div>

            {/* DASHBOARD */}
            {tab === 'dashboard' && (
              isEmpty ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: '#FFFFFF', border: '1.5px solid #E5E7EB', borderRadius: 16,
                  padding: '64px 32px', textAlign: 'center', minHeight: 450,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginTop: 12
                }}>
                  {/* Premium sleek SVG illustration */}
                  <svg width="180" height="140" viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 24 }}>
                    <rect x="20" y="20" width="140" height="100" rx="12" fill="#ECFDF5" stroke="#10B981" strokeWidth="2.5" />
                    <rect x="40" y="45" width="100" height="8" rx="4" fill="#A7F3D0" />
                    <rect x="40" y="65" width="80" height="8" rx="4" fill="#D1FAE5" />
                    <rect x="40" y="85" width="60" height="8" rx="4" fill="#D1FAE5" />
                    <circle cx="140" cy="90" r="24" fill="#10B981" />
                    <path d="M134 90L138 94L146 86" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>Belum Ada Data Feedback Teranalisis</h2>
                  <p style={{ fontSize: 14, color: '#6B7280', maxWidth: 440, lineHeight: 1.6, margin: '0 0 24px' }}>
                    Dashboard Anda saat ini kosong karena belum ada transaksi atau feedback yang diunggah. Unggah file CSV dataset feedback pelanggan Anda untuk memulai analisis AI secara real-time.
                  </p>
                  
                  <button
                    className="btn btn-primary"
                    onClick={() => setTab('upload')}
                    style={{
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      border: 'none', color: '#FFFFFF', padding: '12px 24px',
                      borderRadius: 10, fontSize: 13.5, fontWeight: 700,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                      boxShadow: '0 4px 14px rgba(16,185,129,0.3)', transition: 'transform 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Upload size={16} /> Upload CSV Pertama Kamu
                  </button>
                </div>
              ) : (
                <div>
                  {/* 1. Stat Cards */}
                  <StatsCards data={activeAnalytics} />

                  {/* 2. Charts Row 1: Donut & Bar Charts */}
                  <div className="charts-grid">
                    <SentimentChart data={activeAnalytics.sentimentBreakdown} />
                    <RatingDistributionChart data={activeAnalytics.ratingDistribution} />
                  </div>

                {/* 3. Charts Row 2: Trend Chart & Topic Cloud */}
                <div className="charts-grid">
                  <TrendChart data={activeAnalytics.recentTrend} />
                  <TopicCloud data={activeAnalytics.topTopics} />
                </div>

                {/* 4. Enhanced Sections Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: 16,
                  marginTop: 16
                }}>
                  {/* AI Summary Card */}
                  <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ background: '#EEF2FF', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={16} color="#4F46E5" />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>AI Sentiment Executive Summary</span>
                    </div>
                    <p style={{ fontSize: 13.5, color: '#4B5563', lineHeight: 1.6, margin: 0, fontStyle: 'italic', background: '#F9FAFB', padding: 14, borderRadius: 10, borderLeft: '3px solid #4F46E5' }}>
                      "{dataMode === 'demo' ? mockAnalytics.aiSummary : 'AI is processing sentiment patterns. Upload more feedback to generate deep business insight reports.'}"
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#9CA3AF', fontWeight: 500 }}>
                      <Activity size={12} color="#10B981" />
                      <span>Updated real-time by SentiView Engine</span>
                    </div>
                  </div>

                  {/* NPS & Response Rate Score Card */}
                  <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ background: '#FFFBEB', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Star size={16} color="#D97706" />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Loyalty Metrics & Performance</span>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1 }}>
                      <div style={{ background: '#FDF2F8', border: '1px solid #FCE7F3', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#DB2777', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Promoter Score</span>
                        <span style={{ fontSize: 26, fontWeight: 800, color: '#DB2777', marginTop: 4 }}>
                          {dataMode === 'demo' ? `+${mockAnalytics.npsScore}` : '+12'}
                        </span>
                        <span style={{ fontSize: 10.5, color: '#F472B6', fontWeight: 500, marginTop: 2 }}>Excellent loyalty level</span>
                      </div>

                      <div style={{ background: '#ECFDF5', border: '1px solid #D1FAE5', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Response Rate</span>
                        <span style={{ fontSize: 26, fontWeight: 800, color: '#059669', marginTop: 4 }}>
                          {dataMode === 'demo' ? `${mockAnalytics.responseRate}%` : '88%'}
                        </span>
                        <span style={{ fontSize: 10.5, color: '#34D399', fontWeight: 500, marginTop: 2 }}>Active SLA coverage</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Keywords Pill tags Card */}
                  <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ background: '#ECFDF5', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertCircle size={16} color="#059669" />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Top Keywords Extracted</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignContent: 'center', flex: 1 }}>
                      {(dataMode === 'demo' ? mockAnalytics.topKeywords : [
                        { text: 'delivery', count: 5 },
                        { text: 'app bug', count: 3 },
                        { text: 'quality', count: 2 }
                      ]).map((item, index) => (
                        <div key={item.text} style={{
                          background: index === 0 ? '#ECFDF5' : '#F3F4F6',
                          color: index === 0 ? '#059669' : '#374151',
                          border: index === 0 ? '1px solid #A7F3D0' : '1px solid #E5E7EB',
                          padding: '6px 12px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}>
                          <span>#{item.text}</span>
                          <span style={{
                            background: index === 0 ? '#10B981' : '#D1D5DB',
                            color: '#FFFFFF',
                            fontSize: 9.5,
                            fontWeight: 800,
                            padding: '1.5px 5px',
                            borderRadius: 4
                          }}>{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Feedback Feed Widget */}
                <div className="chart-card" style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ background: '#EFF6FF', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageSquare size={16} color="#2563EB" />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Recent Customer Feed</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {activeFeedList.map(item => (
                      <div key={item.id} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: '12px 14px',
                        background: '#F9FAFB',
                        border: '1.5px solid #E5E7EB',
                        borderRadius: 10,
                        transition: 'border-color 0.15s'
                      }}>
                        <div style={{
                          width: 32, height: 32,
                          borderRadius: 8,
                          background: item.sentiment === 'positive' ? '#ECFDF5' : item.sentiment === 'negative' ? '#FEF2F2' : '#F3F4F6',
                          color: item.sentiment === 'positive' ? '#059669' : item.sentiment === 'negative' ? '#DC2626' : '#4B5563',
                          fontSize: 13, fontWeight: 800,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {item.customerName?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{item.customerName}</span>
                            <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                              {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          <p style={{ fontSize: 12.5, color: '#4B5563', margin: '4px 0 0', lineHeight: 1.5, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            "{item.feedback}"
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                          <span style={{ fontSize: 11, color: '#F59E0B', letterSpacing: 0.5 }}>
                            {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                          </span>
                          <span style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 99,
                            background: item.sentiment === 'positive' ? '#DCFCE7' : item.sentiment === 'negative' ? '#FEE2E2' : '#F3F4F6',
                            color: item.sentiment === 'positive' ? '#15803D' : item.sentiment === 'negative' ? '#DC2626' : '#4B5563',
                          }}>
                            {item.sentiment}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          )}

            {/* UPLOAD */}
            {tab === 'upload' && (
              <div>
                {analytics && <StatsCards data={analytics} />}
                <div style={{ marginTop: 20 }}>
                  <CsvUpload onComplete={handleUploadComplete} />
                </div>
                <ImportHistoryTable
                  refreshTrigger={refreshTrigger}
                  onBatchDeleted={() => { loadFeedback(1); loadAnalytics(); }}
                />
              </div>
            )}

            {/* FEEDBACK */}
            {tab === 'feedback' && (
              <FeedbackTable
                feedbackList={feedbackList}
                total={feedbackTotal}
                page={page}
                onPageChange={(p) => loadFeedback(p)}
                onRefresh={() => loadFeedback(page)}
              />
            )}

            {/* INSIGHTS */}
            {tab === 'insights' && (
              <InsightsList
                insights={insights}
                onGenerate={handleGenerateInsights}
                loading={insightsLoading}
                topicBreakdown={activeAnalytics.topicBreakdown}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
