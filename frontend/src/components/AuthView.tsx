import React, { useState } from 'react';
import { ArrowRight, Feather, AlertCircle, Lock, Mail, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { User, ViewRoute } from '../types';

interface AuthViewProps {
  initialMode: 'login' | 'signup';
  onAuthSuccess: (user: User, token: string) => void;
  onNavigate: (route: ViewRoute) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialMode,
  onAuthSuccess,
  onNavigate,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please provide your email address and password.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (mode === 'signup') {
        const res = await api.signup({
          name: name.trim(),
          email: email.trim(),
          password,
        });
        localStorage.setItem('dr_token', res.access_token);
        onAuthSuccess(res.user, res.access_token);
      } else {
        const res = await api.login({
          email: email.trim(),
          password,
        });
        localStorage.setItem('dr_token', res.access_token);
        onAuthSuccess(res.user, res.access_token);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      // Prompt user or use Google Identity simulated exchange
      const mockGoogleEmail = prompt('Enter your Google Account email to authenticate:', email || 'researcher@gmail.com');
      if (!mockGoogleEmail) {
        setIsLoading(false);
        return;
      }

      const res = await api.googleAuth({
        email: mockGoogleEmail,
        name: mockGoogleEmail.split('@')[0].replace(/[._]/g, ' '),
        picture: 'https://lh3.googleusercontent.com/a/default-user',
      });

      localStorage.setItem('dr_token', res.access_token);
      onAuthSuccess(res.user, res.access_token);
    } catch (err: any) {
      setError(err.message || 'Google Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 font-body">
      <div className="max-w-md w-full bg-panel border border-edge rounded-[2px] p-7 sm:p-9 shadow-subtle">
        {/* Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-[2px] bg-cream border border-edge text-forest text-xs font-mono mb-3 shadow-subtle">
            <Feather className="w-3.5 h-3.5" />
            <span>Editorial Workspace Account</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-ink">
            {mode === 'login' ? 'Sign In to Workspace' : 'Create Researcher Account'}
          </h2>
          <p className="text-xs text-muted font-body italic mt-1">
            {mode === 'login'
              ? 'Access your archived investigations and customized research briefs.'
              : 'Join the autonomous research engine powered by LangGraph.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-edge mb-6 font-serif text-sm">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-center border-b-2 transition font-bold cursor-pointer ${
              mode === 'login'
                ? 'border-forest text-forest'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 py-2 text-center border-b-2 transition font-bold cursor-pointer ${
              mode === 'signup'
                ? 'border-forest text-forest'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Google Authentication Button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-3 px-4 py-2.5 rounded-[2px] bg-cream hover:bg-panel border border-edge text-ink text-xs font-serif font-bold transition shadow-subtle cursor-pointer disabled:opacity-50"
          >
            {/* Official Google 'G' Mark */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center my-5">
            <div className="flex-1 border-t border-edge" />
            <span className="px-3 text-[11px] font-mono text-muted uppercase">or continue with email</span>
            <div className="flex-1 border-t border-edge" />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-[2px] bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'signup' && (
            <div>
              <label className="block font-serif font-bold text-ink mb-1.5">Full Name</label>
              <div className="relative">
                <UserIcon className="w-3.5 h-3.5 absolute left-3 top-3 text-muted" />
                <input
                  type="text"
                  placeholder="e.g. Dr. Eleanor Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-cream text-ink placeholder-muted/60 pl-8 pr-3 py-2.5 rounded-[2px] border border-edge focus:border-forest outline-none font-body shadow-subtle"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-serif font-bold text-ink mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-muted" />
              <input
                type="email"
                placeholder="researcher@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-cream text-ink placeholder-muted/60 pl-8 pr-3 py-2.5 rounded-[2px] border border-edge focus:border-forest outline-none font-body shadow-subtle"
              />
            </div>
          </div>

          <div>
            <label className="block font-serif font-bold text-ink mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-muted" />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-cream text-ink placeholder-muted/60 pl-8 pr-3 py-2.5 rounded-[2px] border border-edge focus:border-forest outline-none font-mono text-xs shadow-subtle"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block font-serif font-bold text-ink mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-muted" />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-cream text-ink placeholder-muted/60 pl-8 pr-3 py-2.5 rounded-[2px] border border-edge focus:border-forest outline-none font-mono text-xs shadow-subtle"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-[2px] bg-forest hover:bg-forest-hover text-cream font-serif font-bold text-sm tracking-wide shadow-subtle transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Authenticating...' : mode === 'login' ? 'Sign In to Workspace' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4 text-cream" />
            </button>
          </div>
        </form>

        {/* Back Link */}
        <div className="mt-6 pt-4 border-t border-edge text-center text-xs text-muted">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="hover:text-forest underline cursor-pointer"
          >
            ← Return to Homepage
          </button>
        </div>
      </div>
    </div>
  );
};
