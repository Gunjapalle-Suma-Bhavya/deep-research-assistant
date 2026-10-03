import React, { useState, useRef } from 'react';
import {
  Copy,
  Check,
  Printer,
  Volume2,
  Pause,
  BookOpen,
  Share2,
  Link as LinkIcon,
  X,
  MessageSquare,
  Download,
  ChevronDown,
  FileText,
  FileCode,
  Code,
  Globe,
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { FinalReport, CitationSource } from '../types';
import { api } from '../services/api';
import { ReportChatDrawer } from './ReportChatDrawer';

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

  // Public Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Inquire / Chat Drawer State
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Export Dropdown Menu State
  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleShareClick = async () => {
    setShowShareModal(true);
    if (!shareUrl) {
      try {
        setIsGeneratingShare(true);
        const res = await api.createShareLink(taskId);
        const url = `${window.location.origin}/share/${res.share_token}`;
        setShareUrl(url);
      } catch (err: any) {
        console.error('Failed to create share link:', err);
      } finally {
        setIsGeneratingShare(false);
      }
    }
  };

  const handleCopyShareLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  };

  const getRenderedContent = () => {
    let md = report.full_markdown || '';

    // Replace citations like [1], [2] with scholarly clickable superscript HTML chips
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

  const isSpeechSynthesisActive = useRef(false);

  // Clean summary extraction for natural spoken audio briefing
  const getSpokenSummaryText = () => {
    let text = report.executive_summary || '';
    if (!text && report.full_markdown) {
      const match = report.full_markdown.match(/##\s*Executive Summary\n+([\s\S]*?)(?=\n##|\Z)/i);
      if (match) {
        text = match[1];
      } else {
        text = report.full_markdown.slice(0, 1500);
      }
    }
    // Clean markdown symbols & citations
    text = text.replace(/\[\d+\]/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/#+\s*/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[-*•]\s*/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    return `Executive research briefing on ${report.title || 'this monograph'}. ${text}`;
  };

  const handleAudioToggle = async () => {
    // 1. If currently playing via SpeechSynthesis
    if (isSpeechSynthesisActive.current) {
      if (window.speechSynthesis.speaking) {
        if (isPlayingAudio) {
          window.speechSynthesis.pause();
          setIsPlayingAudio(false);
        } else {
          window.speechSynthesis.resume();
          setIsPlayingAudio(true);
        }
        return;
      }
    }

    // 2. If already generated an MP3 URL
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

    // 3. Try ElevenLabs API first
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
      console.warn('ElevenLabs API returned quota/credit limit. Engaging neural speech synthesis fallback:', err);
      // Seamless Fallback: Browser Speech Synthesis with natural voice
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const spokenText = getSpokenSummaryText();
        const utterance = new SpeechSynthesisUtterance(spokenText);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Samantha')));
        if (naturalVoice) {
          utterance.voice = naturalVoice;
        }

        utterance.onstart = () => {
          isSpeechSynthesisActive.current = true;
          setIsPlayingAudio(true);
        };
        utterance.onend = () => {
          isSpeechSynthesisActive.current = false;
          setIsPlayingAudio(false);
        };
        utterance.onerror = () => {
          isSpeechSynthesisActive.current = false;
          setIsPlayingAudio(false);
        };

        window.speechSynthesis.speak(utterance);
      } else {
        alert(`Audio briefing note: ${err.message || 'ElevenLabs API quota reached.'}`);
      }
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
    <div className="max-w-4xl mx-auto w-full py-8">
      {/* Publication Masthead Card */}
      <div className="bg-panel border border-edge rounded-[2px] p-6 sm:p-8 mb-8 shadow-subtle">
        <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-edge pb-3">
          <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono uppercase bg-cream text-forest border border-edge font-bold tracking-wider">
            Verified Manuscript
          </span>
          <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono bg-cream text-muted border border-edge">
            {sources.length} Verified Citations
          </span>
          <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono bg-cream text-muted border border-edge">
            ~{wordCount} Words
          </span>
          <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono bg-cream text-muted border border-edge ml-auto">
            {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-serif font-bold text-ink tracking-tight leading-tight mb-4">
          {report.title || 'Comprehensive Research Monograph'}
        </h1>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-edge text-xs">
          {/* Audio briefing trigger */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAudioToggle}
              disabled={isGeneratingAudio}
              className={`px-3 py-1.5 rounded-[2px] border font-serif font-bold transition flex items-center space-x-1.5 shadow-subtle cursor-pointer ${
                isPlayingAudio
                  ? 'bg-forest text-cream border-forest'
                  : 'bg-cream hover:bg-panel text-ink border-edge'
              }`}
            >
              {isGeneratingAudio ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-forest border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Narration...</span>
                </>
              ) : isPlayingAudio ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Narration</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-forest" />
                  <span>Audio Monograph</span>
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

          {/* Export & Inspection Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenSourcesDrawer}
              className="px-3 py-1.5 rounded-[2px] bg-cream hover:bg-panel text-ink border border-edge font-serif font-bold transition flex items-center space-x-1.5 shadow-subtle cursor-pointer"
              title="Inspect citations and primary sources"
            >
              <BookOpen className="w-3.5 h-3.5 text-forest" />
              <span>Footnotes ({sources.length})</span>
            </button>

            <button
              onClick={() => setIsChatOpen(true)}
              className="px-3 py-1.5 rounded-[2px] bg-cream hover:bg-panel text-ink border border-edge font-serif font-bold transition flex items-center space-x-1.5 shadow-subtle cursor-pointer"
              title="Conduct interactive follow-up Q&A on this monograph"
            >
              <MessageSquare className="w-3.5 h-3.5 text-forest" />
              <span>Inquire</span>
            </button>

            <button
              onClick={handleCopyMarkdown}
              className="px-3 py-1.5 rounded-[2px] bg-cream hover:bg-panel text-ink border border-edge font-serif font-bold transition flex items-center space-x-1 shadow-subtle cursor-pointer"
              title="Copy markdown text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-forest" /> : <Copy className="w-3.5 h-3.5 text-muted" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Export Formats Dropdown (including PDF) */}
            <div className="relative">
              <button
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="px-3 py-1.5 rounded-[2px] bg-cream hover:bg-panel text-ink border border-edge font-serif font-bold transition flex items-center space-x-1.5 shadow-subtle cursor-pointer"
                title="Export monograph in multiple formats"
              >
                <Download className="w-3.5 h-3.5 text-forest" />
                <span>Export</span>
                <ChevronDown className={`w-3 h-3 text-muted transition-transform duration-200 ${isExportOpen ? 'rotate-180' : ''}`} />
              </button>

              {isExportOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsExportOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-60 bg-cream border border-edge rounded-[2px] shadow-paper py-1.5 z-40 animate-fadeIn font-serif divide-y divide-edge">
                    {/* PDF Manuscript */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsExportOpen(false);
                          handlePrint();
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-panel flex items-center space-x-2.5 text-xs text-ink transition cursor-pointer"
                      >
                        <Printer className="w-4 h-4 text-forest shrink-0" />
                        <div>
                          <div className="font-bold">PDF Manuscript</div>
                          <div className="text-[10px] text-muted font-mono">Print or save editorial layout as PDF</div>
                        </div>
                      </button>
                    </div>

                    {/* Word .docx & BibTeX .bib */}
                    <div className="py-1">
                      <a
                        href={api.getExportUrl(taskId, 'docx')}
                        download
                        onClick={() => setIsExportOpen(false)}
                        className="w-full px-3 py-2 text-left hover:bg-panel flex items-center space-x-2.5 text-xs text-ink transition cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-forest shrink-0" />
                        <div>
                          <div className="font-bold flex items-center space-x-1">
                            <span>Word Document</span>
                            <span className="text-[10px] font-mono text-forest font-semibold bg-panel px-1 py-0.2 rounded border border-edge">.docx</span>
                          </div>
                          <div className="text-[10px] text-muted font-mono">Formatted with headings & citations</div>
                        </div>
                      </a>

                      <a
                        href={api.getExportUrl(taskId, 'bib')}
                        download
                        onClick={() => setIsExportOpen(false)}
                        className="w-full px-3 py-2 text-left hover:bg-panel flex items-center space-x-2.5 text-xs text-ink transition cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4 text-forest shrink-0" />
                        <div>
                          <div className="font-bold flex items-center space-x-1">
                            <span>BibTeX Library</span>
                            <span className="text-[10px] font-mono text-ink font-semibold bg-panel px-1 py-0.2 rounded border border-edge">.bib</span>
                          </div>
                          <div className="text-[10px] text-muted font-mono">Zotero, Mendeley & LaTeX citations</div>
                        </div>
                      </a>
                    </div>

                    {/* Markdown, HTML, JSON */}
                    <div className="py-1">
                      <a
                        href={api.getExportUrl(taskId, 'md')}
                        download
                        onClick={() => setIsExportOpen(false)}
                        className="w-full px-3 py-2 text-left hover:bg-panel flex items-center space-x-2.5 text-xs text-ink transition cursor-pointer"
                      >
                        <FileCode className="w-4 h-4 text-muted shrink-0" />
                        <div>
                          <div className="font-bold flex items-center space-x-1">
                            <span>Markdown Text</span>
                            <span className="text-[10px] font-mono text-muted bg-panel px-1 py-0.2 rounded border border-edge">.md</span>
                          </div>
                          <div className="text-[10px] text-muted font-mono">Raw formatted markdown document</div>
                        </div>
                      </a>

                      <a
                        href={api.getExportUrl(taskId, 'html')}
                        download
                        onClick={() => setIsExportOpen(false)}
                        className="w-full px-3 py-2 text-left hover:bg-panel flex items-center space-x-2.5 text-xs text-ink transition cursor-pointer"
                      >
                        <Globe className="w-4 h-4 text-muted shrink-0" />
                        <div>
                          <div className="font-bold flex items-center space-x-1">
                            <span>Editorial HTML</span>
                            <span className="text-[10px] font-mono text-muted bg-panel px-1 py-0.2 rounded border border-edge">.html</span>
                          </div>
                          <div className="text-[10px] text-muted font-mono">Self-contained styled web page</div>
                        </div>
                      </a>

                      <a
                        href={api.getExportUrl(taskId, 'json')}
                        download
                        onClick={() => setIsExportOpen(false)}
                        className="w-full px-3 py-2 text-left hover:bg-panel flex items-center space-x-2.5 text-xs text-ink transition cursor-pointer"
                      >
                        <Code className="w-4 h-4 text-muted shrink-0" />
                        <div>
                          <div className="font-bold flex items-center space-x-1">
                            <span>Raw Data JSON</span>
                            <span className="text-[10px] font-mono text-muted bg-panel px-1 py-0.2 rounded border border-edge">.json</span>
                          </div>
                          <div className="text-[10px] text-muted font-mono">Complete task and citation payload</div>
                        </div>
                      </a>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Share button at the very end of container */}
            <button
              onClick={handleShareClick}
              disabled={isGeneratingShare}
              className="px-3.5 py-1.5 rounded-[2px] bg-forest hover:bg-forest/90 text-cream border border-forest font-serif font-bold transition flex items-center space-x-1.5 shadow-subtle cursor-pointer ml-1 shrink-0"
              title="Generate public share link"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Audio scrub bar when active */}
        {audioUrl && (
          <div className="mt-4 pt-3 border-t border-edge flex items-center space-x-3 text-xs font-mono text-muted">
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
              className="flex-1 accent-[#2A4736] h-1 rounded-[2px] bg-cream border border-edge cursor-pointer"
            />
            <span>{Math.floor(audioDuration)}s</span>
          </div>
        )}
      </div>

      {/* Rendered Publication Content */}
      <div
        onClick={handleContentClick}
        dangerouslySetInnerHTML={{ __html: getRenderedContent() }}
        className="prose-report bg-cream border border-edge rounded-[2px] p-8 sm:p-14 shadow-paper text-ink"
      />

      {/* Public Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-panel border border-edge rounded-[2px] max-w-md w-full p-6 shadow-paper">
            <div className="flex items-center justify-between pb-3 border-b border-edge mb-4">
              <div className="flex items-center space-x-2">
                <LinkIcon className="w-4 h-4 text-forest" />
                <h3 className="font-serif font-bold text-lg text-ink">Share Monograph</h3>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-[2px] text-muted hover:text-ink hover:bg-cream border border-edge transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm font-serif text-muted mb-4 leading-relaxed">
              Anyone with this public link can inspect this monograph, explore verified citations, and download formatted exports without requiring an account.
            </p>

            {isGeneratingShare ? (
              <div className="py-6 flex flex-col items-center justify-center space-y-2">
                <span className="w-5 h-5 border-2 border-forest border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono text-muted">Generating public share token...</span>
              </div>
            ) : shareUrl ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-cream border border-edge rounded-[2px] text-ink select-all focus:outline-none focus:border-forest"
                  />
                  <button
                    onClick={handleCopyShareLink}
                    className="px-3 py-2 rounded-[2px] bg-forest hover:bg-forest/90 text-cream border border-forest text-xs font-serif font-bold flex items-center space-x-1 cursor-pointer transition shadow-subtle shrink-0"
                  >
                    {shareCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-[11px] font-mono text-muted bg-cream p-2.5 rounded-[2px] border border-edge">
                  Status: <span className="text-forest font-semibold">Active & Live</span> • Read-only access enabled
                </div>
              </div>
            ) : (
              <div className="text-xs text-rose-700 bg-rose-50 p-3 rounded-[2px] border border-rose-200">
                Failed to generate public share token. Please ensure the backend is running.
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-edge flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-1.5 rounded-[2px] bg-cream hover:bg-panel border border-edge text-xs font-serif font-bold text-ink cursor-pointer transition shadow-subtle"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monograph Chat & Follow-Up Drawer */}
      <ReportChatDrawer
        taskId={taskId}
        reportTitle={report.title}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onSelectCitation={onSelectCitation}
      />
    </div>
  );
};
