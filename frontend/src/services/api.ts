/**
 * Type-safe API Client for Deep Research Assistant
 */

import {
  SystemConfig,
  ConnectionTestResult,
  ResearchTaskDetail,
  SharedMonographResponse,
  ChatMessage,
  ReportChatResponse,
  ResearchTaskSummary,
  ResearchDepth,
  ResearchMode,
} from '../types';

const API_BASE = '/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem('dr_token');
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore json parse error
    }
    throw new ApiError(response.status, errorDetail);
  }

  return response.json();
}

export const api = {
  // Authentication & Profile
  signup: (data: { name: string; email: string; password: string }) =>
    request<{ access_token: string; token_type: string; user: any }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ access_token: string; token_type: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  googleAuth: (data: { credential?: string; email?: string; name?: string; picture?: string }) =>
    request<{ access_token: string; token_type: string; user: any }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => request<any>('/auth/me'),
  getAuthStatus: () =>
    request<{
      mongodb_connected: boolean;
      database_name: string;
      google_auth_configured: boolean;
      google_client_id: string;
    }>('/auth/status'),

  // Config & Diagnostics
  getConfig: () => request<SystemConfig>('/config'),
  
  updateConfig: (config: Partial<{
    openai_api_key?: string;
    openai_base_url?: string;
    openai_model?: string;
    tavily_api_key?: string;
    search_provider?: string;
    demo_mode?: boolean;
  }>) => request<SystemConfig>('/config', {
    method: 'POST',
    body: JSON.stringify(config),
  }),

  testConnection: (data: {
    openai_api_key?: string;
    openai_base_url?: string;
    openai_model?: string;
    tavily_api_key?: string;
  }) => request<ConnectionTestResult>('/config/test', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Research Lifecycle
  startResearch: (payload: {
    query: string;
    depth: ResearchDepth;
    mode?: ResearchMode;
    custom_instructions?: string;
  }) => request<{ success: boolean; task_id: string; status: string; message: string }>('/research/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  submitClarification: (payload: {
    task_id: string;
    responses: Record<string, string>;
    additional_notes?: string;
  }) => request<{ success: boolean; task_id: string; status: string; message: string }>('/research/clarify', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  getTaskStatus: (taskId: string) => request<ResearchTaskDetail>(`/research/status/${taskId}`),

  cancelTask: (taskId: string) => request<{ success: boolean; task_id: string; message: string }>(`/research/${taskId}/cancel`, {
    method: 'POST',
  }),

  // Audio briefing
  generateAudioBriefing: async (taskId: string): Promise<Blob> => {
    const res = await fetch(`${API_BASE}/research/${taskId}/audio`, {
      method: 'POST',
    });
    if (!res.ok) {
      let msg = 'Failed to generate audio';
      try {
        const j = await res.json();
        if (j.detail) msg = j.detail;
      } catch {
        // ignore
      }
      throw new ApiError(res.status, msg);
    }
    return res.blob();
  },

  // Export URLs
  getExportUrl: (taskId: string, format: 'md' | 'html' | 'json' | 'docx' | 'bib') =>
    `${API_BASE}/research/${taskId}/export/${format}`,

  // Public Sharing
  createShareLink: (taskId: string) =>
    request<{ success: boolean; task_id: string; share_token: string; is_shared: boolean }>(`/research/${taskId}/share`, {
      method: 'POST',
    }),

  getSharedMonograph: (shareToken: string) =>
    request<SharedMonographResponse>(`/research/shared/${shareToken}`),

  // Monograph Chat Q&A
  getReportChatHistory: (taskId: string) =>
    request<{ task_id: string; history: ChatMessage[] }>(`/research/${taskId}/chat`),

  sendReportChatMessage: (taskId: string, message: string, history: ChatMessage[] = []) =>
    request<ReportChatResponse>(`/research/${taskId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),

  // History
  getHistory: () => request<ResearchTaskSummary[]>('/research/history'),

  clearHistory: () => request<{ success: boolean; count: number; message: string }>('/research/history/clear', {
    method: 'DELETE',
  }),

  deleteTask: (taskId: string) => request<{ success: boolean; message: string }>(`/research/${taskId}`, {
    method: 'DELETE',
  }),
};
