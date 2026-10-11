import React, { useState } from 'react';
import { Competition } from '../types';
import { useEventSettings } from '../lib/store';

interface CompetitionCardProps {
  competition: Competition;
  onSelectTrack: (trackSlug: string) => void;
}

export const CompetitionCard: React.FC<CompetitionCardProps> = ({ competition, onSelectTrack }) => {
  const { eventSettings } = useEventSettings();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rulebookNotice, setRulebookNotice] = useState<string | null>(null);

  const getFormatDisplay = (comp: Competition) => {
    if (comp.format === 'SOLO') {
      return 'Solo Only (1 Member)';
    }
    if (comp.format === 'TEAM') {
      return `Team Only (${comp.minMembers}–${comp.maxMembers} Members)`;
    }
    return `Solo & Team (${comp.minMembers}–${comp.maxMembers} Members)`;
  };

  const getFeeDisplay = (comp: Competition) => {
    if (comp.format === 'SOLO') {
      return `Fee: PKR ${comp.soloFee.toLocaleString()}`;
    }
    if (comp.format === 'TEAM') {
      return `Fee: PKR ${comp.teamFee.toLocaleString()}`;
    }
    return `Solo: PKR ${comp.soloFee.toLocaleString()} | Team: PKR ${comp.teamFee.toLocaleString()}`;
  };

  const getCategoryClass = (category: string) => {
    switch (category) {
      case 'ELECTRONICS':
        return 'text-primary-fixed bg-surface-container-high';
      case 'ROBOTICS':
        return 'text-secondary bg-surface-container-high';
      case 'PROGRAMMING':
        return 'text-secondary bg-surface-container-high';
      case 'PROJECTS':
        return 'text-secondary bg-surface-container-high';
      case 'ESPORTS':
        return 'text-tertiary-fixed-dim bg-surface-container-high';
      default:
        return 'text-primary bg-surface-container-high';
    }
  };

  return (
    <article
      className="comp-card group flex flex-col justify-between p-6 rounded bg-surface-container-low hover:bg-surface-container/90 border border-outline-variant/30 hover:border-primary-container/40 transition-all shadow-sm"
      data-category={competition.category.toLowerCase()}
    >
      <div className="space-y-4">
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <span className={`font-label-caps text-label-caps px-2.5 py-1 rounded uppercase tracking-wider ${getCategoryClass(competition.category)}`}>
            {competition.category}
          </span>
          <span className="font-code-md text-code-md text-outline">
            {String(competition.orderNum).padStart(2, '0')}
          </span>
        </div>

        <div>
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface group-hover:text-primary transition-colors">
            {competition.title}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mt-2">
            {competition.description}
          </p>
        </div>

        {/* Quick Meta Chips: Format & Pricing */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container text-on-surface-variant font-code-md text-code-md border border-outline-variant/30">
            <span className="material-symbols-outlined text-[15px] text-primary">
              {competition.format === 'SOLO' ? 'person' : competition.category === 'ESPORTS' ? 'sports_esports' : 'groups'}
            </span>
            {getFormatDisplay(competition)}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary-container/10 text-primary-fixed-dim font-code-md text-code-md border border-primary-container/20">
            <span className="material-symbols-outlined text-[15px]">payments</span>
            {getFeeDisplay(competition)}
          </span>
        </div>
      </div>

      {/* Interactive Accordion Drawer */}
      <div className="mt-6 pt-4 border-t border-outline-variant/20">
        <button
          type="button"
          onClick={() => setDetailsOpen(!detailsOpen)}
          className="w-full flex items-center justify-between cursor-pointer text-body-sm font-medium text-primary hover:text-primary-container py-1 transition-colors select-none text-left"
        >
          <span className="font-label-caps uppercase tracking-wider text-label-caps">
            Rulebook &amp; Track Details
          </span>
          <span
            className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${
              detailsOpen ? 'rotate-180' : ''
            }`}
          >
            expand_more
          </span>
        </button>

        {detailsOpen && (
          <div className="pt-4 space-y-4 text-body-sm animate-fadeIn">
            {/* Fee Matrix Box */}
            <div className="p-3.5 rounded bg-surface-container-lowest/80 border border-outline-variant/20 space-y-2">
              {competition.format === 'SOLO' && (
                <div className="flex justify-between items-center text-body-sm">
                  <span className="text-on-surface-variant">Solo Entry Fee:</span>
                  <span className="font-bold text-primary-container font-code-md">
                    PKR {competition.soloFee.toLocaleString()} / participant
                  </span>
                </div>
              )}

              {competition.format === 'TEAM' && (
                <div className="flex justify-between items-center text-body-sm">
                  <span className="text-on-surface-variant">Team Entry Fee:</span>
                  <span className="font-bold text-primary-container font-code-md">
                    PKR {competition.teamFee.toLocaleString()} / team
                  </span>
                </div>
              )}

              {competition.format === 'BOTH' && (
                <>
                  <div className="flex justify-between items-center text-body-sm">
                    <span className="text-on-surface-variant">Solo Fee (1 Member):</span>
                    <span className="font-medium text-on-surface font-code-md">
                      PKR {competition.soloFee.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-body-sm">
                    <span className="text-on-surface-variant">Team Fee:</span>
                    <span className="font-bold text-primary-container font-code-md">
                      PKR {competition.teamFee.toLocaleString()}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between items-center text-body-sm pt-1 border-t border-outline-variant/20">
                <span className="text-on-surface-variant">Squad Capacity:</span>
                <span className="font-medium text-on-surface font-code-md">
                  {competition.minMembers} {competition.minMembers === competition.maxMembers ? 'Member' : `– ${competition.maxMembers} Members`}
                </span>
              </div>
            </div>

            {/* Key Deliverables & Provisions */}
            {competition.keyDeliverables && (
              <div className="space-y-1 text-on-surface-variant">
                <p className="font-label-caps uppercase text-label-caps text-secondary tracking-wider">
                  Key Deliverables &amp; Rules
                </p>
                <p className="leading-relaxed text-xs">
                  {competition.keyDeliverables}
                </p>
              </div>
            )}

            {/* Action Buttons: View Rulebook & Register */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch gap-2.5">
              {competition.rulebookUrl && competition.rulebookUrl.trim() ? (
                <a
                  href={competition.rulebookUrl.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-on-surface hover:text-white font-label-caps text-label-caps tracking-wider font-semibold transition-colors cursor-pointer text-center"
                >
                  <span className="material-symbols-outlined text-[16px] text-secondary">menu_book</span>
                  <span>View Rulebook</span>
                  <span className="material-symbols-outlined text-[14px] text-outline">open_in_new</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setRulebookNotice(`The official rulebook document for "${competition.title}" will be uploaded shortly.`);
                    setTimeout(() => setRulebookNotice(null), 4000);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded bg-surface-container/70 border border-outline-variant/30 text-on-surface-variant hover:text-white font-label-caps text-label-caps tracking-wider font-semibold transition-colors cursor-pointer text-center"
                  title="Official rulebook document will be uploaded soon"
                >
                  <span className="material-symbols-outlined text-[16px] text-secondary">menu_book</span>
                  <span>View Rulebook</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onSelectTrack(competition.slug)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded bg-primary-container text-on-primary-container hover:bg-primary-fixed-dim hover:text-on-primary-fixed font-label-caps text-label-caps tracking-wider font-semibold transition-colors cursor-pointer"
              >
                <span>
                  {eventSettings.registrationPhase === 'NOT_STARTED' ? 'View Opening Info' :
                   eventSettings.registrationPhase === 'CLOSED' ? 'Registration Closed' :
                   'Register'}
                </span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            {rulebookNotice && (
              <p className="text-[11px] text-yellow-300 font-code-md animate-fadeIn pt-1">
                {rulebookNotice}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
};
