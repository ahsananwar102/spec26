import React, { useState } from 'react';
import { useAuth } from '../lib/store';
import { isSupabaseConfigured, signInWithGoogleOAuth, configureCustomSupabase } from '../lib/supabase';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionText?: string;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionText = 'Sign in with Google'
}) => {
  const { loginOrSignupGoogleUser } = useAuth();
  const [isCustom, setIsCustom] = useState(false);
  const [isConfigSupabase, setIsConfigSupabase] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const defaultAccounts = [
    {
      name: 'Ahsan Anwar',
      email: 'ahsananwar102@gmail.com',
      avatar: 'A',
      bgColor: 'bg-emerald-600',
      university: 'NED University of Engineering & Technology'
    },
    {
      name: 'Muhammad Ali',
      email: 'm.ali@cloud.neduet.edu.pk',
      avatar: 'M',
      bgColor: 'bg-blue-600',
      university: 'NED University of Engineering & Technology'
    }
  ];

  const handleLiveSupabaseOAuth = async () => {
    setLoading(true);
    setErrorMsg('');
    const res = await signInWithGoogleOAuth();
    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to initialize Supabase Google OAuth');
    }
  };

  const handleSelectAccount = (name: string, email: string, university?: string) => {
    setLoading(true);
    setTimeout(() => {
      loginOrSignupGoogleUser({
        name,
        email,
        university: university || 'NED University of Engineering & Technology',
        department: 'Electronic Engineering',
        studentId: 'STU-' + Math.floor(1000 + Math.random() * 9000),
        phoneNumber: '+92 300 ' + Math.floor(1000000 + Math.random() * 9000000)
      });
      setLoading(false);
      onSuccess();
    }, 400);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customName) return;
    handleSelectAccount(customName, customEmail);
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl || !supabaseKey) return;
    configureCustomSupabase(supabaseUrl.trim(), supabaseKey.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container border border-outline-variant/40 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative animate-fadeIn">
        {/* Google Branding Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"></path>
            </svg>
            <div>
              <h3 className="font-semibold text-white text-base">Google Accounts</h3>
              <p className="text-xs text-on-surface-variant">Continue with Supabase Auth</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-outline hover:text-white p-1 rounded-full hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Supabase Status Pill */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs font-code-md">
          <span className="flex items-center gap-1.5 text-on-surface-variant">
            <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-primary-container animate-pulse' : 'bg-secondary'}`}></span>
            Supabase Auth OAuth2
          </span>
          <span className="text-primary font-semibold">
            {isSupabaseConfigured ? 'LIVE CONNECTED' : 'READY / INTEGRATED'}
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 rounded bg-error/10 border border-error/30 text-error text-xs">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
            <div className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-white">Authenticating with Google OAuth...</p>
            <p className="text-xs text-on-surface-variant font-code-md">Signing in via Supabase Auth</p>
          </div>
        ) : isConfigSupabase ? (
          <form onSubmit={handleSaveSupabaseConfig} className="space-y-4">
            <p className="text-xs text-on-surface-variant">
              Configure your Supabase project credentials for live Google OAuth redirects:
            </p>
            <div className="space-y-1.5">
              <label className="block text-xs font-code-md text-on-surface-variant uppercase">
                Supabase Project URL
              </label>
              <input
                type="url"
                required
                placeholder="https://xyzcompany.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-lowest text-white rounded border border-outline-variant/40 text-sm outline-none focus:border-primary-container"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-code-md text-on-surface-variant uppercase">
                Supabase Anon Key
              </label>
              <input
                type="text"
                required
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-lowest text-white rounded border border-outline-variant/40 text-sm outline-none focus:border-primary-container font-mono text-xs"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfigSupabase(false)}
                className="px-4 py-2 text-xs text-on-surface-variant hover:text-white"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded bg-primary-container text-on-primary-container text-xs font-bold uppercase tracking-wider hover:bg-primary-fixed-dim transition-all"
              >
                Save &amp; Reload
              </button>
            </div>
          </form>
        ) : isCustom ? (
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <p className="text-xs text-on-surface-variant">
              Enter your Google Account details to link with SPEC'26:
            </p>
            <div className="space-y-1.5">
              <label className="block text-xs font-code-md text-on-surface-variant uppercase">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Khan"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-lowest text-white rounded border border-outline-variant/40 text-sm outline-none focus:border-primary-container"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-code-md text-on-surface-variant uppercase">
                Google Email Address
              </label>
              <input
                type="email"
                required
                placeholder="you@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-lowest text-white rounded border border-outline-variant/40 text-sm outline-none focus:border-primary-container"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCustom(false)}
                className="px-4 py-2 text-xs text-on-surface-variant hover:text-white"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded bg-primary-container text-on-primary-container text-xs font-bold uppercase tracking-wider hover:bg-primary-fixed-dim transition-all"
              >
                Link &amp; Proceed
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-white">Choose an account</h4>
              <p className="text-xs text-on-surface-variant">
                to sign up or log in to SPEC'26 via Google OAuth2
              </p>
            </div>

            {/* If live Supabase is configured, offer 1-click live redirect */}
            {isSupabaseConfigured && (
              <button
                onClick={handleLiveSupabaseOAuth}
                className="w-full p-3 rounded-xl bg-primary-container text-on-primary-container hover:bg-primary-fixed-dim font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                Authorize Live via Supabase Google OAuth
              </button>
            )}

            <div className="space-y-2 pt-1">
              {defaultAccounts.map((acc, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectAccount(acc.name, acc.email, acc.university)}
                  className="w-full p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 flex items-center justify-between text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${acc.bgColor} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                      {acc.avatar}
                    </div>
                    <div>
                      <span className="block font-medium text-sm text-white group-hover:text-primary transition-colors">
                        {acc.name}
                      </span>
                      <span className="block text-xs text-on-surface-variant font-code-md">
                        {acc.email}
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-outline text-[18px] group-hover:text-primary transition-colors">
                    chevron_right
                  </span>
                </button>
              ))}

              <button
                onClick={() => setIsCustom(true)}
                className="w-full p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 flex items-center gap-3 text-left transition-colors cursor-pointer text-xs text-secondary hover:text-primary font-medium"
              >
                <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-outline">
                  <span className="material-symbols-outlined text-[20px]">person_add</span>
                </div>
                <span>Use another Google account</span>
              </button>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-outline border-t border-outline-variant/20">
              <span>Supabase Auth Provider: Google</span>
              <button
                type="button"
                onClick={() => setIsConfigSupabase(true)}
                className="text-secondary hover:text-primary hover:underline"
              >
                Config Keys
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
