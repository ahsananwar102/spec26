import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/store';

interface ResetPasswordPageProps {
  initialMode?: 'request' | 'reset';
  onNavigate: (tab: string) => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  initialMode = 'request',
  onNavigate,
}) => {
  const { requestPasswordReset, verifyResetToken, completePasswordReset } = useAuth();

  // Mode: 'request' (enter email to get reset link) | 'reset' (enter new password)
  const [mode, setMode] = useState<'request' | 'reset'>(initialMode);

  // Request form state
  const [emailInput, setEmailInput] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [generatedLinkInfo, setGeneratedLinkInfo] = useState<{
    email: string;
    isSupabase: boolean;
  } | null>(null);

  // Reset form state
  const [targetEmail, setTargetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenInvalid, setTokenInvalid] = useState(false);

  // Parse URL query/hash parameters on mount or hash change
  useEffect(() => {
    const parseUrlParams = () => {
      let queryStr = '';
      if (window.location.hash.includes('?')) {
        queryStr = window.location.hash.split('?')[1];
      } else if (window.location.search) {
        queryStr = window.location.search.replace(/^\?/, '');
      }

      const params = new URLSearchParams(queryStr);
      const emailParam = params.get('email') || '';
      const tokenParam = params.get('token') || '';
      const isRecovery = window.location.hash.includes('type=recovery') || queryStr.includes('type=recovery');

      if (tokenParam || isRecovery || initialMode === 'reset') {
        setMode('reset');
        if (emailParam) setTargetEmail(emailParam);
        if (tokenParam) {
          setResetToken(tokenParam);
          // Check if token is valid locally (if not Supabase recovery)
          if (!isRecovery && emailParam) {
            const valid = verifyResetToken(emailParam, tokenParam);
            if (!valid) {
              setTokenInvalid(true);
            } else {
              setTokenInvalid(false);
            }
          }
        }
      }
    };

    parseUrlParams();
    window.addEventListener('hashchange', parseUrlParams);
    return () => window.removeEventListener('hashchange', parseUrlParams);
  }, [initialMode, verifyResetToken]);

  // Handle request password reset
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError(null);
    setRequestLoading(true);

    try {
      const result = await requestPasswordReset(emailInput);
      setRequestLoading(false);

      if (result.success) {
        setRequestSuccess(true);
        setGeneratedLinkInfo({
          email: emailInput.toLowerCase().trim(),
          isSupabase: Boolean(result.isSupabase),
        });
      } else {
        setRequestError(result.error || 'Failed to dispatch reset link. Please try again.');
      }
    } catch (err: any) {
      setRequestLoading(false);
      setRequestError(err?.message || 'An unexpected error occurred. Please try again.');
    }
  };

  // Handle set new password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters in length.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match. Please verify both fields.');
      return;
    }

    if (!targetEmail) {
      setResetError('Account email is required. Please request a new reset link.');
      return;
    }

    setResetLoading(true);
    try {
      const result = await completePasswordReset(targetEmail, newPassword, resetToken || undefined);
      setResetLoading(false);

      if (result.success) {
        setResetSuccess(true);
      } else {
        setResetError(result.error || 'Failed to update password. Link may have expired.');
      }
    } catch (err: any) {
      setResetLoading(false);
      setResetError(err?.message || 'An error occurred while resetting your password.');
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 py-16 lg:py-24 flex items-center justify-center flex-1">
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-surface-container border border-outline-variant/30 p-8 sm:p-10 rounded-2xl shadow-2xl relative backdrop-blur-sm">

          {/* ============================================================= */}
          {/* MODE 1: REQUEST RESET LINK */}
          {/* ============================================================= */}
          {mode === 'request' && !requestSuccess && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-container/20 text-primary border border-primary-container/40 mb-2">
                  <span className="material-symbols-outlined text-[26px]">lock_reset</span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-white font-bold tracking-tight">
                  Forgot Password?
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mx-auto">
                  Enter your registered account email and we'll send you a secure link to reset your password.
                </p>
              </div>

              {requestError && (
                <div className="p-4 rounded-xl bg-error/15 border border-error/40 text-error text-xs flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px] shrink-0">error</span>
                  <span>{requestError}</span>
                </div>
              )}

              <form onSubmit={handleRequestSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block font-body-sm text-body-sm text-on-surface font-medium" htmlFor="reset-email">
                    Account Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="reset-email"
                      type="email"
                      required
                      autoFocus
                      placeholder="you@example.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full px-4 py-3 pl-11 bg-surface-container-lowest text-on-surface border border-outline-variant/30 placeholder:text-outline-variant rounded-lg font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary-container transition-all"
                    />
                    <span className="material-symbols-outlined absolute left-3.5 top-3 text-outline text-[20px]">
                      mail
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={requestLoading}
                  className="w-full py-3.5 px-4 bg-primary-container text-on-primary-container font-headline-sm text-xs uppercase tracking-wider font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-primary-fixed-dim transition-all shadow-[0_0_20px_rgba(0,240,255,0.25)] cursor-pointer disabled:opacity-60"
                >
                  {requestLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-on-primary-container/30 border-t-on-primary-container rounded-full animate-spin"></div>
                      <span>Dispatching Link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Password Reset Link</span>
                      <span className="material-symbols-outlined text-[18px]">send</span>
                    </>
                  )}
                </button>
              </form>

              <div className="pt-4 border-t border-outline-variant/20 text-center">
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="inline-flex items-center gap-1.5 text-xs font-code-md text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  <span>Back to Sign In</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* MODE 1 (SUCCESS): EMAIL DISPATCHED NOTIFICATION */}
          {/* ============================================================= */}
          {mode === 'request' && requestSuccess && generatedLinkInfo && (
            <div className="space-y-6 text-center animate-fadeIn">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="material-symbols-outlined text-[32px]">mark_email_read</span>
              </div>

              <div className="space-y-2">
                <h2 className="font-headline-lg text-headline-lg font-bold text-white tracking-tight">
                  Check Your Inbox
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
                  We have dispatched a password reset link to:
                </p>
                <div className="inline-block px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/40 font-code-md text-primary text-xs font-semibold">
                  {generatedLinkInfo.email}
                </div>
              </div>

              {generatedLinkInfo.isSupabase ? (
                <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-left text-xs text-on-surface-variant space-y-1.5">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>Email Sent via Supabase Auth</span>
                  </div>
                  <p>
                    Please click the recovery link in the email to set your new password. Remember to check your spam/junk folder if it doesn't arrive within 2 minutes.
                  </p>
                </div>
              ) : null}

              {/* Secure Notification Notice */}
              <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-left text-xs text-on-surface-variant space-y-2">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <span className="material-symbols-outlined text-[16px]">security</span>
                  <span>Security Notice</span>
                </div>
                <p>
                  For account protection, password recovery instructions are dispatched directly to the registered email address. Please click the verification link inside your email to choose a new password.
                </p>
                <p className="text-[11px] text-outline">
                  Didn't receive the email? Check your junk/spam folder or ensure you entered the exact email address used during registration.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-4 text-xs font-code-md">
                <button
                  type="button"
                  onClick={() => {
                    setRequestSuccess(false);
                    setEmailInput('');
                  }}
                  className="text-on-surface-variant hover:text-white transition-colors cursor-pointer"
                >
                  Try another email
                </button>
                <span className="text-outline/40">•</span>
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="text-primary hover:underline transition-colors cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* MODE 2: SET NEW PASSWORD */}
          {/* ============================================================= */}
          {mode === 'reset' && !resetSuccess && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-container/20 text-primary border border-primary-container/40 mb-2">
                  <span className="material-symbols-outlined text-[26px]">vpn_key</span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-white font-bold tracking-tight">
                  Create New Password
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Set a new, secure password for your SPEC'26 account.
                </p>
                {targetEmail && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/40 font-code-md text-xs text-primary">
                    <span className="material-symbols-outlined text-[14px]">account_circle</span>
                    <span>{targetEmail}</span>
                  </div>
                )}
              </div>

              {tokenInvalid ? (
                <div className="p-6 rounded-xl bg-error/15 border border-error/40 text-center space-y-3">
                  <span className="material-symbols-outlined text-error text-[36px]">link_off</span>
                  <div className="space-y-1">
                    <h3 className="font-bold text-white text-sm">Expired or Invalid Reset Link</h3>
                    <p className="text-xs text-error/90 leading-relaxed">
                      This password reset token has expired or is invalid. Reset links remain active for 1 hour for security.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('request');
                      setTokenInvalid(false);
                    }}
                    className="py-2 px-4 rounded bg-surface-container hover:bg-surface-container-high text-xs text-white border border-outline-variant/40 transition-colors inline-flex items-center gap-1.5 cursor-pointer mt-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                    <span>Request New Reset Link</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetSubmit} className="space-y-5">
                  {!targetEmail && (
                    <div className="space-y-1.5">
                      <label className="block font-body-sm text-body-sm text-on-surface font-medium" htmlFor="target-email">
                        Verify Account Email
                      </label>
                      <input
                        id="target-email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={targetEmail}
                        onChange={(e) => setTargetEmail(e.target.value)}
                        className="w-full px-4 py-2.5 bg-surface-container-lowest text-on-surface border border-outline-variant/30 placeholder:text-outline-variant rounded font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary-container"
                      />
                    </div>
                  )}

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="block font-body-sm text-body-sm text-on-surface font-medium" htmlFor="new-password">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        placeholder="••••••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2.5 bg-surface-container-lowest text-on-surface border border-outline-variant/30 placeholder:text-outline-variant rounded font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary-container pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-outline hover:text-white transition-colors cursor-pointer"
                        title={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showNewPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="block font-body-sm text-body-sm text-on-surface font-medium" htmlFor="confirm-password">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        placeholder="••••••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2.5 bg-surface-container-lowest text-on-surface border border-outline-variant/30 placeholder:text-outline-variant rounded font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary-container pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-outline hover:text-white transition-colors cursor-pointer"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showConfirmPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Password Rules Checklist */}
                  <div className="p-3 rounded-lg bg-surface-container-lowest/60 border border-outline-variant/30 space-y-1.5 text-xs">
                    <div className={`flex items-center gap-2 ${newPassword.length >= 6 ? 'text-emerald-400 font-medium' : 'text-on-surface-variant'}`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {newPassword.length >= 6 ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>At least 6 characters long</span>
                    </div>
                    <div className={`flex items-center gap-2 ${confirmPassword && newPassword === confirmPassword ? 'text-emerald-400 font-medium' : 'text-on-surface-variant'}`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {confirmPassword && newPassword === confirmPassword ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>Passwords match exactly</span>
                    </div>
                  </div>

                  {resetError && (
                    <div className="p-3.5 rounded-xl bg-error/15 border border-error/40 text-error text-xs flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                      <span>{resetError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={resetLoading || newPassword.length < 6 || newPassword !== confirmPassword}
                    className="w-full py-3.5 px-4 bg-primary-container text-on-primary-container font-headline-sm text-xs uppercase tracking-wider font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-primary-fixed-dim transition-all shadow-[0_0_20px_rgba(0,240,255,0.25)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resetLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-on-primary-container/30 border-t-on-primary-container rounded-full animate-spin"></div>
                        <span>Securing New Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Update Account Password</span>
                        <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setMode('request')}
                      className="text-xs font-code-md text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                    >
                      Request another reset link instead
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* MODE 2 (SUCCESS): PASSWORD RESET COMPLETE */}
          {/* ============================================================= */}
          {mode === 'reset' && resetSuccess && (
            <div className="space-y-6 text-center animate-fadeIn">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <span className="material-symbols-outlined text-[36px]">check_circle</span>
              </div>

              <div className="space-y-2">
                <h2 className="font-headline-lg text-headline-lg font-bold text-white tracking-tight">
                  Password Successfully Reset!
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mx-auto">
                  Your SPEC'26 account password has been updated. You can now log into your account using your new credentials.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs text-on-surface-variant">
                <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold mb-1">
                  <span className="material-symbols-outlined text-[16px]">security</span>
                  <span>Account Protected</span>
                </div>
                <span>All active sessions have been refreshed with your new security token.</span>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="w-full py-3.5 px-4 bg-primary-container text-on-primary-container font-headline-sm text-xs uppercase tracking-wider font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-primary-fixed-dim transition-all shadow-[0_0_20px_rgba(0,240,255,0.25)] cursor-pointer"
              >
                <span>Proceed to Sign In</span>
                <span className="material-symbols-outlined text-[18px]">login</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
