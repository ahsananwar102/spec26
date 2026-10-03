import React from 'react';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/30 mt-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-outline-variant/20">
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="SPEC'26 Logo"
                className="h-8 w-auto max-h-8 object-contain"
              />
              <span className="font-headline-sm text-headline-sm font-bold text-primary">
                SPEC'26
              </span>
              <span className="font-label-caps text-label-caps px-2 py-0.5 rounded bg-surface-container-high text-secondary border border-outline-variant/30">
                ENGINEERING EXHIBITION
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md leading-relaxed">
              Department of Electronic Engineering<br />
              NED University of Engineering &amp; Technology<br />
              University Road, Karachi - 75270, Pakistan
            </p>
            <div className="text-xs text-on-surface-variant/80 font-code-md">
              Organized by the SPEC'26 Executive Student Committee under the supervision of the Departmental Faculty.
            </div>
          </div>

          <div className="md:col-span-3 space-y-3">
            <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest block">
              Navigation
            </span>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors block text-left cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('competitions')}
                  className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors block text-left cursor-pointer"
                >
                  Competitions
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('registration')}
                  className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors block text-left cursor-pointer"
                >
                  Registration Portal
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('guidelines')}
                  className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors block text-left cursor-pointer"
                >
                  Rules &amp; Guidelines
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('contact')}
                  className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors block text-left cursor-pointer"
                >
                  Contact Support
                </button>
              </li>

            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest block">
              Inquiries
            </span>
            <div className="space-y-2 text-on-surface-variant font-body-sm text-body-sm">
              <p className="text-on-surface">spec@neduet.edu.pk</p>
              <p>+92 (21) 99261261-8</p>
            </div>
            <div className="pt-2 flex items-center gap-3 text-on-surface-variant">
              <button
                aria-label="Email organizers"
                onClick={() => onNavigate('contact')}
                className="w-8 h-8 rounded border border-outline-variant/40 flex items-center justify-center hover:text-primary hover:border-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">mail</span>
              </button>
              <button
                aria-label="Official Documentation"
                onClick={() => onNavigate('guidelines')}
                className="w-8 h-8 rounded border border-outline-variant/40 flex items-center justify-center hover:text-primary hover:border-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">description</span>
              </button>
              <button
                aria-label="Venue Location"
                onClick={() => onNavigate('contact')}
                className="w-8 h-8 rounded border border-outline-variant/40 flex items-center justify-center hover:text-primary hover:border-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">location_on</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-code-md text-code-md text-outline">
          <p>© 2026 Department of Electronic Engineering, NED University. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-on-surface transition-colors cursor-pointer" onClick={() => onNavigate('guidelines')}>
              Privacy Policy
            </span>
            <span className="hover:text-on-surface transition-colors cursor-pointer" onClick={() => onNavigate('guidelines')}>
              Terms of Participation
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
