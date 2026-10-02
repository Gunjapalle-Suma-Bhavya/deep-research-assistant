import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Filter, ArrowDownCircle, XCircle, Search, Cpu, CheckCircle } from 'lucide-react';
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
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Top Bar with Progress */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
            <span>Overall Research Progress</span>
            <span className="font-bold text-blue-400">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.max(5, Math.min(100, progressPercentage))}%` }}
            />
          </div>
        </div>

        {!isCompleted && (
          <button
            onClick={onCancel}
            type="button"
            className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 text-xs font-medium transition flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancel Run</span>
          </button>
        )}
      </div>

      {/* Terminal Filter Toolbar */}
      <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400">Agent Activity Stream</span>
          <span className="text-[10px] text-slate-500 bg-slate-800/80 px-1.5 py-0.2 rounded">
            {logs.length} events
          </span>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-0.5 rounded text-[11px] transition ${
              filter === 'all' ? 'bg-blue-900 text-blue-200' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('search')}
            className={`px-2 py-0.5 rounded text-[11px] transition ${
              filter === 'search' ? 'bg-blue-900 text-blue-200' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Searches
          </button>
          <button
            onClick={() => setFilter('error')}
            className={`px-2 py-0.5 rounded text-[11px] transition ${
              filter === 'error' ? 'bg-rose-900 text-rose-200' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Alerts
          </button>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1 rounded text-slate-400 hover:text-slate-200 ml-2 transition ${
              autoScroll ? 'text-blue-400' : 'opacity-50'
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
        className="p-4 bg-slate-950 font-mono text-xs max-h-72 overflow-y-auto space-y-2 select-text"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-slate-600 italic py-4 text-center">
            Awaiting streaming events from LangGraph state engine...
          </div>
        ) : (
          filteredLogs.map((log, idx) => {
            const isSearch = log.level === 'search' || log.agent === 'researcher';
            const isError = log.level === 'error';
            const isSuccess = log.level === 'success';

            return (
              <div key={idx} className="flex items-start space-x-2 text-[11px] leading-relaxed">
                <span className="text-slate-600 shrink-0 select-none">
                  {log.timestamp ? log.timestamp.split('T')[1]?.slice(0, 8) : '--:--:--'}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] uppercase tracking-wider shrink-0 select-none font-bold ${
                    isError
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : isSearch
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                      : isSuccess
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {log.agent}
                </span>
                <span
                  className={`break-all ${
                    isError
                      ? 'text-rose-400'
                      : isSearch
                      ? 'text-cyan-300'
                      : isSuccess
                      ? 'text-emerald-300'
                      : 'text-slate-300'
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
