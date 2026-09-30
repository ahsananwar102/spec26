import React, { useState, useMemo } from 'react';
import { useCompetitions, useEventSettings, useCategories, formatDisplayDate } from '../lib/store';
import { CompetitionCard } from './CompetitionCard';

interface CompetitionsPageProps {
  onNavigate: (tab: string, trackId?: string) => void;
}

export const CompetitionsPage: React.FC<CompetitionsPageProps> = ({ onNavigate }) => {
  const { competitions } = useCompetitions();
  const { categories } = useCategories();
  const { eventSettings } = useEventSettings();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [formatFilter, setFormatFilter] = useState<string>('all');

  const activeCompetitions = useMemo(() => {
    return competitions.filter(c => c.isActive);
  }, [competitions]);

  const counts = useMemo(() => {
    const res: Record<string, number> = {
      all: activeCompetitions.length,
    };
    categories.forEach(cat => {
      res[cat.slug.toLowerCase()] = activeCompetitions.filter(
        c => c.category.toUpperCase() === cat.slug.toUpperCase()
      ).length;
    });
    return res;
  }, [activeCompetitions, categories]);

  const filteredCompetitions = useMemo(() => {
    return activeCompetitions.filter(c => {
      const matchCategory =
        selectedCategory === 'all' ||
        c.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchFormat =
        formatFilter === 'all' ||
        c.format === formatFilter ||
        (formatFilter === 'SOLO' && c.format === 'BOTH') ||
        (formatFilter === 'TEAM' && c.format === 'BOTH');

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.keyDeliverables && c.keyDeliverables.toLowerCase().includes(q));

      return matchCategory && matchFormat && matchSearch;
    });
  }, [activeCompetitions, selectedCategory, formatFilter, searchQuery]);

  return (
    <div className="flex flex-col w-full">
      {/* Top Visual Accent & Editorial Header */}
      <section className="relative w-full pt-16 pb-8 sm:pt-20 sm:pb-12 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col items-start max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded bg-surface-container-high text-primary font-label-caps text-label-caps uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
              Annual Engineering Symposium &middot; {eventSettings.competitionDates || formatDisplayDate(eventSettings.eventDate)}
            </div>
            {eventSettings.registrationPhase === 'NOT_STARTED' && (
              <span className="text-xs font-code-md px-3 py-1 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">hourglass_top</span>
                Registrations Open {formatDisplayDate(eventSettings.registrationStartDate)}
              </span>
            )}
            {eventSettings.registrationPhase === 'OPEN' && (
              <span className="text-xs font-code-md px-3 py-1 rounded bg-primary-container/20 text-primary-container border border-primary-container/30 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">timer</span>
                Registration Deadline: {formatDisplayDate(eventSettings.registrationEndDate)}
              </span>
            )}
            {eventSettings.registrationPhase === 'CLOSED' && (
              <span className="text-xs font-code-md px-3 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">event_busy</span>
                Registrations Closed on {formatDisplayDate(eventSettings.registrationEndDate)}
              </span>
            )}
          </div>
          <h1 className="font-headline-lg sm:font-display-lg text-headline-lg sm:text-display-lg font-bold text-on-surface tracking-tight">
            Competition Categories
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed pt-1">
            Explore {activeCompetitions.length} technical tracks spanning discrete electronics, autonomous robotics, software engineering, and hardware design. Event exhibition: <strong className="text-white">{eventSettings.competitionDates}</strong>.
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="mt-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-outline text-[20px] pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tracks by name, tool, keywords..."
                className="w-full pl-10 pr-4 py-2.5 rounded bg-surface-container text-sm text-on-surface placeholder:text-outline border border-outline-variant/30 focus:border-primary-container outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-outline hover:text-white"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>

            {/* Format Filter */}
            <div className="flex items-center gap-2 text-xs font-code-md">
              <span className="text-outline">Squad Type:</span>
              <div className="flex items-center gap-1 bg-surface-container rounded p-1 border border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setFormatFilter('all')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    formatFilter === 'all'
                      ? 'bg-primary-container text-on-primary-container font-semibold'
                      : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFormatFilter('SOLO')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    formatFilter === 'SOLO'
                      ? 'bg-primary-container text-on-primary-container font-semibold'
                      : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  Solo
                </button>
                <button
                  type="button"
                  onClick={() => setFormatFilter('TEAM')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    formatFilter === 'TEAM'
                      ? 'bg-primary-container text-on-primary-container font-semibold'
                      : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  Team
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Controls */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`filter-btn px-4 py-2 rounded text-body-sm font-body-sm font-medium transition-colors cursor-pointer shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-primary-container text-on-primary-container shadow-sm'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              All tracks <span className="ml-1 opacity-70 font-code-md text-code-md">{counts.all}</span>
            </button>
            {categories.map(cat => {
              const slugKey = cat.slug.toLowerCase();
              const count = counts[slugKey] || 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(slugKey)}
                  className={`filter-btn px-4 py-2 rounded text-body-sm font-body-sm font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    selectedCategory === slugKey
                      ? 'bg-primary-container text-on-primary-container shadow-sm'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  {cat.icon && (
                    <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                  )}
                  <span>{cat.name}</span>
                  <span className="ml-1 opacity-70 font-code-md text-code-md">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Competitions Directory Grid */}
      <section className="w-full px-6 lg:px-12 max-w-7xl mx-auto pb-20">
        <div className="flex items-center justify-between text-xs font-code-md text-outline mb-4">
          <span>Showing {filteredCompetitions.length} of {activeCompetitions.length} competition tracks</span>
          {(searchQuery || selectedCategory !== 'all' || formatFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setFormatFilter('all');
              }}
              className="text-primary hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {filteredCompetitions.length === 0 ? (
          <div className="text-center py-16 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-4">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">category</span>
            <p className="text-on-surface-variant">No competitions found matching your search and filter criteria.</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setFormatFilter('all');
              }}
              className="px-4 py-2 text-xs font-semibold rounded bg-primary-container text-on-primary-container cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start" id="competitions-grid">
            {filteredCompetitions.map(comp => (
              <CompetitionCard
                key={comp.id}
                competition={comp}
                onSelectTrack={(slug) => onNavigate('registration', slug)}
              />
            ))}
          </div>
        )}
      </section>

      {/* De-Cluttered & Simplified Competition Guidelines (3 Clean Pillars) */}
      <section className="w-full py-20 px-6 lg:px-12 max-w-7xl mx-auto border-t border-outline-variant/20">
        <div className="max-w-3xl mb-12">
          <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest block mb-2">
            Rules of Engagement
          </span>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
            Universal Competition Directives
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
            Essential directives applicable across all competitive brackets at NED University. Full rubric and laboratory safety codes are detailed in the Guidelines section.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded bg-surface-container-low border border-outline-variant/30 space-y-3">
            <div className="flex items-center gap-2.5 text-primary">
              <span className="material-symbols-outlined text-[22px]">badge</span>
              <h3 className="font-headline-sm text-[16px] font-semibold text-on-surface">Valid Accreditation</h3>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Every competitor must bring their official university student ID card. Cross-institutional teams are permitted and encouraged.
            </p>
          </div>

          <div className="p-6 rounded bg-surface-container-low border border-outline-variant/30 space-y-3">
            <div className="flex items-center gap-2.5 text-primary">
              <span className="material-symbols-outlined text-[22px]">bolt</span>
              <h3 className="font-headline-sm text-[16px] font-semibold text-on-surface">Lab Safety Directives</h3>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Robotics power sources must not exceed 24V DC. High-voltage prototypes are restricted to isolated safety benches with faculty approval.
            </p>
          </div>

          <div className="p-6 rounded bg-surface-container-low border border-outline-variant/30 space-y-3">
            <div className="flex items-center gap-2.5 text-primary">
              <span className="material-symbols-outlined text-[22px]">gavel</span>
              <h3 className="font-headline-sm text-[16px] font-semibold text-on-surface">Judicial Evaluation</h3>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Panels comprise senior NED faculty and leading industry technologists. Jury rulings are final across all scoring brackets.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
