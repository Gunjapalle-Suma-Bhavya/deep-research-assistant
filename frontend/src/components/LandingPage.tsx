import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Search, Brain, FileCheck, Layers, Feather, ShieldCheck, Cpu, Globe } from 'lucide-react';

interface LandingPageProps {
  isAuthenticated: boolean;
  onNavigate?: (route: any) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  isAuthenticated,
}) => {
  const navigate = useNavigate();
  return (
    <div className="w-full flex flex-col font-body">
      {/* Editorial Lead Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-[2px] bg-panel border border-edge text-forest text-xs font-mono mb-6 shadow-subtle">
          <Feather className="w-3.5 h-3.5" />
          <span>The Journal of Autonomous Inquiry · LangGraph Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold text-ink tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto">
          Autonomous Investigation.<br />
          Rigorous Verification.<br />
          <span className="italic font-normal text-forest">Publication-Quality Monographs.</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto font-body italic leading-relaxed mb-10">
          A cyclical multi-agent system powered by LangGraph. It scours the live web, cross-verifies empirical claims, and authors comprehensive analytical reports with inline citations and voice narration.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            to="/desk"
            className="w-full sm:w-auto px-7 py-3.5 rounded-[2px] bg-forest hover:bg-forest-hover text-cream font-serif font-bold text-base tracking-wide shadow-subtle transition flex items-center justify-center space-x-2.5 cursor-pointer"
          >
            <span>Enter Research Desk</span>
            <ArrowRight className="w-4 h-4 text-cream" />
          </Link>

          {!isAuthenticated && (
            <Link
              to="/signup"
              className="w-full sm:w-auto px-6 py-3.5 rounded-[2px] bg-panel hover:bg-cream border border-edge text-ink font-serif font-bold text-base shadow-subtle transition cursor-pointer flex items-center justify-center"
            >
              <span>Create Account</span>
            </Link>
          )}
        </div>
      </section>

      {/* Methodology & State Machine Schematic */}
      <section className="border-y border-edge bg-panel py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs uppercase font-mono tracking-widest text-muted block mb-2">
              System Architecture
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-ink">
              The Four-Stage Autonomous Pipeline
            </h2>
            <div className="w-12 h-0.5 bg-forest mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Stage 1 */}
            <div className="bg-cream border border-edge p-5 rounded-[2px] shadow-subtle flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs text-muted block mb-2">Stage 01</span>
                <div className="w-8 h-8 rounded-[2px] bg-panel border border-edge flex items-center justify-center text-forest mb-3">
                  <Feather className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-base text-ink mb-1">Scoper Agent</h3>
                <p className="text-xs text-muted font-body leading-relaxed">
                  Interrogates the user's premise. Dynamically prompts for clarification if the inquiry is ambiguous.
                </p>
              </div>
              <div className="text-[10px] font-mono text-forest pt-4 mt-4 border-t border-edge/60">
                Human-in-the-Loop
              </div>
            </div>

            {/* Stage 2 */}
            <div className="bg-cream border border-edge p-5 rounded-[2px] shadow-subtle flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs text-muted block mb-2">Stage 02</span>
                <div className="w-8 h-8 rounded-[2px] bg-panel border border-edge flex items-center justify-center text-forest mb-3">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-base text-ink mb-1">Topic Planner</h3>
                <p className="text-xs text-muted font-body leading-relaxed">
                  Decomposes the core inquiry into parallel subtopic investigative briefs with target query strategies.
                </p>
              </div>
              <div className="text-[10px] font-mono text-forest pt-4 mt-4 border-t border-edge/60">
                Matrix Decomposition
              </div>
            </div>

            {/* Stage 3 */}
            <div className="bg-cream border border-edge p-5 rounded-[2px] shadow-subtle flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs text-muted block mb-2">Stage 03</span>
                <div className="w-8 h-8 rounded-[2px] bg-panel border border-edge flex items-center justify-center text-forest mb-3">
                  <Search className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-base text-ink mb-1">Parallel Workers</h3>
                <p className="text-xs text-muted font-body leading-relaxed">
                  Dispatches concurrent web probes across DuckDuckGo and Tavily to ingest peer-reviewed literature and recent news.
                </p>
              </div>
              <div className="text-[10px] font-mono text-forest pt-4 mt-4 border-t border-edge/60">
                Multi-Source Retrieval
              </div>
            </div>

            {/* Stage 4 */}
            <div className="bg-cream border border-edge p-5 rounded-[2px] shadow-subtle flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs text-muted block mb-2">Stage 04</span>
                <div className="w-8 h-8 rounded-[2px] bg-panel border border-edge flex items-center justify-center text-forest mb-3">
                  <Brain className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-base text-ink mb-1">Fact Synthesizer</h3>
                <p className="text-xs text-muted font-body leading-relaxed">
                  Cross-references claims, attaches verified bibliographic citations, and authors a publication-ready monograph.
                </p>
              </div>
              <div className="text-[10px] font-mono text-forest pt-4 mt-4 border-t border-edge/60">
                Verified Attribution
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Monographs Showcase */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-edge">
          <div>
            <span className="text-xs uppercase font-mono tracking-widest text-muted block mb-1">
              Sample Investigations
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-ink">
              Recent Exemplary Monographs
            </h2>
          </div>
          <Link
            to="/desk"
            className="text-xs font-serif font-bold text-forest hover:text-forest-hover flex items-center space-x-1 mt-2 sm:mt-0"
          >
            <span>Launch Your Inquiry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Sample 1 */}
          <div className="bg-panel border border-edge p-6 rounded-[2px] shadow-subtle flex flex-col justify-between hover:border-forest/50 transition">
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono text-muted mb-3">
                <span>INQUIRY TOPIC</span>
                <span>QUANTUM COMPUTING</span>
              </div>
              <h3 className="font-serif font-bold text-lg text-ink mb-2">
                Coherence Scaling Benchmarks in Trapped-Ion Quantum Architectures
              </h3>
              <p className="text-xs text-muted font-body leading-relaxed mb-4">
                Investigates fault-tolerant error thresholds, optical crosstalk mitigation, and commercialization roadmaps through 2028.
              </p>
            </div>
            <div className="pt-3 border-t border-edge flex items-center justify-between text-xs">
              <span className="font-mono text-[10px] text-forest font-semibold">Tavily + ArXiv</span>
              <Link
                to="/desk"
                className="font-serif font-bold text-forest hover:text-forest-hover hover:underline cursor-pointer flex items-center space-x-1"
              >
                <span>Investigate Topic →</span>
              </Link>
            </div>
          </div>

          {/* Sample 2 */}
          <div className="bg-panel border border-edge p-6 rounded-[2px] shadow-subtle flex flex-col justify-between hover:border-forest/50 transition">
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono text-muted mb-3">
                <span>INQUIRY TOPIC</span>
                <span>AGENTIC SYSTEMS</span>
              </div>
              <h3 className="font-serif font-bold text-lg text-ink mb-2">
                Comparative State Machine Design in Modern Multi-Agent Frameworks
              </h3>
              <p className="text-xs text-muted font-body leading-relaxed mb-4">
                Empirical architectural study evaluating LangGraph vs AutoGen vs CrewAI for cyclical state, error recovery, and concurrency.
              </p>
            </div>
            <div className="pt-3 border-t border-edge flex items-center justify-between text-xs">
              <span className="font-mono text-[10px] text-forest font-semibold">Peer-Reviewed</span>
              <Link
                to="/desk"
                className="font-serif font-bold text-forest hover:text-forest-hover hover:underline cursor-pointer flex items-center space-x-1"
              >
                <span>Investigate Topic →</span>
              </Link>
            </div>
          </div>

          {/* Sample 3 */}
          <div className="bg-panel border border-edge p-6 rounded-[2px] shadow-subtle flex flex-col justify-between hover:border-forest/50 transition">
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono text-muted mb-3">
                <span>INQUIRY TOPIC</span>
                <span>CLEANTECH</span>
              </div>
              <h3 className="font-serif font-bold text-lg text-ink mb-2">
                Sulfide-Based Solid-State Electrolytes: Dendrite Resistance & Cost
              </h3>
              <p className="text-xs text-muted font-body leading-relaxed mb-4">
                Technical feasibility and manufacturing scalability assessment for solid-state electric vehicle batteries.
              </p>
            </div>
            <div className="pt-3 border-t border-edge flex items-center justify-between text-xs">
              <span className="font-mono text-[10px] text-forest font-semibold">Empirical Data</span>
              <Link
                to="/desk"
                className="font-serif font-bold text-forest hover:text-forest-hover hover:underline cursor-pointer flex items-center space-x-1"
              >
                <span>Investigate Topic →</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Colophon / Footer */}
      <footer className="border-t border-edge bg-panel py-10 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-muted">
          <div className="flex items-center space-x-2">
            <span className="font-serif font-bold text-ink">Deep Research</span>
            <span>·</span>
            <span>Classic Editorial Edition</span>
          </div>
          <div>
            FastAPI · LangGraph · MongoDB Atlas · React 18
          </div>
        </div>
      </footer>
    </div>
  );
};
