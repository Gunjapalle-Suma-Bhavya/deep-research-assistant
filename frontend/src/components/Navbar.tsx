import React from 'react';
import { Settings, Bookmark, User as UserIcon, LogOut } from 'lucide-react';
import { SystemConfig, User, ViewRoute } from '../types';

interface NavbarProps {
  config: SystemConfig | null;
  historyCount: number;
  user: User | null;
  currentRoute: ViewRoute;
  onNavigate: (route: ViewRoute) => void;
  onSignOut: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  historyCount,
  user,
  currentRoute,
  onNavigate,
  onSignOut,
  onOpenSettings,
  onOpenHistory,
  onReset,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-edge bg-cream/95 backdrop-blur-sm transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Classic Editorial Masthead */}
        <div className="flex items-center space-x-6">
          <div 
            onClick={() => onNavigate('landing')}
            className="flex items-center space-x-3 cursor-pointer group"
            title="The Journal of Autonomous Inquiry"
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

          {/* Primary Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 font-serif text-xs font-bold pl-4 border-l border-edge">
            <button
              onClick={() => onNavigate('landing')}
              className={`px-3 py-1.5 rounded-[2px] transition cursor-pointer ${
                currentRoute === 'landing'
                  ? 'text-forest bg-panel border border-edge'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => {
                onNavigate('desk');
                onReset();
              }}
              className={`px-3 py-1.5 rounded-[2px] transition cursor-pointer ${
                currentRoute === 'desk'
                  ? 'text-forest bg-panel border border-edge'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Research Desk
            </button>
          </nav>
        </div>

        {/* Right: Actions & Auth State */}
        <div className="flex items-center space-x-2.5">
          
          {/* Engine Status Tag */}
          <button
            onClick={onOpenSettings}
            className="hidden sm:flex items-center space-x-2 px-2.5 py-1.5 rounded-[2px] bg-panel hover:bg-cream border border-edge text-xs font-mono transition text-ink shadow-subtle cursor-pointer"
            title="Configure model and search providers"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                config?.openai_configured ? 'bg-forest' : 'bg-amber-600'
              }`}
            />
            <span className="text-[11px] font-medium">
              {config?.openai_model || 'gpt-4o-mini'}
            </span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="px-2.5 sm:px-3 py-1.5 rounded-[2px] bg-panel hover:bg-cream text-ink border border-edge text-xs font-serif font-bold transition flex items-center space-x-1.5 shadow-subtle cursor-pointer"
            title="Settings & Diagnostics"
          >
            <Settings className="w-3.5 h-3.5 text-muted" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Archive Drawer Button */}
          <button
            onClick={onOpenHistory}
            className="px-2.5 sm:px-3 py-1.5 rounded-[2px] bg-panel hover:bg-cream text-ink border border-edge text-xs font-serif font-bold transition flex items-center space-x-1.5 shadow-subtle cursor-pointer"
            title="Archived Inquiries"
          >
            <Bookmark className="w-3.5 h-3.5 text-muted" />
            <span className="hidden sm:inline">Archive</span>
            <span className="px-1.5 py-0.2 rounded-[2px] bg-cream text-forest border border-edge text-[10px] font-mono">
              {historyCount}
            </span>
          </button>

          {/* User Auth Section */}
          {user ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-edge">
              <div
                className="flex items-center space-x-2 px-2.5 py-1 rounded-[2px] bg-cream border border-edge text-xs shadow-subtle"
                title={`Signed in as ${user.email}`}
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-5 h-5 rounded-[2px] border border-edge object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-[2px] bg-panel text-forest border border-edge flex items-center justify-center font-mono text-[10px] font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-serif font-bold text-ink max-w-[100px] truncate hidden sm:inline">
                  {user.name}
                </span>
              </div>
              <button
                onClick={onSignOut}
                className="p-1.5 rounded-[2px] bg-panel hover:bg-cream text-muted hover:text-rose-700 border border-edge transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 pl-2 border-l border-edge">
              <button
                onClick={() => onNavigate('login')}
                className="px-3 py-1.5 rounded-[2px] bg-panel hover:bg-cream text-ink border border-edge text-xs font-serif font-bold transition shadow-subtle cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('signup')}
                className="hidden sm:block px-3 py-1.5 rounded-[2px] bg-forest hover:bg-forest-hover text-cream text-xs font-serif font-bold transition shadow-subtle cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
