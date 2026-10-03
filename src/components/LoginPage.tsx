import React, { useState } from 'react';
import { useAuth } from '../lib/store';

interface LoginPageProps {
  onNavigate: (tab: string) => void;
  onSuccessRedirect?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onSuccessRedirect = 'registration' }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
                className="w-full py-3 px-6 bg-primary-container text-on-primary-container font-headline-sm text-headline-sm uppercase tracking-wider font-bold rounded flex items-center justify-center gap-2 hover:bg-primary-fixed-dim transition-all shadow-[0_0_24px_rgba(240,117,9,0.35)] active:scale-[0.99] cursor-pointer mt-2"
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
    </div>
  );
};
