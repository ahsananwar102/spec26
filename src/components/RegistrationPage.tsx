import React, { useState } from 'react';
import { useCompetitions, useEventSettings, formatDisplayDate } from '../lib/store';

interface RegistrationPageProps {
  onNavigate: (tab: string, trackId?: string) => void;
  preselectedTrackSlug?: string;
}

export const RegistrationPage: React.FC<RegistrationPageProps> = ({ onNavigate, preselectedTrackSlug }) => {
  const { competitions } = useCompetitions();
  const { eventSettings, isLoaded } = useEventSettings();
  const [noticeToast, setNoticeToast] = useState<string | null>(null);

  const preselectedComp = preselectedTrackSlug
    ? competitions.find(c => c.slug === preselectedTrackSlug || c.id === preselectedTrackSlug)
    : null;

  // Handler for Schedule link
  const handleOpenSchedule = () => {
    if (eventSettings.scheduleUrl && eventSettings.scheduleUrl.trim()) {
      window.open(eventSettings.scheduleUrl.trim(), '_blank', 'noopener,noreferrer');
    } else {
      setNoticeToast('The official competition schedule document will be announced shortly. Please check back soon or follow our Instagram @spec.ned for updates.');
      setTimeout(() => setNoticeToast(null), 5000);
    }
  };

  // Handler for Register Now Google Form
  const handleRegisterClick = (e: React.MouseEvent) => {
    if (eventSettings.registrationPhase !== 'OPEN') {
      e.preventDefault();
      return;
    }

    if (!eventSettings.registrationFormUrl || !eventSettings.registrationFormUrl.trim()) {
      e.preventDefault();
      setNoticeToast('The official SPEC\'26 Google Registration Form link will be updated shortly by the event desk. Please check back soon or contact support.');
      setTimeout(() => setNoticeToast(null), 5000);
      return;
    }

    window.open(eventSettings.registrationFormUrl.trim(), '_blank', 'noopener,noreferrer');
  };

  // Loading state during initial cold-cache sync
  if (!isLoaded && eventSettings.updatedAt === '1970-01-01T00:00:00.000Z') {
    return (
      <div className="flex flex-col w-full max-w-5xl mx-auto px-6 lg:px-8 py-28 items-center justify-center space-y-4 animate-fadeIn">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-primary-container/20 border-t-primary-container animate-spin"></div>
          <div className="absolute w-2 h-2 rounded-full bg-primary-container"></div>
        </div>
        <div className="text-center space-y-1">
          <span className="font-code-md text-xs text-primary-container tracking-wider uppercase block">
            Verifying Registration Portal
          </span>
          <p className="text-xs text-on-surface-variant font-body-sm">
            Communicating with Department database...
          </p>
        </div>
      </div>
    );
  }

  const isRegistrationOpen = eventSettings.registrationPhase === 'OPEN';
  const isRegistrationNotStarted = eventSettings.registrationPhase === 'NOT_STARTED';
  const isRegistrationClosed = eventSettings.registrationPhase === 'CLOSED';

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto px-6 lg:px-12 py-12 md:py-16 space-y-12 animate-fadeIn">
      {/* Toast Notification Alert */}
      {noticeToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-xl bg-surface-container border border-primary-container/60 shadow-[0_10px_35px_rgba(0,0,0,0.5)] flex items-start gap-3 animate-fadeIn">
          <span className="material-symbols-outlined text-primary-container text-[22px] shrink-0 mt-0.5">info</span>
          <div className="flex-1 text-xs text-on-surface leading-relaxed">
            {noticeToast}
          </div>
          <button
            onClick={() => setNoticeToast(null)}
            className="text-outline hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Preselected Track Notification Banner if user clicked Register from a specific competition card */}
      {preselectedComp && (
        <div className="p-4 rounded-xl bg-primary-container/10 border border-primary-container/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary-container text-[20px]">flag</span>
            <div className="text-xs">
              <span className="text-on-surface-variant">Selected Competition Track: </span>
              <strong className="text-white font-semibold">{preselectedComp.title}</strong>
              <span className="text-primary-container ml-2 font-code-md">({preselectedComp.category})</span>
            </div>
          </div>
          {preselectedComp.rulebookUrl && (
            <a
              href={preselectedComp.rulebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-code-md text-primary-container hover:underline flex items-center gap-1 shrink-0"
            >
              <span>View Track Rulebook</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          )}
        </div>
      )}

      {/* Status Phase Indicator Banner */}
      <div className="w-full">
        {isRegistrationNotStarted && (
          <div className="p-4 sm:p-5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
              </div>
              <div>
                <span className="font-code-md text-[11px] font-bold text-yellow-300 uppercase tracking-widest block">
                  Registration Window Opening Soon
                </span>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Official registration will open on <strong className="text-white">{formatDisplayDate(eventSettings.registrationStartDate)}</strong>.
                </p>
              </div>
            </div>
            <div className="px-3 py-1 rounded bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 font-code-md text-xs font-semibold self-start sm:self-auto shrink-0">
              Opens: {formatDisplayDate(eventSettings.registrationStartDate)}
            </div>
          </div>
        )}

        {isRegistrationOpen && (
          <div className="p-4 sm:p-5 rounded-xl bg-primary-container/10 border border-primary-container/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-container/20 text-primary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-container animate-ping"></span>
                  <span className="font-code-md text-[11px] font-bold text-primary-container uppercase tracking-widest">
                    Registrations Actively Open
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Official Google Registration Form is accepting candidate and squad submissions.
                </p>
              </div>
            </div>
            <div className="px-3 py-1 rounded bg-primary-container/20 border border-primary-container/40 text-primary font-code-md text-xs font-semibold self-start sm:self-auto shrink-0">
              Deadline: {formatDisplayDate(eventSettings.registrationEndDate)}
            </div>
          </div>
        )}

        {isRegistrationClosed && (
          <div className="p-4 sm:p-5 rounded-xl bg-red-500/10 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">event_busy</span>
              </div>
              <div>
                <span className="font-code-md text-[11px] font-bold text-red-400 uppercase tracking-widest block">
                  Registration Window Concluded
                </span>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Submissions closed on <strong className="text-white">{formatDisplayDate(eventSettings.registrationEndDate)}</strong>. Verification is currently underway.
                </p>
              </div>
            </div>
            <div className="px-3 py-1 rounded bg-red-500/20 border border-red-500/40 text-red-400 font-code-md text-xs font-semibold self-start sm:self-auto shrink-0">
              Closed: {formatDisplayDate(eventSettings.registrationEndDate)}
            </div>
          </div>
        )}
      </div>

      {/* Main Header Section */}
      <section className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-surface-container-high text-primary font-label-caps text-label-caps uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
          Official Event Registration
        </div>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
          Registrations Open
        </h1>
        <p className="font-body-lg text-body-lg text-slate-200 leading-relaxed">
          Get ready to compete at the Students' Project Exhibition &amp; Competition (SPEC'26), hosted by the Department of Electronic Engineering at NED University of Engineering &amp; Technology.
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          Registration will be completed through our official Google Form. Review the competition guidelines and prepare your team details before registration opens.
        </p>
      </section>

      {/* Section: Before You Register */}
      <section className="space-y-6 pt-4 border-t border-outline-variant/30">
        <div>
          <span className="text-xs font-code-md uppercase tracking-widest text-primary-container font-semibold">
            Preparation Guide
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            Before You Register
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Follow these essential steps to ensure an accurate and swift submission for your squad.
          </p>
        </div>

        {/* 3 Structured Numbered Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Step 01 */}
          <div className="p-7 rounded-xl bg-surface-container-low border border-outline-variant/40 hover:border-primary-container/40 transition-all flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-display text-2xl font-bold text-primary-container font-code-md">
                  01.
                </span>
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[22px]">category</span>
                </div>
              </div>
              <h3 className="font-display text-lg font-bold text-white group-hover:text-primary transition-colors">
                Explore the Competition Tracks
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Choose the competitions that match your interests and skills.
              </p>
            </div>
            <div className="pt-4 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => onNavigate('competitions')}
                className="text-xs font-code-md text-secondary hover:text-primary flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Browse All Tracks</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Step 02 */}
          <div className="p-7 rounded-xl bg-surface-container-low border border-outline-variant/40 hover:border-primary-container/40 transition-all flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-display text-2xl font-bold text-secondary font-code-md">
                  02.
                </span>
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[22px]">menu_book</span>
                </div>
              </div>
              <h3 className="font-display text-lg font-bold text-white group-hover:text-secondary transition-colors">
                Review the Guidelines
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Check the relevant rulebook for eligibility, team requirements, competition format, and rules.
              </p>
            </div>
            <div className="pt-4 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => onNavigate('guidelines')}
                className="text-xs font-code-md text-secondary hover:text-primary flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Read Directives</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Step 03 */}
          <div className="p-7 rounded-xl bg-surface-container-low border border-outline-variant/40 hover:border-primary-container/40 transition-all flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-display text-2xl font-bold text-primary font-code-md">
                  03.
                </span>
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[22px]">badge</span>
                </div>
              </div>
              <h3 className="font-display text-lg font-bold text-white group-hover:text-primary transition-colors">
                Prepare Your Details
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Have your institution and participant details ready, along with your squad information where applicable.
              </p>
            </div>
            <div className="pt-4 border-t border-outline-variant/20 text-xs text-outline font-code-md">
              Valid ID / CNIC &amp; Teammates info
            </div>
          </div>
        </div>
      </section>

      {/* Section: Ready to Compete? */}
      <section className="p-8 sm:p-12 rounded-2xl bg-surface-container-low border border-outline-variant/40 relative overflow-hidden space-y-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-container/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-code-md uppercase tracking-widest text-primary-container font-semibold">
            Final Step
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Ready to Compete?
          </h2>
          <p className="text-base text-on-surface-variant leading-relaxed">
            Explore the competition tracks, review the official guidelines, and start preparing for SPEC'26.
          </p>
        </div>

        {/* Display Exactly 3 Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-4 pt-2">
          {/* Button 1: Competitions and Rulebooks */}
          <button
            type="button"
            onClick={() => onNavigate('competitions')}
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-surface-container border border-outline-variant text-on-surface hover:text-white hover:border-primary-container/60 font-code-md text-xs uppercase tracking-widest font-semibold rounded transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">explore</span>
            <span>Competitions and Rulebooks</span>
          </button>

          {/* Button 2: Schedule of Competitions */}
          <button
            type="button"
            onClick={handleOpenSchedule}
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-surface-container border border-outline-variant text-on-surface hover:text-white hover:border-primary-container/60 font-code-md text-xs uppercase tracking-widest font-semibold rounded transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px] text-primary-container">calendar_month</span>
            <span>Schedule of Competitions</span>
            {eventSettings.scheduleUrl && (
              <span className="material-symbols-outlined text-[14px] text-outline">open_in_new</span>
            )}
          </button>

          {/* Button 3: Register Now (Primary CTA — Visually More Prominent) */}
          {isRegistrationOpen && (
            <button
              type="button"
              onClick={handleRegisterClick}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary-container text-on-primary-container hover:bg-primary-fixed-dim text-xs font-bold uppercase tracking-widest rounded transition-all shadow-[0_0_30px_rgba(240,117,9,0.35)] hover:shadow-[0_0_40px_rgba(240,117,9,0.5)] cursor-pointer order-first sm:order-last border border-primary-container"
            >
              <span>Register Now</span>
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            </button>
          )}

          {isRegistrationNotStarted && (
            <button
              type="button"
              disabled
              title={`Registration will open on ${formatDisplayDate(eventSettings.registrationStartDate)}`}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-yellow-500/15 border border-yellow-500/40 text-yellow-300 font-code-md text-xs uppercase tracking-widest font-semibold rounded opacity-80 cursor-not-allowed order-first sm:order-last"
            >
              <span className="material-symbols-outlined text-[18px]">lock</span>
              <span>Register Now (Opens {formatDisplayDate(eventSettings.registrationStartDate)})</span>
            </button>
          )}

          {isRegistrationClosed && (
            <button
              type="button"
              disabled
              title={`Registration concluded on ${formatDisplayDate(eventSettings.registrationEndDate)}`}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-red-500/15 border border-red-500/40 text-red-400 font-code-md text-xs uppercase tracking-widest font-semibold rounded opacity-80 cursor-not-allowed order-first sm:order-last"
            >
              <span className="material-symbols-outlined text-[18px]">lock</span>
              <span>Register Now (Closed)</span>
            </button>
          )}
        </div>

        {/* Informative Sub-Notice */}
        <div className="pt-4 border-t border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-on-surface-variant font-code-md">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
            <span>SPEC'26 Google Form is open to schools, colleges, and universities across Karachi</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-outline">Need assistance?</span>
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="text-primary hover:underline cursor-pointer"
            >
              Contact Event Desk
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
