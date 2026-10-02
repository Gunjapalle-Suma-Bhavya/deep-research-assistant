import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Copy,
  Check,
  Printer,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  FileText,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { FinalReport, CitationSource } from '../types';
import { api } from '../services/api';

interface ReportViewerProps {
  taskId: string;
  report: FinalReport;
  sources: CitationSource[];
  onOpenSourcesDrawer: () => void;
  onSelectCitation: (citationIndex: number) => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  taskId,
  report,
  sources,
  onOpenSourcesDrawer,
  onSelectCitation,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Configure marked for citation parsing & security
  const getRenderedContent = () => {
    let md = report.full_markdown || '';

    // Replace citations like [1], [2], [1, 2] with clickable HTML chips
    md = md.replace(/\[(\d+)\]/g, (match, p1) => {
      return `<button type="button" class="citation-badge" data-citation-index="${p1}">${match}</button>`;
    });

    const rawHtml = marked.parse(md, { gfm: true, breaks: true }) as string;
    return DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: ['button'],
      ADD_ATTR: ['data-citation-index', 'class', 'type'],
    });
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(report.full_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAudioToggle = async () => {
    if (audioUrl) {
      if (audioRef.current) {
        if (isPlayingAudio) {
          audioRef.current.pause();
          setIsPlayingAudio(false);
        } else {
          audioRef.current.play();
          setIsPlayingAudio(true);
        }
      }
      return;
    }

    // Generate Audio
    try {
      setIsGeneratingAudio(true);
      const blob = await api.generateAudioBriefing(taskId);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play();
          setIsPlayingAudio(true);
        }
      }, 100);
    } catch (err: any) {
      alert(`Audio generation note: ${err.message || 'ElevenLabs API key not configured or quota exceeded.'}`);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setAudioProgress(audioRef.current.currentTime);
      setAudioDuration(audioRef.current.duration || 0);
    }
  };

  // Intercept click on rendered citation badges
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest('.citation-badge');
    if (target) {
      const idx = target.getAttribute('data-citation-index');
      if (idx) {
        onSelectCitation(parseInt(idx, 10));
      }
    }
  };

  const wordCount = report.full_markdown ? report.full_markdown.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-4xl mx-auto w-full py-6">
      {/* Report Header Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 mb-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
            Synthesis Complete
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
            {sources.length} Verified Sources
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
            ~{wordCount} Words
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight leading-tight mb-4">
          {report.title || 'Comprehensive Investigation Report'}
        </h1>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/80 text-xs">
          {/* Audio briefing trigger */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAudioToggle}
              disabled={isGeneratingAudio}
              className={`px-3 py-1.5 rounded-lg border font-medium transition flex items-center space-x-1.5 ${
                isPlayingAudio
                  ? 'bg-purple-950 text-purple-300 border-purple-800'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
              }`}
            >
              {isGeneratingAudio ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Voice...</span>
                </>
              ) : isPlayingAudio ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Briefing</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Audio Briefing</span>
                </>
              )}
            </button>

            {audioUrl && (
              <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlayingAudio(false)}
                className="hidden"
              />
            )}
          </div>

          {/* Export & Utility Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenSourcesDrawer}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 font-medium transition flex items-center space-x-1"
              title="Inspect citations and scraped sources"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>Sources ({sources.length})</span>
            </button>

            <button
              onClick={handleCopyMarkdown}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 font-medium transition flex items-center space-x-1"
              title="Copy markdown content"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 font-medium transition flex items-center space-x-1"
              title="Print / Save PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            <div className="flex items-center space-x-1 border-l border-slate-700/80 pl-2">
              <a
                href={api.getExportUrl(taskId, 'md')}
                download
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-mono"
                title="Download .md file"
              >
                .MD
              </a>
              <a
                href={api.getExportUrl(taskId, 'html')}
                download
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-mono"
                title="Download .html file"
              >
                .HTML
              </a>
              <a
                href={api.getExportUrl(taskId, 'json')}
                download
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-mono"
                title="Download raw .json session"
              >
                .JSON
              </a>
            </div>
          </div>
        </div>

        {/* Audio scrub bar when loaded */}
        {audioUrl && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center space-x-3 text-xs font-mono text-slate-400">
            <span>{Math.floor(audioProgress)}s</span>
            <input
              type="range"
              min={0}
              max={audioDuration || 100}
              value={audioProgress}
              onChange={(e) => {
                if (audioRef.current) {
                  audioRef.current.currentTime = parseFloat(e.target.value);
                }
              }}
              className="flex-1 accent-purple-500 h-1 rounded bg-slate-800 cursor-pointer"
            />
            <span>{Math.floor(audioDuration)}s</span>
          </div>
        )}
      </div>

      {/* Rendered Markdown Body */}
      <div
        onClick={handleContentClick}
        dangerouslySetInnerHTML={{ __html: getRenderedContent() }}
        className="prose-report bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-10 shadow-lg text-slate-200"
      />
    </div>
  );
};
