import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BookOpen,
  Copy,
  Check,
  Printer,
  Globe,
  ArrowLeft,
  Sparkles,
  GraduationCap,
  TrendingUp,
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { api } from '../services/api';
import { CitationInspector } from './CitationInspector';
import { SharedMonographResponse } from '../types';

export const SharedMonographView: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();

  const [data, setData] = useState<SharedMonographResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Footnotes & Citation inspection
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [selectedCitationIndex, setSelectedCitationIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!shareToken) {
      setError('No share token provided in the URL.');
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .getSharedMonograph(shareToken)
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        console.error('Error fetching shared monograph:', err);
        setError(
          err.response?.data?.detail ||
            'The requested research monograph could not be found or access has been revoked.'
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [shareToken]);

  const handleCopyMarkdown = () => {
    if (data?.final_report?.full_markdown) {
      navigator.clipboard.writeText(data.final_report.full_markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSelectCitation = (idx: number) => {
    setSelectedCitationIndex(idx);
    setIsSourcesOpen(true);
  };

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest('.citation-badge');
    if (target) {
      const idx = target.getAttribute('data-citation-index');
      if (idx) {
        handleSelectCitation(parseInt(idx, 10));
      }
    }
  };

  const getRenderedContent = () => {
    if (!data?.final_report?.full_markdown) return '';
    let md = data.final_report.full_markdown;

    // Replace citations like [1], [2] with clickable superscript HTML chips
    md = md.replace(/\[(\d+)\]/g, (match, p1) => {
      return `<button type="button" class="citation-badge" data-citation-index="${p1}">${match}</button>`;
    });

    const rawHtml = marked.parse(md, { gfm: true, breaks: true }) as string;
    return DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: ['button'],
      ADD_ATTR: ['data-citation-index', 'class', 'type'],
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
        <div className="w-8 h-8 border-2 border-forest border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="font-serif text-lg font-bold text-ink mb-1">
          Loading Public Research Monograph...
        </h2>
        <p className="text-xs font-mono text-muted">
          Retrieving verified citations and publication manuscript.
        </p>
      </div>
    );
  }

  if (error || !data || !data.final_report) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-panel border border-edge rounded-[2px] p-8 shadow-paper">
          <div className="w-12 h-12 rounded-full bg-cream border border-edge flex items-center justify-center mx-auto mb-4 text-forest">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-xl font-bold text-ink mb-2">Monograph Unavailable</h2>
          <p className="text-sm font-serif text-muted mb-6 leading-relaxed">
            {error || 'This monograph is not currently available or the publication link is invalid.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-[2px] bg-forest text-cream font-serif font-bold text-xs shadow-subtle hover:bg-forest/90 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Launch Deep Research Assistant</span>
          </Link>
        </div>
      </div>
    );
  }

  const wordCount = data.final_report.full_markdown
    ? data.final_report.full_markdown.trim().split(/\s+/).length
    : 0;

  const mode = data.mode || 'general';

  return (
    <div className="min-h-screen bg-cream text-ink font-serif flex flex-col">
      {/* Top Editorial Bar */}
      <header className="sticky top-0 z-40 bg-panel/95 backdrop-blur-xs border-b border-edge py-3 px-4 sm:px-8 flex items-center justify-between shadow-subtle">
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded-[2px] bg-forest text-cream flex items-center justify-center font-serif font-bold text-sm shadow-subtle">
            Ψ
          </div>
          <div className="hidden sm:block">
            <span className="font-serif font-bold text-sm tracking-tight text-ink">
              The Antigravity Review
            </span>
            <span className="text-[10px] font-mono text-muted uppercase tracking-widest block -mt-0.5">
              Open Research Monograph Archive
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/"
            className="px-3 py-1.5 rounded-[2px] bg-cream hover:bg-panel border border-edge text-xs font-serif font-bold text-ink transition shadow-subtle flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-forest" />
            <span className="hidden md:inline">Conduct Your Own Inquiry</span>
            <span className="md:hidden">New Inquiry</span>
          </Link>
        </div>
      </header>

      {/* Main Manuscript Reader */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Publication Masthead Card */}
        <div className="bg-panel border border-edge rounded-[2px] p-6 sm:p-8 mb-8 shadow-subtle">
          <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-edge pb-3">
            <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono uppercase bg-cream text-forest border border-edge font-bold tracking-wider">
              Public Monograph
            </span>

            {mode === 'academic' && (
              <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono bg-cream text-forest border border-edge flex items-center space-x-1">
                <GraduationCap className="w-3 h-3" />
                <span>Academic & Peer-Reviewed Mode</span>
              </span>
            )}

            {mode === 'financial' && (
              <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono bg-cream text-forest border border-edge flex items-center space-x-1">
                <TrendingUp className="w-3 h-3" />
                <span>Financial & Market Intelligence</span>
              </span>
            )}

            {mode === 'general' && (
              <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono bg-cream text-muted border border-edge">
                Empirical Web Investigation
              </span>
            )}

            <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono bg-cream text-muted border border-edge">
              {data.sources.length} Verified Sources
            </span>
            <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono bg-cream text-muted border border-edge">
              ~{wordCount} Words
            </span>
            <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono bg-cream text-muted border border-edge ml-auto">
              {data.created_at
                ? new Date(data.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : new Date().toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-ink tracking-tight leading-tight mb-4">
            {data.final_report.title || data.query}
          </h1>

          <p className="text-xs font-mono text-muted mb-6">
            Inquiry Prompt: <span className="text-ink font-serif italic">"{data.query}"</span>
          </p>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-edge text-xs">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setSelectedCitationIndex(null);
                  setIsSourcesOpen(true);
                }}
                className="px-3 py-1.5 rounded-[2px] bg-cream hover:bg-panel text-ink border border-edge font-serif font-bold transition flex items-center space-x-1.5 shadow-subtle cursor-pointer"
                title="Inspect verified primary citations"
              >
                <BookOpen className="w-3.5 h-3.5 text-forest" />
                <span>Footnotes ({data.sources.length})</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyMarkdown}
                className="px-3 py-1.5 rounded-[2px] bg-cream hover:bg-panel text-ink border border-edge font-serif font-bold transition flex items-center space-x-1 shadow-subtle cursor-pointer"
                title="Copy markdown text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-forest" /> : <Copy className="w-3.5 h-3.5 text-muted" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-[2px] bg-cream hover:bg-panel text-ink border border-edge font-serif font-bold transition flex items-center space-x-1 shadow-subtle cursor-pointer"
                title="Print monograph or save as PDF"
              >
                <Printer className="w-3.5 h-3.5 text-muted" />
                <span className="hidden sm:inline">PDF</span>
              </button>

              <div className="flex items-center space-x-1 border-l border-edge pl-2">
                <a
                  href={api.getExportUrl(data.task_id, 'docx')}
                  download
                  className="p-1.5 rounded-[2px] bg-cream hover:bg-panel text-ink border border-edge text-[11px] font-mono shadow-subtle font-semibold text-forest"
                  title="Download formatted Word document (.docx)"
                >
                  .DOCX
                </a>
                <a
                  href={api.getExportUrl(data.task_id, 'bib')}
                  download
                  className="p-1.5 rounded-[2px] bg-cream hover:bg-panel text-ink border border-edge text-[11px] font-mono shadow-subtle font-semibold"
                  title="Download academic BibTeX library (.bib)"
                >
                  .BIB
                </a>
                <a
                  href={api.getExportUrl(data.task_id, 'md')}
                  download
                  className="p-1.5 rounded-[2px] bg-cream hover:bg-panel text-ink border border-edge text-[11px] font-mono shadow-subtle"
                  title="Download markdown file"
                >
                  .MD
                </a>
                <a
                  href={api.getExportUrl(data.task_id, 'html')}
                  download
                  className="p-1.5 rounded-[2px] bg-cream hover:bg-panel text-ink border border-edge text-[11px] font-mono shadow-subtle"
                  title="Download editorial HTML file"
                >
                  .HTML
                </a>
                <a
                  href={api.getExportUrl(data.task_id, 'json')}
                  download
                  className="p-1.5 rounded-[2px] bg-cream hover:bg-panel text-ink border border-edge text-[11px] font-mono shadow-subtle"
                  title="Download raw .json data"
                >
                  .JSON
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Rendered Publication Content */}
        <div
          onClick={handleContentClick}
          dangerouslySetInnerHTML={{ __html: getRenderedContent() }}
          className="prose-report bg-cream border border-edge rounded-[2px] p-8 sm:p-14 shadow-paper text-ink mb-12"
        />

        {/* Bottom Banner */}
        <div className="bg-panel border border-edge rounded-[2px] p-6 text-center shadow-subtle">
          <h3 className="font-serif font-bold text-lg text-ink mb-2">
            Interested in researching deeper?
          </h3>
          <p className="text-sm font-serif text-muted mb-4 max-w-lg mx-auto">
            Deep Research Assistant autonomously synthesizes comprehensive monographs with verified citations, multi-agent cyclical retrieval, and publication-ready exports.
          </p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-[2px] bg-forest text-cream font-serif font-bold text-xs shadow-subtle hover:bg-forest/90 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch an Investigation</span>
          </Link>
        </div>
      </main>

      {/* Citation Inspector Side Drawer */}
      <CitationInspector
        sources={data.sources}
        isOpen={isSourcesOpen}
        onClose={() => setIsSourcesOpen(false)}
        selectedCitationIndex={selectedCitationIndex}
      />
    </div>
  );
};
