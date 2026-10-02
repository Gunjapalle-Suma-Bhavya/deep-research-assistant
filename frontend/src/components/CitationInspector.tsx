import React, { useState } from 'react';
import { X, ExternalLink, Search, Globe } from 'lucide-react';
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
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 md:w-[440px] bg-cream border-l border-edge shadow-paper flex flex-col animate-slideInRight">
      {/* Drawer Header */}
      <div className="p-4 sm:p-5 border-b border-edge bg-panel flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-[2px] bg-cream text-forest border border-edge flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-ink">Bibliographic Index</h3>
            <p className="text-xs text-muted font-mono">
              {sources.length} citations verified in corpus
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-[2px] text-muted hover:text-ink hover:bg-cream border border-edge transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-edge bg-panel/60">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted" />
          <input
            type="text"
            placeholder="Filter source title, domain, or excerpt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-cream text-ink placeholder-muted/60 text-xs pl-8 pr-3 py-2 rounded-[2px] border border-edge focus:border-forest outline-none font-body shadow-subtle"
          />
        </div>
      </div>

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredSources.length === 0 ? (
          <div className="text-center py-12 text-muted text-xs italic font-body">
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
                className={`p-4 rounded-[2px] border text-xs transition-all ${
                  isSelected
                    ? 'border-forest bg-panel shadow-subtle ring-1 ring-forest'
                    : 'border-edge bg-cream hover:bg-panel shadow-subtle'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-baseline space-x-2">
                    <span className="px-1.5 py-0.5 rounded-[2px] bg-panel text-forest border border-edge text-[10px] font-mono font-bold shrink-0">
                      [{displayIndex}]
                    </span>
                    <span className="font-serif font-bold text-ink line-clamp-2 text-sm leading-snug">
                      {source.title || hostname}
                    </span>
                  </div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted hover:text-forest shrink-0 p-1 hover:bg-cream border border-transparent hover:border-edge rounded-[2px] transition"
                    title="Open original publication in new window"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {source.snippet && (
                  <p className="text-xs text-muted font-body leading-relaxed mb-2.5 bg-panel p-2.5 rounded-[2px] border border-edge italic">
                    "{source.snippet}"
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-muted font-mono pt-1 border-t border-edge/60">
                  <span className="truncate max-w-[200px] text-forest font-medium">{hostname}</span>
                  {source.score !== undefined && (
                    <span className="bg-panel px-1.5 py-0.2 rounded-[2px] border border-edge text-[10px]">
                      Credibility: {source.score.toFixed(2)}
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
