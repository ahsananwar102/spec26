import React from 'react';
import { useCompetitions, useEventSettings, useCategories, formatDisplayDate } from '../lib/store';
import { CompetitionCard } from './CompetitionCard';

interface HomePageProps {
  onNavigate: (tab: string, trackId?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { competitions } = useCompetitions();
  const { categories } = useCategories();
  const { eventSettings } = useEventSettings();
  const activeCompetitions = competitions.filter(c => c.isActive);
  const featuredCompetitions = activeCompetitions.slice(0, 3);

  return (
    <div className="flex flex-col w-full">
      {/* Top Minimal Institution Bar */}
      <div className="border-b border-outline-variant/60 bg-surface-container-lowest/80 text-xs text-on-surface-variant">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-container"></span>
            <span className="font-medium text-on-surface">Department of Electronic Engineering</span>
            <span className="text-outline">·</span>
            <span>NED University of Engineering and Technology, Karachi</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs font-code-md text-on-surface-variant/80">
            <span>ESTABLISHED ANNUAL PLATFORM</span>
            <span className="text-outline">·</span>
            {eventSettings.registrationPhase === 'NOT_STARTED' && (
              <span className="text-yellow-400 font-medium">REGISTRATIONS OPENING SOON</span>
            )}
            {eventSettings.registrationPhase === 'OPEN' && (
              <span className="text-primary-container font-medium">REGISTRATION OPEN</span>
            )}
            {eventSettings.registrationPhase === 'CLOSED' && (
              <span className="text-red-400 font-medium">REGISTRATIONS CLOSED</span>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative border-b border-outline-variant/60 bg-gradient-to-b from-surface-container-lowest via-surface to-surface overflow-hidden py-20 lg:py-28">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        ></div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-6 py-6">
            <div className="inline-flex items-center gap-2 text-xs font-code-md text-primary-container uppercase tracking-widest mx-auto px-3 py-1 rounded bg-surface-container-high border border-outline-variant/40">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
              Annual Engineering Symposium
            </div>

            <div className="flex flex-col gap-3 items-center">
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08]">
                SPEC’26
              </h1>
              <p className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-slate-200">
                Students’ Project Exhibition &amp; Competition
              </p>
            </div>

            <p className="text-base sm:text-lg text-on-surface-variant font-normal leading-relaxed max-w-2xl mx-auto">
              Where theory meets engineering mastery. Hosted by the Department of Electronic Engineering at NED University, Karachi.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => onNavigate('registration')}
                className="inline-flex items-center justify-center px-7 py-3.5 bg-primary-container text-on-primary-container font-code-md text-xs uppercase tracking-widest font-semibold border border-primary-container hover:bg-transparent hover:text-primary-container transition-all cursor-pointer rounded"
              >
                {eventSettings.registrationPhase === 'NOT_STARTED' ? 'Registration (Opening Soon)' :
                 eventSettings.registrationPhase === 'CLOSED' ? 'Registration Status (Closed)' : 'Register Now'}
              </button>
              <button
                onClick={() => onNavigate('competitions')}
                className="inline-flex items-center justify-center px-7 py-3.5 bg-surface-container border border-outline-variant text-on-surface hover:text-white hover:border-outline font-code-md text-xs uppercase tracking-widest font-semibold transition-all cursor-pointer rounded"
              >
                Explore Competitions
              </button>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-8 text-xs text-on-surface-variant font-code-md">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                <span>{activeCompetitions.length} Technical Tracks</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                <span>Open to All Universities</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                <span>Undergraduate Engineering</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Metric Strip */}
      <section className="border-b border-outline-variant/60 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-outline-variant/60">
            {/* Event Date */}
            <div className="pt-4 md:pt-0 md:px-6 first:pl-0 flex flex-col gap-1.5">
              <span className="text-xs font-code-md uppercase tracking-wider text-on-surface-variant">Event Date</span>
              <div className="font-display text-2xl font-bold text-white">
                {eventSettings.competitionDates || formatDisplayDate(eventSettings.eventDate)}
              </div>
              <span className="text-xs text-secondary font-code-md">
                {eventSettings.registrationPhase === 'NOT_STARTED' && `Reg Opens: ${formatDisplayDate(eventSettings.registrationStartDate)}`}
                {eventSettings.registrationPhase === 'OPEN' && `Deadline: ${formatDisplayDate(eventSettings.registrationEndDate)}`}
                {eventSettings.registrationPhase === 'CLOSED' && `Closed: ${formatDisplayDate(eventSettings.registrationEndDate)}`}
              </span>
            </div>

            {/* Venue */}
            <div className="pt-4 md:pt-0 md:px-6 flex flex-col gap-1.5">
              <span className="text-xs font-code-md uppercase tracking-wider text-on-surface-variant">Venue</span>
              <div className="font-display text-2xl font-bold text-white">NED Main Campus</div>
              <span className="text-xs text-on-surface-variant">University Road, Karachi</span>
            </div>

            {/* Organizer */}
            <div className="pt-4 md:pt-0 md:px-6 flex flex-col gap-1.5">
              <span className="text-xs font-code-md uppercase tracking-wider text-on-surface-variant">Organizer</span>
              <div className="font-display text-2xl font-bold text-white">Dept. of Electronic Engg.</div>
              <span className="text-xs text-on-surface-variant">NED University of Engg &amp; Tech</span>
            </div>

            {/* Competitions */}
            <div className="pt-4 md:pt-0 md:px-6 flex flex-col gap-1.5">
              <span className="text-xs font-code-md uppercase tracking-wider text-on-surface-variant">Competitions</span>
              <div className="font-display text-2xl font-bold text-primary-container">
                {activeCompetitions.length} Competition Tracks
              </div>
              <span className="text-xs text-on-surface-variant">Across {categories.length} Engineering Streams</span>
            </div>
          </div>
        </div>
      </section>

      {/* About SPEC'26 & 4 Disciplines */}
      <section className="py-24 border-b border-outline-variant/60 bg-surface" id="about">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <span className="text-xs font-code-md uppercase tracking-widest text-primary-container font-semibold">
              About the Exhibition
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mt-2 mb-4">
              What is SPEC’26?
            </h2>
            <p className="text-lg text-on-surface font-normal leading-relaxed">
              SPEC is the premier annual academic exhibition and symposium organized by the Department of Electronic Engineering at NED University. It brings together undergraduate researchers, engineers, and tinkerers across Pakistan to showcase hardware prototypes, compete, and connect.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-8 border border-outline-variant/70 bg-surface-container-low hover:border-primary-container/40 transition-all rounded">
              <div className="w-10 h-10 border border-primary-container/30 bg-surface-container flex items-center justify-center text-primary-container mb-6 rounded">
                <span className="material-symbols-outlined text-xl">memory</span>
              </div>
              <span className="text-xs font-code-md text-on-surface-variant block mb-1">01 / DISCIPLINE</span>
              <h3 className="font-display text-lg font-bold text-white mb-2">Embedded &amp; Silicon</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Microcontroller architectures, FPGA register-transfer logic, and precision circuit instrumentation.
              </p>
            </div>

            <div className="p-8 border border-outline-variant/70 bg-surface-container-low hover:border-primary-container/40 transition-all rounded">
              <div className="w-10 h-10 border border-secondary/30 bg-surface-container flex items-center justify-center text-secondary mb-6 rounded">
                <span className="material-symbols-outlined text-xl">precision_manufacturing</span>
              </div>
              <span className="text-xs font-code-md text-on-surface-variant block mb-1">02 / DISCIPLINE</span>
              <h3 className="font-display text-lg font-bold text-white mb-2">Autonomous Robotics</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Tuned PID control loops, optical sensor arrays, and arena-grade mobile robotics.
              </p>
            </div>

            <div className="p-8 border border-outline-variant/70 bg-surface-container-low hover:border-primary-container/40 transition-all rounded">
              <div className="w-10 h-10 border border-primary-fixed/30 bg-surface-container flex items-center justify-center text-primary-fixed mb-6 rounded">
                <span className="material-symbols-outlined text-xl">terminal</span>
              </div>
              <span className="text-xs font-code-md text-on-surface-variant block mb-1">03 / DISCIPLINE</span>
              <h3 className="font-display text-lg font-bold text-white mb-2">Competitive Programming</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Algorithmic problem-solving, memory-constrained data structures, and time-trial sprint optimization.
              </p>
            </div>

            <div className="p-8 border border-outline-variant/70 bg-surface-container-low hover:border-primary-container/40 transition-all rounded">
              <div className="w-10 h-10 border border-tertiary-fixed-dim/30 bg-surface-container flex items-center justify-center text-tertiary-fixed-dim mb-6 rounded">
                <span className="material-symbols-outlined text-xl">handyman</span>
              </div>
              <span className="text-xs font-code-md text-on-surface-variant block mb-1">04 / DISCIPLINE</span>
              <h3 className="font-display text-lg font-bold text-white mb-2">Hardware Craft &amp; Circuitry</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Surface-mount and through-hole soldering discipline, thermal layout design, and PCB assembly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Competitions Section */}
      <section className="py-24 border-b border-outline-variant/60 bg-surface-container-lowest" id="competitions">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <span className="text-xs font-code-md uppercase tracking-widest text-primary-container font-semibold">
                Featured Tracks
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mt-2">
                Featured Competitions
              </h2>
              <p className="text-on-surface-variant text-base mt-2 max-w-xl leading-relaxed">
                Select from {activeCompetitions.length} specialized categories across hardware research, analog design, software sprints, and autonomous robotics.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-code-md text-on-surface-variant">
              <span>FEATURED TRACKS</span>
              <span className="text-outline">·</span>
              <span>ACCREDITED JUDGING</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {featuredCompetitions.map(comp => (
              <CompetitionCard
                key={comp.id}
                competition={comp}
                onSelectTrack={(slug) => onNavigate('registration', slug)}
              />
            ))}
          </div>

          <div className="mt-16 text-center">
            <button
              onClick={() => onNavigate('competitions')}
              className="inline-flex items-center gap-3 px-8 py-4 bg-surface-container hover:bg-surface-container-high border border-outline-variant hover:border-primary-container/60 text-white font-code-md text-xs uppercase tracking-widest font-semibold transition-all shadow-sm cursor-pointer rounded"
            >
              <span>Explore Full Competitions Directory ({activeCompetitions.length} Tracks)</span>
              <span className="material-symbols-outlined text-sm text-primary-container">arrow_forward</span>
            </button>
          </div>
        </div>
      </section>

      {/* Elevated High-Impact Call to Action */}
      <section className="py-24 border-b border-outline-variant/60 bg-surface" id="registration">
        <div className="max-w-4xl mx-auto px-6 text-center py-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-high border border-outline-variant text-primary-container font-code-md text-xs uppercase tracking-wider mb-6 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
            NED University of Engineering &amp; Technology
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white mb-6">
            {eventSettings.registrationPhase === 'CLOSED' ? 'SPEC’26 Registrations Concluded' :
             eventSettings.registrationPhase === 'NOT_STARTED' ? 'Get Ready for SPEC’26' :
             'Ready to Compete at SPEC’26?'}
          </h2>
          <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
            {eventSettings.registrationPhase === 'CLOSED' ? (
              `Registrations officially closed on ${formatDisplayDate(eventSettings.registrationEndDate)}. The Department of Electronic Engineering is preparing laboratory spaces and schedule allocations for the exhibition on ${eventSettings.competitionDates}.`
            ) : eventSettings.registrationPhase === 'NOT_STARTED' ? (
              `Registrations will formally open on ${formatDisplayDate(eventSettings.registrationStartDate)}. Explore our 11 engineering tracks and gather your team members in advance.`
            ) : (
              `Registration is open to university students across Pakistan. Reserve your slot early before category capacity limits are reached. Deadline: ${formatDisplayDate(eventSettings.registrationEndDate)}.`
            )}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('registration')}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-primary-container text-on-primary-container font-code-md text-xs uppercase tracking-widest font-bold border border-primary-container hover:bg-transparent hover:text-primary-container transition-all cursor-pointer rounded"
            >
              {eventSettings.registrationPhase === 'CLOSED' ? 'View Registration Status' :
               eventSettings.registrationPhase === 'NOT_STARTED' ? 'View Opening Dates' :
               'Register for SPEC’26'}
            </button>
            <button
              onClick={() => onNavigate('guidelines')}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-surface-container border border-outline-variant text-on-surface hover:text-white font-code-md text-xs uppercase tracking-widest font-semibold transition-all cursor-pointer rounded"
            >
              View Rules &amp; Guidelines
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
