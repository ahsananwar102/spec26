import React from 'react';

interface GuidelinesPageProps {
  onNavigate: (tab: string) => void;
}

export const GuidelinesPage: React.FC<GuidelinesPageProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto px-6 lg:px-12 py-12 md:py-16">
      {/* Title */}
      <div className="max-w-3xl space-y-4">
        <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded bg-surface-container-high text-primary font-label-caps text-label-caps uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
          Directives &amp; Protocol
        </div>
        <h1 className="font-headline-lg sm:font-display-lg text-headline-lg sm:text-display-lg font-bold text-on-surface tracking-tight">
          Competition Guidelines &amp; Directives
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
          Comprehensive accreditation criteria, electrical safety regulations, presentation standards, and judicial ethics enforced across all SPEC'26 competition tracks.
        </p>
      </div>

      {/* Grid of Directives */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Section 1: Institutional Accreditation & Eligibility */}
        <div className="p-8 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-6">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider">Section 01</span>
            <span className="material-symbols-outlined text-primary text-[24px]">school</span>
          </div>
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Participant Eligibility &amp; Accreditation
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
              SPEC'26 is sanctioned for university-level engineering and technology students.
            </p>
          </div>
          <ul className="space-y-3 font-body-sm text-body-sm text-on-surface-variant pt-2 border-t border-outline-variant/20">
            <li className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">check_circle</span>
              <span>Must be enrolled in an undergraduate degree program in an HEC-recognized institution.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">check_circle</span>
              <span>All participants must carry their original university student identity card and official CNIC to the on-campus accreditation desk.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">check_circle</span>
              <span>Inter-university and inter-departmental squads are actively encouraged across all team categories.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">check_circle</span>
              <span>One student may enter up to two non-overlapping tracks upon schedule release.</span>
            </li>
          </ul>
        </div>

        {/* Section 2: Laboratory Safety & Power Regulations */}
        <div className="p-8 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-6">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider">Section 02</span>
            <span className="material-symbols-outlined text-primary text-[24px]">bolt</span>
          </div>
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Electrical Safety &amp; Laboratory Protocol
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
              Rigorous safety protocols mandated inside the Department of Electronic Engineering labs.
            </p>
          </div>
          <ul className="space-y-3 font-body-sm text-body-sm text-on-surface-variant pt-2 border-t border-outline-variant/20">
            <li className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">check_circle</span>
              <span>Robotics power supplies must not exceed 24V DC nominal voltage. LiPo batteries must be transported inside fireproof safety pouches.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">check_circle</span>
              <span>AC mains voltage (220V AC) is restricted strictly to faculty-approved, enclosed isolation setups with GFCI circuit protection.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">check_circle</span>
              <span>Soldering irons must be used exclusively at designated ESD-safe soldering stations with proper fume ventilation.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">check_circle</span>
              <span>Safety goggles must be worn during high-speed mechanical rotations and PCB trimming operations.</span>
            </li>
          </ul>
        </div>

        {/* Section 3: Hardware Demonstration & Poster Guidelines */}
        <div className="p-8 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-6">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider">Section 03</span>
            <span className="material-symbols-outlined text-primary text-[24px]">developer_board</span>
          </div>
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Project Demonstration &amp; Deliverables
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
              Evaluation standards for capstone exhibits and prototype competitions.
            </p>
          </div>
          <ul className="space-y-3 font-body-sm text-body-sm text-on-surface-variant pt-2 border-t border-outline-variant/20">
            <li className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">check_circle</span>
              <span>Each team will be assigned a standardized lab bench (1.5m x 0.8m) with one 220V AC power terminal.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">check_circle</span>
              <span>Research posters must conform to ISO standard A1 portrait format (594mm x 841mm) and be mounted on provided easel boards.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">check_circle</span>
              <span>Judges will assess projects on novelty (25%), engineering execution (35%), commercial viability (20%), and oral pitch defense (20%).</span>
            </li>
          </ul>
        </div>

        {/* Section 4: Academic Integrity & Dispute Resolution */}
        <div className="p-8 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-6">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider">Section 04</span>
            <span className="material-symbols-outlined text-primary text-[24px]">gavel</span>
          </div>
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Code of Conduct &amp; Judicial Integrity
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
              Ethical standards enforced by the Departmental Academic Council.
            </p>
          </div>
          <ul className="space-y-3 font-body-sm text-body-sm text-on-surface-variant pt-2 border-t border-outline-variant/20">
            <li className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">check_circle</span>
              <span>Zero tolerance for plagiarism, non-original hardware acquisition passed as bespoke work, or unsportsmanlike conduct.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">check_circle</span>
              <span>The evaluation jury's verdict is final and binding across all competitive brackets and scorecards.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">check_circle</span>
              <span>Formal disputes must be lodged in writing by the designated team lead to the Chief Faculty Scrutineer within 30 minutes of round conclusion.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="mt-16 p-8 rounded-xl bg-surface-container-high border border-outline-variant/40 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
            Ready to lodge your submission?
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Submit your track preferences and secure your team entry before category allocations expire.
          </p>
        </div>
        <button
          onClick={() => onNavigate('registration')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-container text-on-primary-container font-label-caps text-label-caps uppercase font-bold rounded hover:bg-primary-fixed-dim transition-all shrink-0 cursor-pointer"
        >
          <span>Open Registration Portal</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
