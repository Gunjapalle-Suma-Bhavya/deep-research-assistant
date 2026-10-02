import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { AuthView } from './components/AuthView';
import { ResearchInputView } from './components/ResearchInputView';
import { AgentDAGVisualizer } from './components/AgentDAGVisualizer';
import { LiveProgressFeed } from './components/LiveProgressFeed';
import { ClarificationModal } from './components/ClarificationModal';
import { ReportViewer } from './components/ReportViewer';
import { CitationInspector } from './components/CitationInspector';
import { SettingsModal } from './components/SettingsModal';
import { HistoryDrawer } from './components/HistoryDrawer';

import { api } from './services/api';
import { ResearchStreamClient } from './services/sseClient';
import {
  SystemConfig,
  ResearchTaskDetail,
  ResearchTaskSummary,
  ResearchDepth,
  TaskStatus,
  User,
  ViewRoute,
} from './types';

export const App: React.FC = () => {
  // Navigation & Auth State
  const [currentRoute, setCurrentRoute] = useState<ViewRoute>('landing');
  const [user, setUser] = useState<User | null>(null);

  // System Configuration
  const [config, setConfig] = useState<SystemConfig | null>(null);

  // Research State
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [taskDetail, setTaskDetail] = useState<ResearchTaskDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamClient, setStreamClient] = useState<ResearchStreamClient | null>(null);

  // Modals & Drawers
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [selectedCitationIndex, setSelectedCitationIndex] = useState<number | null>(null);
  const [historyList, setHistoryList] = useState<ResearchTaskSummary[]>([]);

  useEffect(() => {
    loadConfig();
    loadHistory();
    checkCurrentUser();
  }, []);

  const loadConfig = async () => {
    try {
      const cfg = await api.getConfig();
      setConfig(cfg);
    } catch (e) {
      console.warn('Failed to load initial configuration:', e);
    }
  };

  const loadHistory = async () => {
    try {
      const hist = await api.getHistory();
      setHistoryList(hist);
    } catch (e) {
      console.warn('Failed to load history:', e);
    }
  };

  const checkCurrentUser = async () => {
    const token = localStorage.getItem('dr_token');
    if (!token) return;
    try {
      const profile = await api.getMe();
      setUser(profile);
    } catch (e) {
      localStorage.removeItem('dr_token');
    }
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setCurrentRoute('desk');
  };

  const handleSignOut = () => {
    localStorage.removeItem('dr_token');
    setUser(null);
    setCurrentRoute('landing');
  };

  // Start new research workflow
  const handleStartResearch = async (
    query: string,
    depth: ResearchDepth,
    customInstructions: string
  ) => {
    setIsLoading(true);
    try {
      const res = await api.startResearch({
        query,
        depth,
        custom_instructions: customInstructions || undefined,
      });

      const taskId = res.task_id;
      setActiveTaskId(taskId);

      setTaskDetail({
        task_id: taskId,
        query,
        depth,
        status: 'scoping',
        progress_percentage: 5,
        current_step_description: 'Initializing multi-agent graph and scoping topic...',
        sources: [],
        logs: [
          {
            id: '1',
            timestamp: new Date().toISOString(),
            agent: 'system',
            level: 'info',
            message: `Research inquiry initialized: "${query}" (Scope: ${depth})`,
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      connectStream(taskId);
      loadHistory();
    } catch (err: any) {
      alert(`Could not start research: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const connectStream = (taskId: string) => {
    if (streamClient) {
      streamClient.close();
    }

    const client = new ResearchStreamClient(taskId, {
      onStatusUpdate: (data) => {
        setTaskDetail((prev) =>
          prev
            ? {
                ...prev,
                status: data.status as TaskStatus,
                progress_percentage: data.progress,
                current_step_description: data.step,
              }
            : null
        );
      },
      onLog: (log) => {
        setTaskDetail((prev) =>
          prev
            ? {
                ...prev,
                logs: [...prev.logs, log],
              }
            : null
        );
      },
      onBrief: (brief) => {
        setTaskDetail((prev) =>
          prev
            ? {
                ...prev,
                research_brief: brief,
                status: 'planning',
              }
            : null
        );
      },
      onClarification: (clarification) => {
        setTaskDetail((prev) =>
          prev
            ? {
                ...prev,
                status: 'awaiting_clarification',
                clarification_needed: true,
                clarification_data: clarification,
              }
            : null
        );
      },
      onSubtopicUpdate: (subtopic) => {
        setTaskDetail((prev) => {
          if (!prev || !prev.research_brief) return prev;
          const updatedSubtopics = prev.research_brief.subtopics.map((st) =>
            st.name === subtopic.name ? { ...st, ...subtopic } : st
          );
          return {
            ...prev,
            research_brief: {
              ...prev.research_brief,
              subtopics: updatedSubtopics,
            },
          };
        });
      },
      onSourceAdded: (source) => {
        setTaskDetail((prev) => {
          if (!prev) return prev;
          const exists = prev.sources.some((s) => s.url === source.url);
          if (exists) return prev;
          return {
            ...prev,
            sources: [...prev.sources, source],
          };
        });
      },
      onReportChunk: (chunk) => {
        setTaskDetail((prev) => {
          if (!prev) return prev;
          const currentMarkdown = prev.final_report?.full_markdown || '';
          return {
            ...prev,
            status: 'synthesizing',
            final_report: {
              title: prev.final_report?.title || prev.research_brief?.title || prev.query,
              full_markdown: currentMarkdown + chunk,
            },
          };
        });
      },
      onComplete: (report) => {
        setTaskDetail((prev) =>
          prev
            ? {
                ...prev,
                status: 'completed',
                progress_percentage: 100,
                final_report: report,
              }
            : null
        );
        loadHistory();
      },
      onError: (errMsg) => {
        setTaskDetail((prev) =>
          prev
            ? {
                ...prev,
                status: 'failed',
                error: errMsg,
              }
            : null
        );
      },
    });

    client.connect();
    setStreamClient(client);
  };

  const handleClarificationSubmit = async (
    responses: Record<string, string>,
    additionalNotes: string
  ) => {
    if (!activeTaskId) return;
    setIsLoading(true);
    try {
      await api.submitClarification({
        task_id: activeTaskId,
        responses,
        additional_notes: additionalNotes,
      });

      setTaskDetail((prev) =>
        prev
          ? {
              ...prev,
              clarification_needed: false,
              status: 'researching',
            }
          : null
      );
    } catch (err: any) {
      alert(`Failed to submit clarification: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelResearch = async () => {
    if (!activeTaskId) return;
    try {
      await api.cancelTask(activeTaskId);
      if (streamClient) streamClient.close();
      setTaskDetail((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
      loadHistory();
    } catch (e: any) {
      alert(`Could not cancel task: ${e.message}`);
    }
  };

  const handleSelectHistoryTask = async (taskId: string) => {
    try {
      setIsHistoryOpen(false);
      setIsLoading(true);
      setCurrentRoute('desk');
      const detail = await api.getTaskStatus(taskId);
      setActiveTaskId(taskId);
      setTaskDetail(detail);

      if (detail.status !== 'completed' && detail.status !== 'failed' && detail.status !== 'cancelled') {
        connectStream(taskId);
      }
    } catch (e: any) {
      alert(`Could not load task: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHistoryTask = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      loadHistory();
      if (activeTaskId === taskId) {
        handleReset();
      }
    } catch (e: any) {
      alert(`Failed to delete session: ${e.message}`);
    }
  };

  const handleClearAllHistory = async () => {
    if (!confirm('Are you sure you want to delete all research sessions?')) return;
    try {
      await api.clearHistory();
      loadHistory();
      handleReset();
    } catch (e: any) {
      alert(`Failed to clear history: ${e.message}`);
    }
  };

  const handleReset = () => {
    if (streamClient) streamClient.close();
    setActiveTaskId(null);
    setTaskDetail(null);
  };

  const handleSelectCitation = (idx: number) => {
    setSelectedCitationIndex(idx);
    setIsSourcesOpen(true);
  };

  return (
    <div className="min-h-full flex flex-col bg-cream text-ink font-body">
      {/* Top Masthead */}
      <Navbar
        config={config}
        historyCount={historyList.length}
        user={user}
        currentRoute={currentRoute}
        onNavigate={setCurrentRoute}
        onSignOut={handleSignOut}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onReset={handleReset}
      />

      {/* Primary Content View Switcher */}
      {currentRoute === 'landing' ? (
        <LandingPage onNavigate={setCurrentRoute} isAuthenticated={!!user} />
      ) : currentRoute === 'login' ? (
        <AuthView initialMode="login" onAuthSuccess={handleAuthSuccess} onNavigate={setCurrentRoute} />
      ) : currentRoute === 'signup' ? (
        <AuthView initialMode="signup" onAuthSuccess={handleAuthSuccess} onNavigate={setCurrentRoute} />
      ) : (
        /* Research Desk Workspace */
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!activeTaskId || !taskDetail ? (
            <ResearchInputView onStartResearch={handleStartResearch} isLoading={isLoading} />
          ) : (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-edge gap-2">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
                    Investigation Reference: {activeTaskId}
                  </span>
                  <h2 className="text-xl sm:text-3xl font-serif font-bold text-ink mt-1">
                    {taskDetail.query}
                  </h2>
                </div>
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-[2px] bg-panel hover:bg-cream border border-edge text-xs font-serif font-bold text-ink self-start sm:self-auto transition cursor-pointer shadow-subtle"
                >
                  ← New Inquiry
                </button>
              </div>

              {/* Interactive Agent DAG Visualizer */}
              <AgentDAGVisualizer
                status={taskDetail.status}
                subtopics={taskDetail.research_brief?.subtopics}
                sourcesCount={taskDetail.sources.length}
                currentStepDescription={taskDetail.current_step_description}
              />

              {/* Live Progress Bar & Activity Logs (while research is executing) */}
              {taskDetail.status !== 'completed' && (
                <LiveProgressFeed
                  progressPercentage={taskDetail.progress_percentage}
                  logs={taskDetail.logs}
                  onCancel={handleCancelResearch}
                  isCompleted={false}
                />
              )}

              {/* Final Report (if completed or partially streamed) */}
              {taskDetail.final_report && (
                <ReportViewer
                  taskId={activeTaskId}
                  report={taskDetail.final_report}
                  sources={taskDetail.sources}
                  onOpenSourcesDrawer={() => {
                    setSelectedCitationIndex(null);
                    setIsSourcesOpen(true);
                  }}
                  onSelectCitation={handleSelectCitation}
                />
              )}
            </div>
          )}
        </main>
      )}

      {/* Clarification Modal */}
      {taskDetail?.clarification_needed && taskDetail?.clarification_data && (
        <ClarificationModal
          data={taskDetail.clarification_data}
          onSubmit={handleClarificationSubmit}
          isLoading={isLoading}
        />
      )}

      {/* Citation Inspector Side Drawer */}
      <CitationInspector
        sources={taskDetail?.sources || []}
        isOpen={isSourcesOpen}
        onClose={() => setIsSourcesOpen(false)}
        selectedCitationIndex={selectedCitationIndex}
      />

      {/* Settings Modal */}
      <SettingsModal
        config={config}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigSaved={(newCfg) => setConfig(newCfg)}
      />

      {/* History Drawer */}
      <HistoryDrawer
        history={historyList}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectTask={handleSelectHistoryTask}
        onDeleteTask={handleDeleteHistoryTask}
        onClearAll={handleClearAllHistory}
      />
    </div>
  );
};
