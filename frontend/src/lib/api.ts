const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface Feedback {
  id: string;
  customerName: string;
  rating: number;
  feedback: string;
  sentiment: string | null;
  confidence: number | null;
  confidenceScore: number | null;
  topics: string[];
  summary: string | null;
  createdAt: string;
  version: number;
}

export interface AiInsight {
  id?: string;
  type: string;
  title: string;
  summary: string;
  rootCauses: string[];
  businessImpact: string[];
  recommendations: string[];
  severity: string;
  confidenceScore: number;
  relatedTopics: string[];
  trend: string;
  // legacy fields (backwards compat)
  content?: string;
  description?: string;
  data?: Record<string, any>;
  generatedAt?: string;
  createdAt?: string;
}


export interface AnalyticsData {
  totalFeedback: number;
  averageRating: number;
  averageConfidence?: number;
  sentimentBreakdown: { positive: number; negative: number; neutral: number };
  sentimentDistribution: { positive: number; negative: number; neutral: number };
  topTopics: { topic: string; count: number }[];
  topicBreakdown: { name: string; value: number }[];
  ratingDistribution: { rating: number; count: number }[];
  recentTrend: { date: string; positive: number; negative: number; neutral: number }[];
  trendChart: { date: string; positive: number; negative: number; neutral: number }[];
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sentiview_token') : null;
  
  const headers: Record<string, string> = {
    ...options?.headers as Record<string, string>,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sentiview_token');
      window.location.href = '/login';
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `API error ${res.status}`);
  }
  return res.json();
}

export interface ImportBatch {
  id: string;
  fileName: string;
  importedCount: number;
  status: string;
  createdAt: string;
}

export const api = {
  // Import History
  getImportBatches: () => request<ImportBatch[]>('/api/feedback/batches'),
  deleteImportBatch: (id: string) => request<{ success: boolean }>(`/api/feedback/batches/${id}`, { method: 'DELETE' }),

  // Feedback
  getFeedback: (page = 1, limit = 20) =>
    request<{ items: Feedback[]; data: Feedback[]; total: number; page: number; limit: number; totalPages: number }>(
      `/api/feedback?page=${page}&limit=${limit}`,
    ),

  uploadCsv: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ message: string; count?: number; totalImported?: number }>('/api/feedback/upload', {
      method: 'POST',
      body: form,
    });
  },

  updateFeedback: (id: string, data: { customerName?: string; rating?: number; feedback?: string; version: number }) =>
    request<Feedback>(`/api/feedback/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  deleteFeedback: (id: string) =>
    request<void>(`/api/feedback/${id}`, { method: 'DELETE' }),

  simulateFeedback: () =>
    request<{ message: string }>('/api/feedback/simulate', { method: 'POST' }),

  // Analytics
  getAnalytics: () => request<AnalyticsData>('/api/analytics/overview'),

  // Insights
  getInsights: () => request<AiInsight[]>('/api/analytics/insights'),

  generateInsights: () =>
    request<{ message: string }>('/api/analytics/insights/generate', { method: 'POST' }),
};
