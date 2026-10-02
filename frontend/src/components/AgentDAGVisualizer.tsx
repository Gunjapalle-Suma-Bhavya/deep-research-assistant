import React from 'react';
import { Target, Split, Search, Brain, FileCheck, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { TaskStatus, ResearchBriefSubtopic } from '../types';

interface AgentDAGVisualizerProps {
  status: TaskStatus;
  subtopics?: ResearchBriefSubtopic[];
  sourcesCount: number;
  currentStepDescription?: string;
}

export const AgentDAGVisualizer: React.FC<AgentDAGVisualizerProps> = ({
  status,
  subtopics = [],
  sourcesCount,
  currentStepDescription,
}) => {
  // Determine states for each pipeline stage
  const getStageState = (stage: 'scoping' | 'planning' | 'researching' | 'synthesizing' | 'completed') => {
    const order = ['scoping', 'planning', 'researching', 'synthesizing', 'completed'];
    const currentIndex = order.indexOf(
      status === 'awaiting_clarification' ? 'scoping' :
      status === 'failed' || status === 'cancelled' ? 'researching' :
      status === 'idle' ? 'scoping' : status
    );
    const stageIndex = order.indexOf(stage);

    if (status === 'completed') return 'completed';
    if (status === 'failed') return stageIndex === currentIndex ? 'error' : stageIndex < currentIndex ? 'completed' : 'pending';
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'active';
    return 'pending';
  };

  const scoperState = getStageState('scoping');
  const plannerState = getStageState('planning');
  const researcherState = getStageState('researching');
  const synthesizerState = getStageState('synthesizing');
  const reportState = getStageState('completed');

  const renderBadge = (state: string) => {
    if (state === 'completed') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    if (state === 'active') return <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />;
    if (state === 'error') return <AlertCircle className="w-3.5 h-3.5 text-rose-400" />;
    return <Clock className="w-3.5 h-3.5 text-slate-600" />;
  };

  const getBorderClass = (state: string) => {
    if (state === 'active') return 'border-blue-500 bg-blue-950/40 shadow-md shadow-blue-500/20';
    if (state === 'completed') return 'border-emerald-600/60 bg-emerald-950/20';
    if (state === 'error') return 'border-rose-600/60 bg-rose-950/20';
    return 'border-slate-800 bg-slate-900/40 opacity-70';
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-800/80 gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <h3 className="text-sm font-bold tracking-tight text-slate-200">
            Multi-Agent Execution Pipeline (LangGraph DAG)
          </h3>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono text-slate-400">
          <span className="bg-slate-800/80 px-2 py-1 rounded border border-slate-700/60">
            Sources: <strong className="text-blue-400">{sourcesCount}</strong>
          </span>
          <span className="bg-slate-800/80 px-2 py-1 rounded border border-slate-700/60">
            Subtopics: <strong className="text-emerald-400">{subtopics.length}</strong>
          </span>
        </div>
      </div>

      {/* DAG Node Graph */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
        {/* Node 1: Scope & Hypothesis */}
        <div className={`flex flex-col p-3 rounded-xl border transition-all ${getBorderClass(scoperState)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-7 h-7 rounded-lg bg-slate-800/80 flex items-center justify-center text-blue-400">
              <Target className="w-4 h-4" />
            </div>
            {renderBadge(scoperState)}
          </div>
          <div className="text-xs font-bold text-slate-200">Scoper Agent</div>
          <div className="text-[11px] text-slate-400 mt-1">Intent & clarity check</div>
        </div>

        {/* Node 2: Multi-Topic Planner */}
        <div className={`flex flex-col p-3 rounded-xl border transition-all ${getBorderClass(plannerState)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-7 h-7 rounded-lg bg-slate-800/80 flex items-center justify-center text-indigo-400">
              <Split className="w-4 h-4" />
            </div>
            {renderBadge(plannerState)}
          </div>
          <div className="text-xs font-bold text-slate-200">Topic Planner</div>
          <div className="text-[11px] text-slate-400 mt-1">Parallel brief creation</div>
        </div>

        {/* Node 3: Parallel Web Researchers */}
        <div className={`flex flex-col p-3 rounded-xl border transition-all ${getBorderClass(researcherState)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-7 h-7 rounded-lg bg-slate-800/80 flex items-center justify-center text-cyan-400">
              <Search className="w-4 h-4" />
            </div>
            {renderBadge(researcherState)}
          </div>
          <div className="text-xs font-bold text-slate-200">Parallel Workers</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {subtopics.length > 0 ? `${subtopics.length} web probes active` : 'Concurrent search engines'}
          </div>
        </div>

        {/* Node 4: Fact Synthesizer */}
        <div className={`flex flex-col p-3 rounded-xl border transition-all ${getBorderClass(synthesizerState)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-7 h-7 rounded-lg bg-slate-800/80 flex items-center justify-center text-purple-400">
              <Brain className="w-4 h-4" />
            </div>
            {renderBadge(synthesizerState)}
          </div>
          <div className="text-xs font-bold text-slate-200">Synthesizer</div>
          <div className="text-[11px] text-slate-400 mt-1">Cross-reference & verify</div>
        </div>

        {/* Node 5: Report Generator */}
        <div className={`flex flex-col p-3 rounded-xl border transition-all ${getBorderClass(reportState)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-7 h-7 rounded-lg bg-slate-800/80 flex items-center justify-center text-emerald-400">
              <FileCheck className="w-4 h-4" />
            </div>
            {renderBadge(reportState)}
          </div>
          <div className="text-xs font-bold text-slate-200">Final Briefing</div>
          <div className="text-[11px] text-slate-400 mt-1">Citations & audio brief</div>
        </div>
      </div>

      {/* Parallel Subtopics Grid (when available) */}
      {subtopics.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <div className="text-xs font-semibold text-slate-400 mb-2 font-mono uppercase tracking-wider">
            Active Subtopic Investigations
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {subtopics.map((st, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs flex items-center justify-between"
              >
                <div className="truncate pr-2">
                  <span className="font-semibold text-slate-200 block truncate">{st.name}</span>
                  <span className="text-[10px] text-slate-500 block truncate">{st.focus}</span>
                </div>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    st.status === 'completed'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-blue-950 text-blue-400 border border-blue-800 animate-pulse'
                  }`}
                >
                  {st.status || 'investigating'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Step Description Banner */}
      {currentStepDescription && (
        <div className="mt-4 flex items-center space-x-2 text-xs text-slate-300 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800">
          <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
          <span className="font-mono text-slate-400">Current Action:</span>
          <span className="font-medium text-slate-200 truncate">{currentStepDescription}</span>
        </div>
      )}
    </div>
  );
};
