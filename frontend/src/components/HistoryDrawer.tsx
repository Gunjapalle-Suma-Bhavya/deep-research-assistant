import React, { useState } from 'react';
import { X, Search, Trash2, Calendar, BookOpen } from 'lucide-react';
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
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 md:w-[420px] bg-cream border-l border-edge shadow-paper flex flex-col animate-slideInRight">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-edge bg-panel flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-[2px] bg-cream text-forest border border-edge flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-ink">Research Archive</h3>
            <p className="text-xs text-muted font-mono">{history.length} archived monographs</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-[2px] text-muted hover:text-ink hover:bg-cream border border-edge transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search & Bulk Action Bar */}
      <div className="p-3 border-b border-edge bg-panel/60 flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted" />
          <input
            type="text"
            placeholder="Search past inquiries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-cream text-ink placeholder-muted/60 text-xs pl-8 pr-3 py-1.5 rounded-[2px] border border-edge focus:border-forest outline-none font-body shadow-subtle"
          />
        </div>
        {history.length > 0 && (
          <button
            onClick={onClearAll}
            className="p-2 rounded-[2px] bg-cream hover:bg-panel text-rose-800 border border-edge transition shadow-subtle"
            title="Purge all archives"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted text-xs italic font-body">
            No research sessions recorded in this archive.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.task_id}
              className="p-4 rounded-[2px] border border-edge bg-cream hover:bg-panel text-xs transition group shadow-subtle"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div
                  onClick={() => onSelectTask(item.task_id)}
                  className="font-serif font-bold text-ink hover:text-forest cursor-pointer line-clamp-2 transition text-sm leading-snug"
                >
                  {item.title || item.query}
                </div>
                <button
                  onClick={() => onDeleteTask(item.task_id)}
                  className="text-muted hover:text-rose-700 p-1 opacity-0 group-hover:opacity-100 transition"
                  title="Remove from archive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted font-mono pt-2 border-t border-edge/60">
                <span
                  className={`px-1.5 py-0.2 rounded-[2px] border ${
                    item.status === 'completed'
                      ? 'bg-panel text-forest border-forest/40'
                      : 'bg-panel text-muted border-edge'
                  }`}
                >
                  {item.status}
                </span>

                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-muted" />
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
