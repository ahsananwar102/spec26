import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

// Dynamic lazy-loaded route components for optimal production performance
const HomePage = lazy(() => import('./components/HomePage').then(m => ({ default: m.HomePage })));
const CompetitionsPage = lazy(() => import('./components/CompetitionsPage').then(m => ({ default: m.CompetitionsPage })));
const RegistrationPage = lazy(() => import('./components/RegistrationPage').then(m => ({ default: m.RegistrationPage })));
const GuidelinesPage = lazy(() => import('./components/GuidelinesPage').then(m => ({ default: m.GuidelinesPage })));
const ContactPage = lazy(() => import('./components/ContactPage').then(m => ({ default: m.ContactPage })));
const LoginPage = lazy(() => import('./components/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./components/SignupPage').then(m => ({ default: m.SignupPage })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const ResetPasswordPage = lazy(() => import('./components/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));

// Loading indicator component adhering to SPEC'26 dark engineering theme
function RouteLoadingFallback() {
  return (
    <div className="w-full min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-primary-container/20 border-t-primary-container animate-spin"></div>
        <div className="absolute w-2 h-2 rounded-full bg-primary-container"></div>
      </div>
      <div className="text-center space-y-1">
        <span className="font-code-md text-xs text-primary-container tracking-wider uppercase block">
          Loading Module
        </span>
        <p className="text-xs text-on-surface-variant font-body-sm">
          Department of Electronic Engineering, NED University
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [preselectedTrackSlug, setPreselectedTrackSlug] = useState<string | undefined>(undefined);

  // Sync with window.location.pathname and window.location.hash for deep links
  useEffect(() => {
    const syncRouteFromUrl = () => {
      const rawHash = window.location.hash.replace('#', '').trim();
      const hash = rawHash.split('?')[0].toLowerCase();
      const path = window.location.pathname.replace(/^\/+/, '').split('/')[0].split('?')[0].trim().toLowerCase();

      // Check if URL represents a password recovery callback
      if (rawHash.includes('type=recovery') || window.location.search.includes('type=recovery')) {
        setCurrentTab('reset-password');
        return;
      }
      
      const target = hash || path;
      const validTabs = [
        'home',
        'competitions',
        'registration',
        'guidelines',
        'contact',
        'login',
        'signup',
        'admin',
        'forgot-password',
        'reset-password'
      ];
      if (validTabs.includes(target)) {
        setCurrentTab(target);
      }
    };

    syncRouteFromUrl();
    window.addEventListener('hashchange', syncRouteFromUrl);
    window.addEventListener('popstate', syncRouteFromUrl);
    return () => {
      window.removeEventListener('hashchange', syncRouteFromUrl);
      window.removeEventListener('popstate', syncRouteFromUrl);
    };
  }, []);

  const handleNavigate = (tab: string, trackSlug?: string) => {
    setCurrentTab(tab);
    if (trackSlug) {
      setPreselectedTrackSlug(trackSlug);
    }
    window.location.hash = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col justify-between selection:bg-primary-container selection:text-on-primary-container">
      {/* Top Header */}
      <Header currentTab={currentTab} onNavigate={handleNavigate} />

      {/* Main Content Area with Suspense boundary */}
      <main className="w-full pt-20 flex-grow min-h-[calc(100vh-20rem)]" id="main-content">
        <Suspense fallback={<RouteLoadingFallback />}>
          {currentTab === 'home' && <HomePage onNavigate={handleNavigate} />}
          {currentTab === 'competitions' && <CompetitionsPage onNavigate={handleNavigate} />}
          {currentTab === 'registration' && (
            <RegistrationPage
              onNavigate={handleNavigate}
              preselectedTrackSlug={preselectedTrackSlug}
            />
          )}
          {currentTab === 'guidelines' && <GuidelinesPage onNavigate={handleNavigate} />}
          {currentTab === 'contact' && <ContactPage />}
          {currentTab === 'login' && <LoginPage onNavigate={handleNavigate} />}
          {currentTab === 'signup' && <SignupPage onNavigate={handleNavigate} />}
          {currentTab === 'admin' && <AdminDashboard onNavigate={handleNavigate} />}
          {(currentTab === 'forgot-password' || currentTab === 'reset-password') && (
            <ResetPasswordPage
              initialMode={currentTab === 'reset-password' ? 'reset' : 'request'}
              onNavigate={handleNavigate}
            />
          )}
        </Suspense>
      </main>

      {/* Global Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
