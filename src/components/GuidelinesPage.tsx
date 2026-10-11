import React, { useState } from 'react';
import { useEventSettings } from '../lib/store';

interface GuidelinesPageProps {
  onNavigate: (tab: string) => void;
}

export const GuidelinesPage: React.FC<GuidelinesPageProps> = ({ onNavigate }) => {
  const { eventSettings } = useEventSettings();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleScheduleClick = () => {
    if (eventSettings.scheduleUrl && eventSettings.scheduleUrl.trim()) {
      window.open(eventSettings.scheduleUrl.trim(), '_blank', 'noopener,noreferrer');
    } else {
      setToastMessage('The official competition schedule document will be announced shortly. Please check back soon or follow our Instagram @spec.ned for live updates.');
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto px-6 lg:px-12 py-12 md:py-16 space-y-12 animate-fadeIn">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-xl bg-surface-container border border-primary-container/60 shadow-2xl flex items-start gap-3 animate-fadeIn">
          <span className="material-symbols-outlined text-primary-container text-[22px] shrink-0 mt-0.5">info</span>
          <div className="flex-1 text-xs text-on-surface leading-relaxed">
            {toastMessage}
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-outline hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="max-w-3xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-surface-container-high text-primary font-label-caps text-label-caps uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
          Directives &amp; Regulations
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
          Competition Guidelines &amp; Directives
        </h1>
        <p className="font-body-lg text-body-lg text-slate-200 leading-relaxed">
          These guidelines apply to all SPEC'26 competitions. Participants must follow these rules along with the requirements of their chosen competition.
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          Make sure to follow our{' '}
          <a
            href="https://www.instagram.com/spec.ned/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-primary hover:text-primary-container font-medium transition-colors inline-flex items-center gap-0.5"
          >
            <span>social media page</span>
            <span className="material-symbols-outlined text-[13px]">open_in_new</span>
          </a>{' '}
          to receive the latest updates and information.
        </p>
      </div>

      {/* Grid of 4 Directives Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
        {/* Section 01 — Participant Eligibility & Registration */}
        <section className="p-8 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-5 hover:border-primary-container/40 transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-code-md text-xs font-bold text-primary-container uppercase tracking-wider">
                Section 01
              </span>
              <span className="material-symbols-outlined text-primary-container text-[24px]">school</span>
            </div>
            <h2 className="font-display text-xl font-bold text-white">
              Participant Eligibility &amp; Registration
            </h2>
            <ul className="space-y-3 font-body-sm text-body-sm text-on-surface-variant pt-2 border-t border-outline-variant/20">
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-primary-container text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>Students from schools, colleges, and universities are welcome to participate.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-primary-container text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>All participants must complete registration before taking part in a competition.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-primary-container text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>Bring a valid student ID for verification if requested by the organizing team.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-primary-container text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>Team size, eligibility requirements, and participation limits may vary by competition.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-primary-container text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>
                  Participants must follow the{' '}
                  {eventSettings.scheduleUrl && eventSettings.scheduleUrl.trim() ? (
                    <a
                      href={eventSettings.scheduleUrl.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-primary hover:text-primary-container font-medium inline-flex items-center gap-0.5"
                    >
                      <span>announced schedule</span>
                      <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={handleScheduleClick}
                      className="underline text-primary hover:text-primary-container font-medium cursor-pointer"
                    >
                      announced schedule
                    </button>
                  )}{' '}
                  and report to their venue on time.
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 02 — Safety & Equipment */}
        <section className="p-8 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-5 hover:border-secondary/40 transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-code-md text-xs font-bold text-secondary uppercase tracking-wider">
                Section 02
              </span>
              <span className="material-symbols-outlined text-secondary text-[24px]">bolt</span>
            </div>
            <h2 className="font-display text-xl font-bold text-white">
              Safety &amp; Equipment
            </h2>
            <ul className="space-y-3 font-body-sm text-body-sm text-on-surface-variant pt-2 border-t border-outline-variant/20">
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>Follow all safety instructions provided by organizers and venue staff.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>Bring the equipment and materials required for your competition unless stated otherwise.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>Circuits, robots, batteries, and other equipment must be safe to operate.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>Soldering and other potentially hazardous activities are only allowed in designated areas, where permitted.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>Organizers may inspect or stop the use of any equipment considered unsafe.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 03 — Competition Rules & Evaluation */}
        <section className="p-8 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-5 hover:border-primary-container/40 transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-code-md text-xs font-bold text-primary-container uppercase tracking-wider">
                Section 03
              </span>
              <span className="material-symbols-outlined text-primary-container text-[24px]">assignment_turned_in</span>
            </div>
            <h2 className="font-display text-xl font-bold text-white">
              Competition Rules &amp; Evaluation
            </h2>
            <ul className="space-y-3 font-body-sm text-body-sm text-on-surface-variant pt-2 border-t border-outline-variant/20">
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-primary-container text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>Follow your competition's rules, deadlines, time limits, and submission requirements.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-primary-container text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>Judging criteria, scoring, round formats, and qualification rules will be specified in the respective rulebook.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-primary-container text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>Present your work honestly and do not claim others' work as your own.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-primary-container text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>The use of pre-built hardware, open-source code, and third-party resources must comply with the competition rules.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-primary-container text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>Follow instructions given by judges and competition coordinators during each round.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 04 — Fair Play & Code of Conduct */}
        <section className="p-8 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-5 hover:border-secondary/40 transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-code-md text-xs font-bold text-secondary uppercase tracking-wider">
                Section 04
              </span>
              <span className="material-symbols-outlined text-secondary text-[24px]">gavel</span>
            </div>
            <h2 className="font-display text-xl font-bold text-white">
              Fair Play &amp; Code of Conduct
            </h2>
            <ul className="space-y-3 font-body-sm text-body-sm text-on-surface-variant pt-2 border-t border-outline-variant/20">
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>Cheating, plagiarism, and unauthorized collaboration are prohibited.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>Treat judges, organizers, volunteers, and fellow participants respectfully.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>Tampering with another team's work, disrupting a competition, or damaging event property is not allowed.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>Report complaints or disputes promptly to the relevant competition coordinator.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>Rule violations may result in warnings, score penalties, or disqualification, depending on their severity.</span>
              </li>
            </ul>
          </div>
        </section>
      </div>

      {/* Note Callout Box */}
      <div className="p-6 rounded-xl bg-surface-container-high border border-outline-variant/40 flex items-start gap-3">
        <span className="material-symbols-outlined text-primary-container text-[22px] shrink-0 mt-0.5">info</span>
        <p className="font-body-sm text-body-sm text-slate-200 leading-relaxed">
          <strong className="text-white">Note:</strong> These general guidelines apply across SPEC'26. Any additional requirements will be provided in the relevant competition rulebook.
        </p>
      </div>

      {/* Action Strip */}
      <div className="p-8 rounded-xl bg-surface-container-low border border-outline-variant/40 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
        <div className="space-y-1">
          <h3 className="font-headline-sm text-headline-sm font-bold text-white">
            Ready to explore tracks or enter?
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Explore track rulebooks or proceed to the official SPEC'26 registration portal.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('competitions')}
            className="inline-flex items-center gap-2 px-5 py-3 bg-surface-container text-on-surface hover:text-white border border-outline-variant/50 font-label-caps text-label-caps uppercase font-bold rounded transition-all cursor-pointer"
          >
            <span>Competition Tracks</span>
            <span className="material-symbols-outlined text-[16px]">explore</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('registration')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-container text-on-primary-container font-label-caps text-label-caps uppercase font-bold rounded hover:bg-primary-fixed-dim transition-all shrink-0 cursor-pointer shadow-[0_0_20px_rgba(240,117,9,0.3)]"
          >
            <span>Registration Portal</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};
