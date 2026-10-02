import React, { useState } from 'react';
import { X, Search, Trash2, Calendar, ArrowRight, FileText, CheckCircle2, Clock } from 'lucide-react';
import { ResearchTaskSummary } from '../types';

interface HistoryDrawerProps {
  history: ResearchTaskSummary[];
  isOpen: boolean;
  onClose: () => void;
  onSelectTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onClearAll: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  history,
  isOpen,
  onClose,
  onSelectTask,
  onDeleteTask,
  onClearAll,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = history.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return item.title?.toLowerCase().includes(q) || item.query?.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 md:w-[420px] bg-slate-900/95 border-l border-slate-800 shadow-2xl backdrop-blur-md flex flex-col animate-slideInRight">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-100">Research History Library</h3>
          <p className="text-[11px] text-slate-400 font-mono">{history.length} archived sessions</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search & Bulk Action Bar */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/60 flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search past research..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 text-slate-200 placeholder-slate-500 text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 focus:border-blue-500 outline-none"
          />
        </div>
        {history.length > 0 && (
          <button
            onClick={onClearAll}
            className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/60 transition"
            title="Clear all research history"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs italic">
            No research sessions recorded yet.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.task_id}
              className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 text-xs transition group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div
                  onClick={() => onSelectTask(item.task_id)}
                  className="font-semibold text-slate-200 hover:text-blue-400 cursor-pointer line-clamp-2 transition"
                >
                  {item.title || item.query}
                </div>
                <button
                  onClick={() => onDeleteTask(item.task_id)}
                  className="text-slate-600 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition"
                  title="Delete session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                <span
                  className={`px-1.5 py-0.2 rounded font-medium ${
                    item.status === 'completed'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                      : 'bg-blue-950 text-blue-400 border border-blue-900'
                  }`}
                >
                  {item.status}
                </span>

                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-slate-600" />
                  <span>{item.created_at ? item.created_at.slice(0, 10) : 'Recent'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
