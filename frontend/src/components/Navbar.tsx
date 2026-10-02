import React from 'react';
import { Compass, Settings, Library, Cpu, Bookmark } from 'lucide-react';
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
  onOpenSettings,
  onOpenHistory,
  onReset,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-edge bg-cream/95 backdrop-blur-sm transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Classic Editorial Masthead */}
        <div 
          onClick={onReset}
          className="flex items-center space-x-3 cursor-pointer group"
          title="Return to Research Desk"
        >
          <div className="w-8 h-8 rounded-[2px] bg-panel border border-edge text-forest flex items-center justify-center font-serif text-base font-bold shadow-subtle group-hover:border-forest transition-colors">
            DR
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline space-x-2">
              <span className="font-serif font-bold text-lg tracking-tight text-ink">
                Deep Research
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-muted border-l border-edge pl-2">
                Vol. I
              </span>
            </div>
            <span className="text-[11px] text-muted -mt-1 font-body italic">
              Autonomous Multi-Agent Investigation
            </span>
          </div>
        </div>

        {/* Right: Catalyst-Style Actions */}
        <div className="flex items-center space-x-2.5">
          
          {/* Engine Status Tag */}
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-2 px-2.5 py-1.5 rounded-[2px] bg-panel hover:bg-cream border border-edge text-xs font-mono transition text-ink shadow-subtle"
            title="Configure model and search providers"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                config?.openai_configured ? 'bg-forest' : 'bg-amber-600'
              }`}
            />
            <span className="text-[11px] font-medium hidden sm:inline">
              {config?.openai_model || 'gpt-4o-mini'}
            </span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="px-3 py-1.5 rounded-[2px] bg-panel hover:bg-cream text-ink border border-edge text-xs font-medium transition flex items-center space-x-1.5 shadow-subtle cursor-pointer"
            title="Settings & API Keys"
          >
            <Settings className="w-3.5 h-3.5 text-muted" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Library / Archive Button */}
          <button
            onClick={onOpenHistory}
            className="px-3 py-1.5 rounded-[2px] bg-panel hover:bg-cream text-ink border border-edge text-xs font-medium transition flex items-center space-x-1.5 shadow-subtle cursor-pointer"
            title="Research Archive"
          >
            <Bookmark className="w-3.5 h-3.5 text-muted" />
            <span>Archive</span>
            <span className="px-1.5 py-0.2 rounded-[2px] bg-cream text-forest border border-edge text-[10px] font-mono">
              {historyCount}
            </span>
          </button>

        </div>

      </div>
    </header>
  );
};
