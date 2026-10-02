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
    if (state === 'completed') return <CheckCircle2 className="w-3.5 h-3.5 text-forest" />;
    if (state === 'active') return <Loader2 className="w-3.5 h-3.5 text-forest animate-spin" />;
    if (state === 'error') return <AlertCircle className="w-3.5 h-3.5 text-rose-700" />;
    return <Clock className="w-3.5 h-3.5 text-muted" />;
  };

  const getBorderClass = (state: string) => {
    if (state === 'active') return 'border-forest bg-cream shadow-subtle ring-1 ring-forest';
    if (state === 'completed') return 'border-edge bg-cream text-ink';
    if (state === 'error') return 'border-rose-400 bg-rose-50 text-rose-900';
    return 'border-edge bg-panel opacity-80';
  };

  return (
    <div className="bg-panel border border-edge rounded-[2px] p-5 sm:p-6 mb-6 shadow-subtle">
      {/* Schematic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-5 border-b border-edge gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-[2px] bg-forest" />
          <h3 className="font-serif font-bold text-base tracking-tight text-ink">
            Multi-Agent State Machine (LangGraph Orchestration)
          </h3>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono text-muted">
          <span className="bg-cream px-2.5 py-1 rounded-[2px] border border-edge">
            Sources Analyzed: <strong className="text-forest font-semibold">{sourcesCount}</strong>
          </span>
          <span className="bg-cream px-2.5 py-1 rounded-[2px] border border-edge">
            Subtopics: <strong className="text-forest font-semibold">{subtopics.length}</strong>
          </span>
        </div>
      </div>

      {/* DAG Node Graph */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
        {/* Node 1: Scope */}
        <div className={`flex flex-col p-3 rounded-[2px] border transition-all ${getBorderClass(scoperState)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-6 h-6 rounded-[2px] bg-panel border border-edge flex items-center justify-center text-forest">
              <Target className="w-3.5 h-3.5" />
            </div>
            {renderBadge(scoperState)}
          </div>
          <div className="font-serif text-xs font-bold text-ink">Scoper Agent</div>
          <div className="text-[11px] text-muted font-body mt-0.5">Hypothesis & intent</div>
        </div>

        {/* Node 2: Planner */}
        <div className={`flex flex-col p-3 rounded-[2px] border transition-all ${getBorderClass(plannerState)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-6 h-6 rounded-[2px] bg-panel border border-edge flex items-center justify-center text-forest">
              <Split className="w-3.5 h-3.5" />
            </div>
            {renderBadge(plannerState)}
          </div>
          <div className="font-serif text-xs font-bold text-ink">Topic Planner</div>
          <div className="text-[11px] text-muted font-body mt-0.5">Parallel brief matrix</div>
        </div>

        {/* Node 3: Parallel Workers */}
        <div className={`flex flex-col p-3 rounded-[2px] border transition-all ${getBorderClass(researcherState)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-6 h-6 rounded-[2px] bg-panel border border-edge flex items-center justify-center text-forest">
              <Search className="w-3.5 h-3.5" />
            </div>
            {renderBadge(researcherState)}
          </div>
          <div className="font-serif text-xs font-bold text-ink">Parallel Workers</div>
          <div className="text-[11px] text-muted font-body mt-0.5">
            {subtopics.length > 0 ? `${subtopics.length} concurrent probes` : 'Live web scrapers'}
          </div>
        </div>

        {/* Node 4: Synthesizer */}
        <div className={`flex flex-col p-3 rounded-[2px] border transition-all ${getBorderClass(synthesizerState)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-6 h-6 rounded-[2px] bg-panel border border-edge flex items-center justify-center text-forest">
              <Brain className="w-3.5 h-3.5" />
            </div>
            {renderBadge(synthesizerState)}
          </div>
          <div className="font-serif text-xs font-bold text-ink">Synthesizer</div>
          <div className="text-[11px] text-muted font-body mt-0.5">Fact verification</div>
        </div>

        {/* Node 5: Publication */}
        <div className={`flex flex-col p-3 rounded-[2px] border transition-all ${getBorderClass(reportState)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-6 h-6 rounded-[2px] bg-panel border border-edge flex items-center justify-center text-forest">
              <FileCheck className="w-3.5 h-3.5" />
            </div>
            {renderBadge(reportState)}
          </div>
          <div className="font-serif text-xs font-bold text-ink">Final Monograph</div>
          <div className="text-[11px] text-muted font-body mt-0.5">Manuscript & audio</div>
        </div>
      </div>

      {/* Parallel Subtopics Grid (when available) */}
      {subtopics.length > 0 && (
        <div className="mt-4 pt-4 border-t border-edge">
          <div className="text-xs font-semibold text-muted mb-2.5 font-mono uppercase tracking-wider">
            Investigative Threads in Progress
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {subtopics.map((st, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-[2px] bg-cream border border-edge text-xs flex items-center justify-between shadow-subtle"
              >
                <div className="truncate pr-2">
                  <span className="font-serif font-bold text-ink block truncate">{st.name}</span>
                  <span className="text-[11px] text-muted font-body block truncate">{st.focus}</span>
                </div>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded-[2px] border ${
                    st.status === 'completed'
                      ? 'bg-panel text-forest border-edge'
                      : 'bg-panel text-forest border-forest animate-editorial-pulse'
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
        <div className="mt-4 flex items-center space-x-2 text-xs text-ink bg-cream px-3.5 py-2.5 rounded-[2px] border border-edge shadow-subtle">
          <Loader2 className="w-3.5 h-3.5 text-forest animate-spin shrink-0" />
          <span className="font-mono text-muted">Current Procedure:</span>
          <span className="font-body font-medium text-ink truncate">{currentStepDescription}</span>
        </div>
      )}
    </div>
  );
};
