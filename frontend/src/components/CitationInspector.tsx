import React, { useState } from 'react';
import { X, ExternalLink, Search, CheckCircle, Globe, Hash } from 'lucide-react';
import { CitationSource } from '../types';

interface CitationInspectorProps {
  sources: CitationSource[];
  isOpen: boolean;
  onClose: () => void;
  selectedCitationIndex?: number | null;
}

export const CitationInspector: React.FC<CitationInspectorProps> = ({
  sources,
  isOpen,
  onClose,
  selectedCitationIndex,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredSources = sources.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.title?.toLowerCase().includes(q) ||
      s.url?.toLowerCase().includes(q) ||
      s.snippet?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 md:w-[440px] bg-slate-900/95 border-l border-slate-800 shadow-2xl backdrop-blur-md flex flex-col animate-slideInRight">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-950 text-blue-400 border border-blue-800/80 flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Citation Inspector</h3>
            <p className="text-[11px] text-slate-400 font-mono">
              {sources.length} sources analyzed & verified
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/60">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search source title, URL, or excerpt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 text-slate-200 placeholder-slate-500 text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-800 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredSources.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs italic">
            No matching citations found.
          </div>
        ) : (
          filteredSources.map((source, idx) => {
            const displayIndex = source.index || idx + 1;
            const isSelected = selectedCitationIndex === displayIndex;

            let hostname = '';
            try {
              hostname = new URL(source.url).hostname;
            } catch {
              hostname = source.url;
            }

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border text-xs transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-950/40 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/60'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded bg-blue-950 text-blue-400 border border-blue-800 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                      [{displayIndex}]
                    </span>
                    <span className="font-semibold text-slate-200 line-clamp-1">
                      {source.title || hostname}
                    </span>
                  </div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-blue-400 shrink-0 p-1 hover:bg-slate-800 rounded transition"
                    title="Open original webpage in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {source.snippet && (
                  <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed mb-2 bg-slate-900/60 p-2 rounded border border-slate-800/80">
                    "{source.snippet}"
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                  <span className="truncate max-w-[200px] text-blue-400/90">{hostname}</span>
                  {source.score !== undefined && (
                    <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      Score: {source.score.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
