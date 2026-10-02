/**
 * Core TypeScript types for Deep Research Multi-Agent Assistant
 */

export type ResearchDepth = 'quick' | 'standard' | 'comprehensive';

export type TaskStatus = 
  | 'idle'
  | 'scoping'
  | 'awaiting_clarification'
  | 'planning'
  | 'researching'
  | 'synthesizing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ResearchBriefSubtopic {
  name: string;
  focus: string;
  key_questions?: string[];
  status?: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface ResearchBrief {
  title: string;
  core_question: string;
  scope_description: string;
  subtopics: ResearchBriefSubtopic[];
  estimated_searches?: number;
}

export interface ClarificationQuestion {
  id?: string;
  question: string;
  context?: string;
  options?: string[];
}

export interface ClarificationData {
  reason: string;
  questions: ClarificationQuestion[];
}

export interface CitationSource {
  id?: string;
  index?: number;
  url: string;
  title: string;
  snippet?: string;
  score?: number;
  subtopic?: string;
}

export interface FinalReport {
  title: string;
  executive_summary?: string;
  full_markdown: string;
  subtopics_covered?: string[];
  total_sources_cited?: number;
  word_count?: number;
}

export interface AgentLogEntry {
  id: string;
  timestamp: string;
  agent: 'system' | 'scoper' | 'researcher' | 'synthesizer' | 'audio';
  level: 'info' | 'search' | 'success' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, any>;
}

export interface ResearchTaskDetail {
  task_id: string;
  query: string;
  depth: ResearchDepth;
  status: TaskStatus;
  progress_percentage: number;
  current_step_description: string;
  research_brief?: ResearchBrief;
  clarification_needed?: boolean;
  clarification_data?: ClarificationData;
  sources: CitationSource[];
  logs: AgentLogEntry[];
  final_report?: FinalReport;
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface ResearchTaskSummary {
  task_id: string;
  query: string;
  title: string;
  status: TaskStatus;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface SystemConfig {
  openai_configured: boolean;
  openai_masked_key?: string;
  openai_base_url: string;
  openai_model: string;
  tavily_configured: boolean;
  tavily_masked_key?: string;
  search_provider: string;
  demo_mode: boolean;
}

export interface ConnectionTestResult {
  llm_connected: boolean;
  llm_message: string;
  llm_latency_ms?: number;
  search_connected: boolean;
  search_message: string;
  search_latency_ms?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  auth_provider?: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export type ViewRoute = 'landing' | 'desk' | 'login' | 'signup';

