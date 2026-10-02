import React from 'react';
import { Compass, Settings, Library, Sun, Moon, Cpu } from 'lucide-react';
import { SystemConfig } from '../types';

interface NavbarProps {
  config: SystemConfig | null;
  historyCount: number;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  historyCount,
  isDark,
  onToggleTheme,
  onOpenSettings,
  onOpenHistory,
  onReset,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        
        {/* Left: Brand Identity */}
        <div 
          onClick={onReset}
          className="flex items-center space-x-2.5 cursor-pointer group"
          title="Start new research"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700/80 text-blue-400 flex items-center justify-center font-bold text-sm group-hover:border-blue-500 transition-colors shadow-sm">
            <Compass className="w-4 h-4 text-blue-400 group-hover:rotate-45 transition-transform duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm sm:text-base tracking-tight text-slate-100 flex items-center gap-1.5">
              Deep Research
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-blue-950 text-blue-400 border border-blue-800/60 rounded">
                Multi-Agent
              </span>
            </span>
          </div>
        </div>

        {/* Right: Actions & Indicators */}
        <div className="flex items-center space-x-2">
          
          {/* Engine Status Pill */}
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-xs font-mono transition text-slate-300"
            title="Configure model and search providers"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                config?.openai_configured ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50' : 'bg-amber-400'
              }`}
            />
            <Cpu className="w-3 h-3 text-slate-400" />
            <span className="text-[11px] font-medium hidden sm:inline">
              {config?.openai_model || 'gpt-4o-mini'}
            </span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition flex items-center space-x-1"
            title="Settings & API Keys"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Library / History Button */}
          <button
            onClick={onOpenHistory}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition flex items-center space-x-1.5"
            title="Research History"
          >
            <Library className="w-3.5 h-3.5 text-slate-400" />
            <span>Library</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono">
              {historyCount}
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent hover:border-slate-800 transition"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
          </button>

        </div>

      </div>
    </header>
  );
};
