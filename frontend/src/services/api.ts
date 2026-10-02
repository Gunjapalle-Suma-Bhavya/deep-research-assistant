/**
 * Type-safe API Client for Deep Research Assistant
 */

import {
  SystemConfig,
  ConnectionTestResult,
  ResearchTaskDetail,
  ResearchTaskSummary,
  ResearchDepth,
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
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
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
  getExportUrl: (taskId: string, format: 'md' | 'html' | 'json') =>
    `${API_BASE}/research/${taskId}/export/${format}`,

  // History
  getHistory: () => request<ResearchTaskSummary[]>('/research/history'),

  clearHistory: () => request<{ success: boolean; count: number; message: string }>('/research/history/clear', {
    method: 'DELETE',
  }),

  deleteTask: (taskId: string) => request<{ success: boolean; message: string }>(`/research/${taskId}`, {
    method: 'DELETE',
  }),
};
