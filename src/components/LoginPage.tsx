import React, { useState } from 'react';
import { useAuth } from '../lib/store';
import { GoogleAuthModal } from './GoogleAuthModal';

interface LoginPageProps {
  onNavigate: (tab: string) => void;
  onSuccessRedirect?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onSuccessRedirect = 'registration' }) => {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  const handleGoogleAuth = async () => {
    setLoading(true);
    const res = await loginWithGoogle();
    setLoading(false);
    if (res.isMock || res.error) {
      setIsGoogleModalOpen(true);
    }
  };

  const handleLogin = async (userEmail: string, userPwd?: string) => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await login(userEmail, userPwd);
      setLoading(false);
      if (res.success) {
        onNavigate(onSuccessRedirect);
      } else {
        setErrorMsg(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch {
      setLoading(false);
      setErrorMsg('Authentication error. Please check your connection.');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    handleLogin(email, password);
  };

  return (
    <div className="w-full px-4 sm:px-6 py-16 lg:py-24 flex items-center justify-center flex-1">
      <div className="w-full max-w-md mx-auto my-6">
        <div className="bg-surface-container border border-outline-variant/30 p-8 sm:p-10 rounded-xl shadow-2xl relative">
          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
              Welcome Back
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Log in to manage your SPEC'26 competition entries.
            </p>
          </div>

          <div className="space-y-4">
            {/* Continue with Google button */}
            <button
              onClick={handleGoogleAuth}
              className="w-full py-3 px-4 bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 text-on-surface font-body-sm text-body-sm font-medium rounded flex items-center justify-center gap-3 transition-colors cursor-pointer group shadow-sm hover:border-outline-variant/60"
              type="button"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"></path>
              </svg>
              <span className="font-medium">Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="w-full h-px bg-outline-variant/30"></div>
              <span className="px-3 bg-surface-container text-outline text-body-sm font-normal">
                or continue with email
              </span>
            </div>

            {/* Form */}
            <form className="space-y-5" onSubmit={handleFormSubmit}>
              <div className="space-y-1.5">
                <label className="block font-body-sm text-body-sm text-on-surface font-medium" htmlFor="email">
                  Email Address
                </label>
                <input
                  className="w-full px-4 py-2.5 bg-surface-container-lowest text-on-surface border border-outline-variant/30 placeholder:text-outline-variant font-body-md text-body-md rounded focus:outline-none focus:ring-1 focus:ring-primary-container transition-all"
                  id="email"
                  name="email"
                  autoComplete="username"
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-body-sm text-body-sm text-on-surface font-medium" htmlFor="password">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => onNavigate('forgot-password')}
                    className="font-body-sm text-body-sm text-secondary hover:text-primary transition-colors hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    className="w-full px-4 py-2.5 bg-surface-container-lowest text-on-surface border border-outline-variant/30 placeholder:text-outline-variant font-body-md text-body-md rounded focus:outline-none focus:ring-1 focus:ring-primary-container transition-all pr-10"
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-outline hover:text-white transition-colors cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                  <div className="relative flex items-center justify-center">
                    <input
                      className="sr-only peer"
                      id="rememberMe"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <div className="w-4 h-4 bg-surface-container-lowest border border-outline-variant/40 rounded peer-checked:bg-primary-container peer-checked:border-primary-container transition-all"></div>
                    <span className="material-symbols-outlined text-on-primary-container text-[14px] absolute pointer-events-none opacity-0 peer-checked:opacity-100 font-bold">
                      check
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                    Remember me
                  </span>
                </label>
              </div>

              {errorMsg && (
                <div className="p-3 rounded bg-error/10 border border-error/30 text-error text-xs">
                  {errorMsg}
                </div>
              )}

              <button
                className="w-full py-3 px-6 bg-primary-container text-on-primary-container font-headline-sm text-headline-sm uppercase tracking-wider font-bold rounded flex items-center justify-center gap-2 hover:bg-primary-fixed-dim transition-all shadow-[0_0_24px_rgba(0,240,255,0.35)] active:scale-[0.99] cursor-pointer mt-2"
                type="submit"
                disabled={loading}
              >
                <span>{loading ? 'Authenticating...' : 'Log In to SPEC\'26'}</span>
              </button>
            </form>
          </div>


          {/* Footer Link */}
          <div className="mt-6 text-center pt-4 border-t border-outline-variant/20">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="text-primary-container font-semibold hover:underline ml-1 inline-flex items-center gap-1 group cursor-pointer"
              >
                Sign Up
                <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">
                  north_east
                </span>
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Google Auth Modal */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSuccess={() => {
          setIsGoogleModalOpen(false);
          onNavigate(onSuccessRedirect);
        }}
        actionText="Continue with Google"
      />
    </div>
  );
};
