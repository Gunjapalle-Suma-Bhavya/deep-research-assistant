import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Feather,
  AlertCircle,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  Shield,
  BookOpen,
} from 'lucide-react';
import { api } from '../services/api';
import { User, ViewRoute } from '../types';

interface AuthViewProps {
  initialMode: 'login' | 'signup';
  onAuthSuccess: (user: User, token: string) => void;
  onNavigate?: (route: ViewRoute) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialMode,
  onAuthSuccess,
  onNavigate,
}) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string>('388286246201-gre0e94ag0mqkptb4buhsbv6j7mmtfsk.apps.googleusercontent.com');

  // Query server for runtime Google Client ID configuration
  React.useEffect(() => {
    let isMounted = true;
    api.getAuthStatus().then((status) => {
      if (isMounted && status.google_client_id) {
        setGoogleClientId(status.google_client_id);
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response || !response.credential) {
      setError('Google Sign-In was cancelled or failed to provide credential token.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res = await api.googleAuth({
        credential: response.credential,
      });
      localStorage.setItem('dr_token', res.access_token);
      onAuthSuccess(res.user, res.access_token);
    } catch (err: any) {
      setError(err.message || 'Google verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger strictly live dynamic Google Sign-In via official GIS popup prompt
  const triggerGoogleSignIn = () => {
    setError(null);
    const google = (window as any).google;
    if (!google || !google.accounts || !google.accounts.id) {
      setError('Google Identity Service is loading or blocked by a browser extension. Please check your connection or disable ad-blockers for Google OAuth.');
      return;
    }

    try {
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Prompt user with official Google account chooser
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
          setError('Google popup was suppressed by browser. Please enable popups or third-party cookies for Google authentication.');
        }
      });
    } catch (err: any) {
      setError(`Unable to launch Google Sign-In: ${err.message || err}`);
    }
  };

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

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-cream text-ink font-body">
      {/* LEFT COLUMN: Editorial Showcase & Academic Brand Pillar (Desktop 45%) */}
      <div className="hidden lg:flex lg:w-5/12 bg-forest text-cream p-12 flex-col justify-between relative overflow-hidden border-r border-edge select-none">
        {/* Subtle background ornamentation */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-forest-hover/60 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Publication Emblem */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center space-x-3 cursor-pointer">
            <div className="w-9 h-9 rounded-[2px] bg-cream text-forest flex items-center justify-center font-serif text-lg font-bold shadow-subtle">
              DR
            </div>
            <div>
              <span className="font-serif font-bold text-xl tracking-tight block text-cream">
                Deep Research
              </span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-cream/70 block -mt-1">
                The Journal of Autonomous Inquiry · Vol. I
              </span>
            </div>
          </Link>
        </div>

        {/* Middle: Editorial Trust Manifesto */}
        <div className="relative z-10 my-auto py-12 max-w-md">
          <div className="w-8 h-0.5 bg-cream/40 mb-6" />
          <blockquote className="font-serif text-2xl font-normal leading-relaxed text-cream/95 italic mb-6">
            "An autonomous research desk engineered for researchers and analysts who demand genuine empirical depth, verified web citations, and structured reasoning."
          </blockquote>
          <div className="text-xs font-mono text-cream/80 uppercase tracking-wider">
            Autonomous Cyclical Synthesis
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 gap-3 mt-10 pt-8 border-t border-cream/20">
            <div className="p-3 rounded-[2px] bg-forest-hover/80 border border-cream/15">
              <span className="font-serif font-bold text-lg text-cream block">Live Web</span>
              <span className="text-[11px] text-cream/70 font-body">Tavily & DuckDuckGo</span>
            </div>
            <div className="p-3 rounded-[2px] bg-forest-hover/80 border border-cream/15">
              <span className="font-serif font-bold text-lg text-cream block">LangGraph</span>
              <span className="text-[11px] text-cream/70 font-body">Cyclical State Engine</span>
            </div>
          </div>
        </div>

        {/* Bottom Colophon */}
        <div className="relative z-10 text-xs font-mono text-cream/60 flex items-center justify-between">
          <span>FastAPI · MongoDB Atlas · React 18</span>
          <span>Encrypted Session Protocol</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Professional Authentication Desk (Desktop 55%) */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-16 max-w-xl mx-auto w-full">
        {/* Top Navbar Row */}
        <div className="flex items-center justify-between pb-8">
          <div className="lg:hidden flex items-center space-x-2">
            <span className="font-serif font-bold text-lg text-ink">Deep Research</span>
          </div>
          <Link
            to="/"
            className="text-xs font-serif font-bold text-muted hover:text-forest transition flex items-center space-x-1 cursor-pointer ml-auto"
          >
            <span>← Return to Homepage</span>
          </Link>
        </div>

        {/* Main Authentication Box */}
        <div className="my-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-[2px] bg-panel border border-edge text-forest text-xs font-mono mb-3">
              <Feather className="w-3.5 h-3.5" />
              <span>Researcher Access Protocol</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-ink tracking-tight">
              {mode === 'login' ? 'Sign In to Workspace' : 'Create Researcher Account'}
            </h2>
            <p className="text-sm text-muted font-body italic mt-1.5 leading-relaxed">
              {mode === 'login'
                ? 'Enter your institutional or personal credentials to access your autonomous research desk.'
                : 'Join the autonomous research engine to initiate and archive publication-grade monographs.'}
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex border-b border-edge mb-6 font-serif text-sm">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2.5 text-center border-b-2 transition font-bold cursor-pointer ${
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
              className={`flex-1 py-2.5 text-center border-b-2 transition font-bold cursor-pointer ${
                mode === 'signup'
                  ? 'border-forest text-forest'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Official Google Sign-In Button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={triggerGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3.5 px-4 py-3 rounded-[2px] bg-cream hover:bg-panel border border-edge text-ink text-sm font-serif font-bold transition shadow-subtle cursor-pointer disabled:opacity-50 group hover:border-forest"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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

            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-edge" />
              <span className="px-3.5 text-xs font-mono text-muted uppercase">or continue with email</span>
              <div className="flex-1 border-t border-edge" />
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-[2px] bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-body">
            {mode === 'signup' && (
              <div>
                <label className="block font-serif font-bold text-ink mb-1.5 text-xs">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-muted" />
                  <input
                    type="text"
                    placeholder="e.g. Dr. Eleanor Vance"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-panel text-ink placeholder-muted/60 pl-10 pr-3 py-2.5 rounded-[2px] border border-edge focus:border-forest outline-none text-sm font-body shadow-subtle"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-serif font-bold text-ink mb-1.5 text-xs">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-muted" />
                <input
                  type="email"
                  placeholder="researcher@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-panel text-ink placeholder-muted/60 pl-10 pr-3 py-2.5 rounded-[2px] border border-edge focus:border-forest outline-none text-sm font-body shadow-subtle"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-serif font-bold text-ink text-xs">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => alert('Password reset link will be sent to your verified email address.')}
                    className="text-[11px] font-serif text-muted hover:text-forest transition"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-panel text-ink placeholder-muted/60 pl-10 pr-10 py-2.5 rounded-[2px] border border-edge focus:border-forest outline-none font-mono text-xs shadow-subtle"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-muted hover:text-ink transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block font-serif font-bold text-ink mb-1.5 text-xs">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-panel text-ink placeholder-muted/60 pl-10 pr-10 py-2.5 rounded-[2px] border border-edge focus:border-forest outline-none font-mono text-xs shadow-subtle"
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="rememberDevice"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="accent-[#2A4736] rounded-[2px] border-edge cursor-pointer"
                />
                <label htmlFor="rememberDevice" className="text-xs text-muted font-body cursor-pointer">
                  Remember this device for 30 days
                </label>
              </div>
            )}

            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-[2px] bg-forest hover:bg-forest-hover text-cream font-serif font-bold text-sm tracking-wide shadow-subtle transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <span>
                  {isLoading
                    ? 'Authenticating...'
                    : mode === 'login'
                    ? 'Sign In to Workspace'
                    : 'Create Researcher Account'}
                </span>
                <ArrowRight className="w-4 h-4 text-cream" />
              </button>
            </div>
          </form>

          {/* Mode Switch Helper */}
          <div className="mt-7 text-center text-xs text-muted font-body">
            {mode === 'login' ? (
              <span>
                New to Deep Research?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className="font-serif font-bold text-forest hover:underline ml-1 cursor-pointer"
                >
                  Create an account
                </button>
              </span>
            ) : (
              <span>
                Already have an established workspace?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="font-serif font-bold text-forest hover:underline ml-1 cursor-pointer"
                >
                  Sign in here
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Footer Colophon */}
        <div className="pt-8 text-center text-[11px] text-muted font-mono border-t border-edge/60">
          By proceeding, you agree to the Academic Integrity Charter and Privacy Guidelines.
        </div>
      </div>
    </div>
  );
};
