import React, { useState } from 'react';
import { useAuth } from '../lib/store';

interface SignupPageProps {
  onNavigate: (tab: string) => void;
  onSuccessRedirect?: string;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onNavigate, onSuccessRedirect = 'registration' }) => {
  const { signup } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters in length.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('You must agree to the Terms of Participation and Rules.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await signup({
        name: fullName,
        email,
        password,
        university: 'NED University of Engineering & Technology',
        department: 'Electronic Engineering',
        studentId: 'STU-' + Math.floor(1000 + Math.random() * 9000),
        phoneNumber: '+92 300 ' + Math.floor(1000000 + Math.random() * 9000000)
      });
      setLoading(false);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create account. Please try again.');
        return;
      }
      setShowSuccessToast(true);
      setTimeout(() => {
        onNavigate(onSuccessRedirect);
      }, 900);
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err?.message || 'Failed to create account. Please try again.');
    }
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-24 flex items-center justify-center flex-grow">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-primary-container/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div className="max-w-lg w-full bg-surface-container-lowest/80 border border-outline-variant/30 rounded-xl p-8 sm:p-10 shadow-2xl backdrop-blur-sm relative">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight mb-2">
            Create an Account
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Register to join competitions at SPEC'26.
          </p>
        </div>

        <div className="space-y-6">

          {/* Sign Up Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="space-y-2">
              <label className="block font-label-caps text-label-caps uppercase text-on-surface tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <input
                  className="w-full bg-surface-container-low text-on-surface font-body-sm text-body-sm px-4 py-3 rounded outline-none border border-outline-variant/20 focus:border-primary-container focus:bg-surface-container transition-all placeholder:text-outline"
                  placeholder="e.g. Sarah Khan"
                  autoComplete="name"
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <span className="absolute right-3 top-3 text-outline-variant text-[18px] material-symbols-outlined">
                  badge
                </span>
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <label className="block font-label-caps text-label-caps uppercase text-on-surface tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <input
                  className="w-full bg-surface-container-low text-on-surface font-body-sm text-body-sm px-4 py-3 rounded outline-none border border-outline-variant/20 focus:border-primary-container focus:bg-surface-container transition-all placeholder:text-outline"
                  placeholder="you@example.com"
                  autoComplete="username"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <span className="absolute right-3 top-3 text-outline-variant text-[18px] material-symbols-outlined">
                  mail
                </span>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block font-label-caps text-label-caps uppercase text-on-surface tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  className="w-full bg-surface-container-low text-on-surface font-code-md text-code-md px-4 py-3 rounded outline-none border border-outline-variant/20 focus:border-primary-container focus:bg-surface-container transition-all placeholder:text-outline"
                  id="pwd-field"
                  placeholder="Create a strong password (min 6 chars)"
                  autoComplete="new-password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="absolute right-3 top-3 text-outline-variant hover:text-primary transition-colors text-[18px] material-symbols-outlined cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  {showPassword ? 'visibility_off' : 'visibility'}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="block font-label-caps text-label-caps uppercase text-on-surface tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  className="w-full bg-surface-container-low text-on-surface font-code-md text-code-md px-4 py-3 rounded outline-none border border-outline-variant/20 focus:border-primary-container focus:bg-surface-container transition-all placeholder:text-outline"
                  id="pwd-confirm-field"
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  className="absolute right-3 top-3 text-outline-variant hover:text-primary transition-colors text-[18px] material-symbols-outlined cursor-pointer"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  type="button"
                >
                  {showConfirmPassword ? 'visibility_off' : 'visibility'}
                </button>
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-3 cursor-pointer group select-none">
                <input
                  className="mt-1 h-4 w-4 rounded bg-surface-container-low text-primary-container focus:ring-0 focus:ring-offset-0 cursor-pointer accent-primary-container border-outline-variant/40"
                  required
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span className="font-body-sm text-body-sm text-on-surface-variant group-hover:text-on-surface transition-colors leading-relaxed">
                  I agree to the <span className="text-primary hover:underline">Terms of Participation and Rules</span>.
                </span>
              </label>
            </div>

            {errorMsg && (
              <div className="p-3 rounded bg-error/10 border border-error/30 text-error text-xs">
                {errorMsg}
              </div>
            )}

            {/* Submit button */}
            <div className="pt-2">
              <button
                className="w-full inline-flex items-center justify-center gap-2 bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container font-label-caps text-label-caps font-bold uppercase tracking-wider py-3.5 px-6 rounded transition-all shadow-[0_0_20px_rgba(240,117,9,0.25)] hover:shadow-[0_0_30px_rgba(240,117,9,0.4)] cursor-pointer"
                type="submit"
                disabled={loading}
              >
                <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>

            {/* Switch to login */}
            <div className="text-center pt-2">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Already have an account?{' '}
              </span>
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="font-body-sm text-body-sm text-secondary hover:text-primary-container font-semibold transition-colors cursor-pointer"
              >
                Log In
              </button>
            </div>
          </form>

          {/* Success Toast / Notification */}
          {showSuccessToast && (
            <div className="p-4 rounded bg-surface-container-high text-primary flex items-start gap-3 border border-primary-container/40 animate-fadeIn">
              <span className="material-symbols-outlined text-primary-container text-[20px]">
                check_circle
              </span>
              <div className="text-body-sm font-body-sm">
                <p className="font-semibold text-on-surface">Account Created Successfully</p>
                <p className="text-on-surface-variant">
                  Logging you in and redirecting to the Registration Portal...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
