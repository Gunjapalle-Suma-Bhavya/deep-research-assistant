import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
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
} from './types';

export const App: React.FC = () => {
  // Theme state
  const [isDark, setIsDark] = useState(true);

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

  // Initialize System on mount
  useEffect(() => {
    loadConfig();
    loadHistory();
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

  const handleToggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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

      // Set initial local state
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
            message: `Research initialized: "${query}" (Depth: ${depth})`,
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Connect SSE Stream
      connectStream(taskId);
      loadHistory();
    } catch (err: any) {
      alert(`Could not start research: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Connect Server-Sent Events stream
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

  // Submit clarification answers
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

  // Cancel research
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

  // Load existing task from history
  const handleSelectHistoryTask = async (taskId: string) => {
    try {
      setIsHistoryOpen(false);
      setIsLoading(true);
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
    <div className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        config={config}
        historyCount={historyList.length}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onReset={handleReset}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!activeTaskId || !taskDetail ? (
          <ResearchInputView onStartResearch={handleStartResearch} isLoading={isLoading} />
        ) : (
          <div className="space-y-6 animate-fadeIn">
            {/* Header Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  Task ID: {activeTaskId}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
                  {taskDetail.query}
                </h2>
              </div>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 self-start sm:self-auto transition cursor-pointer"
              >
                ← New Research
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

      {/* Clarification Modal (Human-in-the-loop) */}
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
