import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, SlidersHorizontal, ArrowRight, Zap, BookOpen, Layers, X } from 'lucide-react';
import { ResearchDepth } from '../types';

interface ResearchInputViewProps {
  onStartResearch: (query: string, depth: ResearchDepth, customInstructions: string) => void;
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
  const [customInstructions, setCustomInstructions] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API if supported
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

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

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
    onStartResearch(query.trim(), depth, customInstructions.trim());
  };

  const handleEnhance = () => {
    if (!query.trim()) return;
    setQuery(
      `Conduct a comprehensive, multi-angle investigation into: ${query.trim()}. Identify key technical breakthroughs, competitive landscape, historical bottlenecks, and actionable future projections with verified citations.`
    );
  };

  const wordCount = query.trim() ? query.trim().split(/\s+/).length : 0;

  return (
    <section className="max-w-3xl mx-auto w-full py-8 sm:py-12 px-4 transition-all">
      {/* Hero Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/60 text-blue-400 text-xs font-medium mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Autonomous LangGraph Multi-Agent Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100 mb-3">
          Deep Research Assistant
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
          Multi-agent orchestration that dynamically scopes topics, parallelizes web searches, synthesizes facts, and produces publication-quality briefs.
        </p>
      </div>

      {/* Main Input Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl shadow-black/40 p-4 sm:p-6 backdrop-blur-sm"
      >
        {/* Text Area */}
        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What complex topic, technology, or market would you like to deeply investigate?"
            rows={4}
            className="w-full bg-slate-950/90 text-slate-100 placeholder-slate-500 rounded-xl p-4 text-sm sm:text-base border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none outline-none"
          />

          {/* Floating Textarea Controls */}
          <div className="absolute right-3 bottom-3 flex items-center space-x-2">
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-lg transition"
                title="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleEnhance}
              disabled={!query.trim()}
              className="p-1.5 text-blue-400 hover:text-blue-300 disabled:opacity-40 bg-blue-950/80 hover:bg-blue-900 border border-blue-800/60 rounded-lg text-xs font-medium transition flex items-center space-x-1"
              title="Enhance prompt for deep investigation"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Enhance</span>
            </button>

            <button
              type="button"
              onClick={toggleSpeech}
              className={`p-2 rounded-lg border text-xs font-medium transition flex items-center space-x-1 ${
                isListening
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500 animate-mic-pulse'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700/80'
              }`}
              title={isListening ? 'Stop speech recognition' : 'Dictate with speech'}
            >
              {isListening ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Char & Word count bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1 font-mono">
          <span>{isListening ? '🎙️ Listening to your voice...' : 'Press Start or select an example below'}</span>
          <span>
            {wordCount} words · {query.length} chars
          </span>
        </div>

        {/* Depth Presets */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <label className="block text-xs font-semibold text-slate-400 mb-2.5 uppercase tracking-wider font-mono">
            Research Depth & Scope
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setDepth('quick')}
              className={`flex items-start p-3 rounded-xl border text-left transition ${
                depth === 'quick'
                  ? 'bg-blue-950/40 border-blue-500/80 text-blue-300'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Zap className="w-4 h-4 mr-2.5 mt-0.5 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-slate-200">Quick</div>
                <div className="text-[11px] text-slate-500">2 subtopics · ~6-10 sources</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDepth('standard')}
              className={`flex items-start p-3 rounded-xl border text-left transition ${
                depth === 'standard'
                  ? 'bg-blue-950/40 border-blue-500/80 text-blue-300 ring-1 ring-blue-500/50'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <BookOpen className="w-4 h-4 mr-2.5 mt-0.5 text-blue-400 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  Standard
                  <span className="text-[9px] bg-blue-900/60 text-blue-300 px-1 py-0.2 rounded font-mono">Default</span>
                </div>
                <div className="text-[11px] text-slate-500">3-4 subtopics · ~12-20 sources</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDepth('comprehensive')}
              className={`flex items-start p-3 rounded-xl border text-left transition ${
                depth === 'comprehensive'
                  ? 'bg-blue-950/40 border-blue-500/80 text-blue-300'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Layers className="w-4 h-4 mr-2.5 mt-0.5 text-purple-400 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-slate-200">Comprehensive</div>
                <div className="text-[11px] text-slate-500">5+ subtopics · ~25-40 sources</div>
              </div>
            </button>
          </div>
        </div>

        {/* Custom Instructions Accordion */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>{showAdvanced ? 'Hide Custom Instructions' : 'Add Custom Instructions or Focus Areas'}</span>
          </button>

          {showAdvanced && (
            <div className="mt-2.5 animate-fadeIn">
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Optional: Specify target perspectives, regions, time horizons, or exclusions (e.g. 'Focus on post-2024 developments, emphasize open-source models, exclude paywalled analyst reports')"
                rows={2}
                className="w-full bg-slate-950/80 text-slate-200 placeholder-slate-600 rounded-lg p-3 text-xs border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>{isLoading ? 'Initializing Multi-Agent Graph...' : 'Start Deep Research'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Suggested Topics Pill Showcase */}
      <div className="mt-8">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 font-mono text-center sm:text-left">
          Suggested Inquiries
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setQuery(prompt)}
              className="text-xs text-slate-400 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700 px-3 py-2 rounded-xl transition text-left"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
