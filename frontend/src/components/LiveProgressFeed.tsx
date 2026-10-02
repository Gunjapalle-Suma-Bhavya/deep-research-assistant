import React, { useState, useRef, useEffect } from 'react';
import { Terminal, ArrowDownCircle, XCircle } from 'lucide-react';
import { AgentLogEntry } from '../types';

interface LiveProgressFeedProps {
  progressPercentage: number;
  logs: AgentLogEntry[];
  onCancel: () => void;
  isCompleted: boolean;
}

export const LiveProgressFeed: React.FC<LiveProgressFeedProps> = ({
  progressPercentage,
  logs,
  onCancel,
  isCompleted,
}) => {
  const [filter, setFilter] = useState<'all' | 'search' | 'info' | 'error'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    if (filter === 'search') return log.level === 'search' || log.agent === 'researcher';
    if (filter === 'error') return log.level === 'error' || log.level === 'warn';
    return log.level === 'info' || log.agent === 'scoper' || log.agent === 'synthesizer';
  });

  return (
    <div className="bg-panel border border-edge rounded-[2px] overflow-hidden shadow-subtle">
      {/* Top Bar with Progress */}
      <div className="p-4 sm:p-5 border-b border-edge bg-cream flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <div className="flex items-center justify-between text-xs font-mono text-muted mb-1.5">
            <span>Synthesis Progress</span>
            <span className="font-bold text-forest">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-panel rounded-[2px] h-1.5 overflow-hidden border border-edge">
            <div
              className="bg-forest h-full rounded-[2px] transition-all duration-500 ease-out"
              style={{ width: `${Math.max(5, Math.min(100, progressPercentage))}%` }}
            />
          </div>
        </div>

        {!isCompleted && (
          <button
            onClick={onCancel}
            type="button"
            className="px-3 py-1.5 rounded-[2px] bg-panel hover:bg-cream text-rose-800 border border-edge text-xs font-serif font-bold transition flex items-center space-x-1.5 self-start sm:self-auto shadow-subtle cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Abort Run</span>
          </button>
        )}
      </div>

      {/* Terminal Filter Toolbar */}
      <div className="px-4 py-2.5 bg-panel border-b border-edge flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-muted" />
          <span className="text-ink font-medium">Agent Activity Despatch</span>
          <span className="text-[10px] text-muted bg-cream px-1.5 py-0.2 rounded-[2px] border border-edge">
            {logs.length} events
          </span>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-0.5 rounded-[2px] text-[11px] font-mono transition border ${
              filter === 'all'
                ? 'bg-forest text-cream border-forest font-bold'
                : 'bg-cream text-muted border-edge hover:text-ink'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('search')}
            className={`px-2 py-0.5 rounded-[2px] text-[11px] font-mono transition border ${
              filter === 'search'
                ? 'bg-forest text-cream border-forest font-bold'
                : 'bg-cream text-muted border-edge hover:text-ink'
            }`}
          >
            Searches
          </button>
          <button
            onClick={() => setFilter('error')}
            className={`px-2 py-0.5 rounded-[2px] text-[11px] font-mono transition border ${
              filter === 'error'
                ? 'bg-rose-800 text-cream border-rose-800 font-bold'
                : 'bg-cream text-muted border-edge hover:text-ink'
            }`}
          >
            Alerts
          </button>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1 rounded-[2px] text-muted hover:text-ink ml-2 transition ${
              autoScroll ? 'text-forest' : 'opacity-40'
            }`}
            title={autoScroll ? 'Auto-scroll enabled' : 'Auto-scroll disabled'}
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output Console */}
      <div
        ref={scrollRef}
        className="p-4 bg-cream font-mono text-xs max-h-72 overflow-y-auto space-y-2 select-text"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-muted italic py-4 text-center font-body text-sm">
            Awaiting streaming events from LangGraph state engine...
          </div>
        ) : (
          filteredLogs.map((log, idx) => {
            const isSearch = log.level === 'search' || log.agent === 'researcher';
            const isError = log.level === 'error';
            const isSuccess = log.level === 'success';

            return (
              <div key={idx} className="flex items-start space-x-2 text-[11px] leading-relaxed border-b border-edge/40 pb-1.5 last:border-0">
                <span className="text-muted shrink-0 select-none">
                  {log.timestamp ? log.timestamp.split('T')[1]?.slice(0, 8) : '--:--:--'}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded-[2px] text-[9px] uppercase tracking-wider shrink-0 select-none font-bold border ${
                    isError
                      ? 'bg-rose-100 text-rose-900 border-rose-300'
                      : isSearch
                      ? 'bg-panel text-forest border-forest/40'
                      : isSuccess
                      ? 'bg-panel text-forest border-forest'
                      : 'bg-panel text-muted border-edge'
                  }`}
                >
                  {log.agent}
                </span>
                <span
                  className={`break-all ${
                    isError
                      ? 'text-rose-800 font-semibold'
                      : isSearch
                      ? 'text-forest'
                      : isSuccess
                      ? 'text-ink font-medium'
                      : 'text-ink'
                  }`}
                >
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
