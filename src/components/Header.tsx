import React, { useState } from 'react';
import { useAuth } from '../lib/store';

interface HeaderProps {
  currentTab: string;
  onNavigate: (tab: string, trackId?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onNavigate }) => {
  const { currentUser, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant/30">
      <div className="h-20 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-8">
        {/* Brand Zone */}
        <div className="flex items-center gap-8 lg:gap-12">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 group text-left cursor-pointer"
          >
            <img
              src="/logo.png"
              alt="SPEC'26 Logo"
              className="h-9 w-auto max-h-9 object-contain"
            />
            <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-primary group-hover:text-primary-container transition-colors">
              SPEC'26
            </span>
            <span className="h-4 w-px bg-outline-variant/50 hidden sm:block"></span>
            <span className="font-label-caps text-label-caps px-2 py-0.5 rounded bg-surface-container-high text-secondary border border-outline-variant/40 hidden sm:inline-block tracking-wider">
              NED UNIVERSITY
            </span>
          </button>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <button
              onClick={() => onNavigate('home')}
              className={`font-body-sm text-body-sm transition-colors py-2 cursor-pointer ${
                currentTab === 'home'
                  ? 'text-primary font-semibold border-b border-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('competitions')}
              className={`font-body-sm text-body-sm transition-colors py-2 cursor-pointer ${
                currentTab === 'competitions'
                  ? 'text-primary font-semibold border-b border-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Competitions
            </button>
            <button
              onClick={() => onNavigate('registration')}
              className={`font-body-sm text-body-sm transition-colors py-2 cursor-pointer ${
                currentTab === 'registration'
                  ? 'text-primary font-semibold border-b border-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Registration
            </button>
            <button
              onClick={() => onNavigate('guidelines')}
              className={`font-body-sm text-body-sm transition-colors py-2 cursor-pointer ${
                currentTab === 'guidelines'
                  ? 'text-primary font-semibold border-b border-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Guidelines
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className={`font-body-sm text-body-sm transition-colors py-2 cursor-pointer ${
                currentTab === 'contact'
                  ? 'text-primary font-semibold border-b border-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Contact
            </button>

          </nav>
        </div>

        {/* Primary Action & User Control */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('registration')}
            className="inline-flex items-center justify-center font-label-caps text-label-caps uppercase px-5 py-2.5 bg-primary-container text-on-primary-container hover:bg-primary-fixed-dim hover:text-on-primary-fixed transition-colors font-semibold tracking-wider cursor-pointer rounded"
          >
            Register Now
          </button>

          {/* User Account Button with Dropdown */}
          <div className="relative">
            <button
              aria-label="User account menu"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-9 h-9 rounded-full bg-surface-container-high border border-outline-variant/60 flex items-center justify-center text-on-surface hover:text-primary hover:border-primary-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                {currentUser ? (currentUser.role === 'ADMIN' ? 'admin_panel_settings' : 'person') : 'account_circle'}
              </span>
            </button>

            {/* User Dropdown Menu */}
            {userMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-72 bg-surface-container-low border border-outline-variant/50 rounded-lg shadow-2xl py-3 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                {currentUser ? (
                  <div className="space-y-3">
                    <div className="px-4 pb-3 border-b border-outline-variant/30">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-on-surface text-sm truncate">
                          {currentUser.name}
                        </span>
                        <span
                          className={`font-label-caps text-[10px] px-2 py-0.5 rounded uppercase tracking-wider ${
                            currentUser.role === 'ADMIN'
                              ? 'bg-primary-container/20 text-primary border border-primary/30'
                              : 'bg-surface-container-high text-secondary'
                          }`}
                        >
                          {currentUser.role}
                        </span>
                      </div>
                      <p className="font-code-md text-xs text-on-surface-variant truncate mt-0.5">
                        {currentUser.email}
                      </p>
                    </div>

                    <div className="px-2 space-y-1">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate('registration');
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-on-surface hover:bg-surface-container rounded transition-colors flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px] text-secondary">
                          app_registration
                        </span>
                        Submit Registration
                      </button>



                    </div>

                    <div className="pt-2 border-t border-outline-variant/30 px-2">
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-error hover:bg-error/10 rounded transition-colors flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-2 space-y-2">
                    <p className="text-xs text-on-surface-variant px-1">
                      Sign in to submit registrations and access event dashboards.
                    </p>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavigate('login');
                      }}
                      className="w-full py-2 bg-primary-container text-on-primary-container text-xs font-semibold rounded hover:bg-primary-fixed-dim transition-colors"
                    >
                      Log In to SPEC'26
                    </button>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavigate('signup');
                      }}
                      className="w-full py-2 bg-surface-container-high text-on-surface text-xs font-semibold rounded hover:bg-surface-container-highest transition-colors"
                    >
                      Create Free Account
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-on-surface-variant hover:text-on-surface cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface-container-low border-b border-outline-variant/40 px-6 py-4 space-y-3">
          <button
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
            className={`block w-full text-left py-2 font-body-md ${
              currentTab === 'home' ? 'text-primary font-semibold' : 'text-on-surface-variant'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => {
              onNavigate('competitions');
              setMobileMenuOpen(false);
            }}
            className={`block w-full text-left py-2 font-body-md ${
              currentTab === 'competitions' ? 'text-primary font-semibold' : 'text-on-surface-variant'
            }`}
          >
            Competitions
          </button>
          <button
            onClick={() => {
              onNavigate('registration');
              setMobileMenuOpen(false);
            }}
            className={`block w-full text-left py-2 font-body-md ${
              currentTab === 'registration' ? 'text-primary font-semibold' : 'text-on-surface-variant'
            }`}
          >
            Registration Portal
          </button>
          <button
            onClick={() => {
              onNavigate('guidelines');
              setMobileMenuOpen(false);
            }}
            className={`block w-full text-left py-2 font-body-md ${
              currentTab === 'guidelines' ? 'text-primary font-semibold' : 'text-on-surface-variant'
            }`}
          >
            Guidelines
          </button>
          <button
            onClick={() => {
              onNavigate('contact');
              setMobileMenuOpen(false);
            }}
            className={`block w-full text-left py-2 font-body-md ${
              currentTab === 'contact' ? 'text-primary font-semibold' : 'text-on-surface-variant'
            }`}
          >
            Contact
          </button>
        </div>
      )}
    </header>
  );
};
