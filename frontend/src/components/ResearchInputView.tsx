import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  SlidersHorizontal,
  ArrowRight,
  Zap,
  BookOpen,
  Layers,
  X,
  Feather,
  GraduationCap,
  TrendingUp,
  Compass,
} from 'lucide-react';
import { ResearchDepth, ResearchMode } from '../types';

interface ResearchInputViewProps {
  onStartResearch: (
    query: string,
    depth: ResearchDepth,
    customInstructions: string,
    mode: ResearchMode
  ) => void;
  isLoading: boolean;
}

const EXAMPLE_PROMPTS = [
  'Emerging Trends in Quantum Computing Algorithms and Scalability in 2026',
  'Comparative Architecture of Modern Agentic AI Frameworks (LangGraph vs AutoGen vs CrewAI)',
  'Solid-State Battery Breakthroughs and Commercialization Timelines for EVs',
  'CRISPR Gene Editing in Agriculture: Regulatory Landscape and Crop Yield Impacts',
];

export const ResearchInputView: React.FC<ResearchInputViewProps> = ({
  onStartResearch,
  isLoading,
}) => {
  const [query, setQuery] = useState('');
  const [depth, setDepth] = useState<ResearchDepth>('standard');
  const [mode, setMode] = useState<ResearchMode>('general');
  const [customInstructions, setCustomInstructions] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleSpeech = () => {
    if (!recognitionRef.current) {
      alert('Speech-to-Text is not supported by your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    onStartResearch(query.trim(), depth, customInstructions.trim(), mode);
  };

  const handleEnhance = () => {
    if (!query.trim()) return;
    setQuery(
      `Conduct a comprehensive, multi-angle investigation into: ${query.trim()}. Identify key technical breakthroughs, competitive landscape, historical bottlenecks, and actionable future projections with verified citations.`
    );
  };

  const wordCount = query.trim() ? query.trim().split(/\s+/).length : 0;

  return (
    <section className="max-w-3xl mx-auto w-full py-10 sm:py-14 px-4 transition-all">
      {/* Editorial Lead Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-[2px] bg-panel border border-edge text-forest text-xs font-mono mb-4 shadow-subtle">
          <Feather className="w-3.5 h-3.5" />
          <span>LangGraph Multi-Agent Investigation Desk</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-ink mb-4 leading-tight">
          Inquire Deeply.
        </h1>
        <p className="text-base sm:text-lg text-muted max-w-xl mx-auto font-body italic leading-relaxed">
          Formulate a complex hypothesis, technical topic, or market question. Autonomous agents will scope, parallel-search, and synthesize a publication-quality manuscript.
        </p>
      </div>

      {/* Main Inquiry Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-panel border border-edge rounded-[2px] shadow-subtle p-5 sm:p-7"
      >
        {/* Text Area */}
        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your inquiry or research hypothesis here..."
            rows={5}
            className="w-full bg-cream text-ink placeholder-muted/60 rounded-[2px] p-4 text-base border border-edge focus:border-forest focus:ring-0 transition resize-none outline-none font-body leading-relaxed shadow-subtle"
          />

          {/* Floating Controls */}
          <div className="absolute right-3 bottom-3 flex items-center space-x-2">
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1.5 text-muted hover:text-ink bg-panel hover:bg-cream border border-edge rounded-[2px] transition"
                title="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleEnhance}
              disabled={!query.trim()}
              className="p-1.5 px-2 text-forest hover:text-forest-hover disabled:opacity-40 bg-panel hover:bg-cream border border-edge rounded-[2px] text-xs font-mono transition flex items-center space-x-1"
              title="Enhance prompt for deep investigation"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Enhance</span>
            </button>

            <button
              type="button"
              onClick={toggleSpeech}
              className={`p-2 rounded-[2px] border text-xs font-medium transition flex items-center space-x-1 ${
                isListening
                  ? 'bg-rose-100 text-rose-800 border-rose-300 animate-mic-pulse'
                  : 'bg-panel text-muted hover:text-ink border-edge hover:bg-cream'
              }`}
              title={isListening ? 'Stop dictation' : 'Dictate inquiry with voice'}
            >
              {isListening ? <MicOff className="w-4 h-4 text-rose-800" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Char & Word count bar */}
        <div className="flex items-center justify-between text-xs text-muted mt-2.5 px-1 font-mono">
          <span>{isListening ? '🎙️ Recording voice dictation...' : 'Enter your question or choose a suggested inquiry'}</span>
          <span>
            {wordCount} words · {query.length} chars
          </span>
        </div>

        {/* Investigation Domain / Source Mode */}
        <div className="mt-6 pt-5 border-t border-edge">
          <label className="block text-xs font-semibold text-muted mb-3 uppercase tracking-wider font-mono">
            Investigation Domain & Source Index
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setMode('general')}
              className={`flex items-start p-3 rounded-[2px] border text-left transition ${
                mode === 'general'
                  ? 'bg-cream border-forest text-ink ring-1 ring-forest'
                  : 'bg-panel border-edge text-muted hover:border-muted/50 hover:bg-cream'
              }`}
            >
              <Compass className="w-4 h-4 mr-2.5 mt-0.5 text-forest shrink-0" />
              <div>
                <div className="text-sm font-serif font-bold text-ink">General Empirical</div>
                <div className="text-[11px] text-muted font-mono mt-0.5">Broad web exploration across live authoritative sources</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode('academic')}
              className={`flex items-start p-3 rounded-[2px] border text-left transition ${
                mode === 'academic'
                  ? 'bg-cream border-forest text-ink ring-1 ring-forest'
                  : 'bg-panel border-edge text-muted hover:border-muted/50 hover:bg-cream'
              }`}
            >
              <GraduationCap className="w-4 h-4 mr-2.5 mt-0.5 text-forest shrink-0" />
              <div>
                <div className="text-sm font-serif font-bold text-ink flex items-center gap-1.5">
                  Academic Focus
                  <span className="text-[9px] bg-panel text-forest px-1 border border-edge rounded-[2px] font-mono">.edu / ArXiv</span>
                </div>
                <div className="text-[11px] text-muted font-mono mt-0.5">ArXiv, Nature, ScienceDirect, PubMed & University domains</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode('financial')}
              className={`flex items-start p-3 rounded-[2px] border text-left transition ${
                mode === 'financial'
                  ? 'bg-cream border-forest text-ink ring-1 ring-forest'
                  : 'bg-panel border-edge text-muted hover:border-muted/50 hover:bg-cream'
              }`}
            >
              <TrendingUp className="w-4 h-4 mr-2.5 mt-0.5 text-forest shrink-0" />
              <div>
                <div className="text-sm font-serif font-bold text-ink flex items-center gap-1.5">
                  Financial & Market
                  <span className="text-[9px] bg-panel text-forest px-1 border border-edge rounded-[2px] font-mono">SEC / News</span>
                </div>
                <div className="text-[11px] text-muted font-mono mt-0.5">SEC filings, Bloomberg, Reuters, FT & market disclosures</div>
              </div>
            </button>
          </div>
        </div>

        {/* Depth Presets */}
        <div className="mt-5 pt-4 border-t border-edge">
          <label className="block text-xs font-semibold text-muted mb-3 uppercase tracking-wider font-mono">
            Investigation Scope & Breadth
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setDepth('quick')}
              className={`flex items-start p-3.5 rounded-[2px] border text-left transition ${
                depth === 'quick'
                  ? 'bg-cream border-forest text-ink ring-1 ring-forest'
                  : 'bg-panel border-edge text-muted hover:border-muted/50 hover:bg-cream'
              }`}
            >
              <Zap className="w-4 h-4 mr-2.5 mt-0.5 text-forest shrink-0" />
              <div>
                <div className="text-sm font-serif font-bold text-ink">Brief Overview</div>
                <div className="text-xs text-muted font-mono mt-0.5">2 subtopics · ~6-10 sources</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDepth('standard')}
              className={`flex items-start p-3.5 rounded-[2px] border text-left transition ${
                depth === 'standard'
                  ? 'bg-cream border-forest text-ink ring-1 ring-forest'
                  : 'bg-panel border-edge text-muted hover:border-muted/50 hover:bg-cream'
              }`}
            >
              <BookOpen className="w-4 h-4 mr-2.5 mt-0.5 text-forest shrink-0" />
              <div>
                <div className="text-sm font-serif font-bold text-ink flex items-center gap-1.5">
                  Standard Article
                  <span className="text-[10px] bg-panel text-forest px-1 border border-edge rounded-[2px] font-mono">Standard</span>
                </div>
                <div className="text-xs text-muted font-mono mt-0.5">3-4 subtopics · ~15-20 sources</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDepth('comprehensive')}
              className={`flex items-start p-3.5 rounded-[2px] border text-left transition ${
                depth === 'comprehensive'
                  ? 'bg-cream border-forest text-ink ring-1 ring-forest'
                  : 'bg-panel border-edge text-muted hover:border-muted/50 hover:bg-cream'
              }`}
            >
              <Layers className="w-4 h-4 mr-2.5 mt-0.5 text-forest shrink-0" />
              <div>
                <div className="text-sm font-serif font-bold text-ink">Full Monograph</div>
                <div className="text-xs text-muted font-mono mt-0.5">5+ subtopics · ~25-40 sources</div>
              </div>
            </button>
          </div>
        </div>

        {/* Custom Instructions Accordion */}
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-1.5 text-xs text-muted hover:text-ink font-mono transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-muted" />
            <span>{showAdvanced ? 'Hide Editorial Constraints' : 'Add Editorial Constraints & Focus Areas'}</span>
          </button>

          {showAdvanced && (
            <div className="mt-3">
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Optional: Specify methodological constraints, regions, time horizons, or exclusions (e.g. 'Focus on post-2024 developments, emphasize peer-reviewed research, exclude speculative venture claims')"
                rows={3}
                className="w-full bg-cream text-ink placeholder-muted/60 rounded-[2px] p-3 text-xs border border-edge focus:border-forest outline-none font-body leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="w-full sm:w-auto px-6 py-3 rounded-[2px] bg-forest hover:bg-forest-hover disabled:opacity-40 text-cream font-serif font-bold text-sm tracking-wide shadow-subtle transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>{isLoading ? 'Dispatching Agents...' : 'Begin Deep Research'}</span>
            <ArrowRight className="w-4 h-4 text-cream" />
          </button>
        </div>
      </form>

      {/* Suggested Topics Showcase */}
      <div className="mt-10">
        <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 font-mono text-center sm:text-left">
          Curated Inquiries for Exploration
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {EXAMPLE_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setQuery(prompt)}
              className="text-xs text-ink hover:text-forest bg-panel hover:bg-cream border border-edge p-3 rounded-[2px] transition text-left font-body leading-normal shadow-subtle"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
