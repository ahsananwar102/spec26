import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth, useCompetitions, useRegistrations, useEventSettings, formatDisplayDate } from '../lib/store';
import { ParticipationModel, TeamMember } from '../types';
import { createRegistration } from '../services/databaseService';

interface RegistrationPageProps {
  onNavigate: (tab: string) => void;
  preselectedTrackSlug?: string;
}

export const RegistrationPage: React.FC<RegistrationPageProps> = ({ onNavigate, preselectedTrackSlug }) => {
  const { currentUser } = useAuth();
  const { competitions } = useCompetitions();
  const { addRegistration } = useRegistrations();
  const { eventSettings } = useEventSettings();

  const activeCompetitions = useMemo(() => {
    return competitions.filter(c => c.isActive);
  }, [competitions]);

  // Selected competition state
  const [selectedCompSlug, setSelectedCompSlug] = useState<string>(preselectedTrackSlug || '');

  // Find currently selected competition
  const selectedCompetition = useMemo(() => {
    return activeCompetitions.find(c => c.slug === selectedCompSlug) || activeCompetitions[0];
  }, [activeCompetitions, selectedCompSlug]);

  // Participation Model: SOLO vs TEAM
  const [participationModel, setParticipationModel] = useState<ParticipationModel>('SOLO');

  // Form Fields
  const [teamName, setTeamName] = useState('');
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [studentId, setStudentId] = useState(currentUser?.studentId || '');
  const [universityName, setUniversityName] = useState(currentUser?.university || 'NED University of Eng. & Tech.');
  const [department, setDepartment] = useState(currentUser?.department || 'Electronic Engineering');
  const [academicYear, setAcademicYear] = useState('final-year');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '+92 300 1234567');
  const [emailAddress, setEmailAddress] = useState(currentUser?.email || '');

  // Secondary Team Members
  const [member2Name, setMember2Name] = useState('');
  const [member2Id, setMember2Id] = useState('');
  const [member2Email, setMember2Email] = useState('');

  const [member3Name, setMember3Name] = useState('');
  const [member3Id, setMember3Id] = useState('');
  const [member3Email, setMember3Email] = useState('');

  const [member4Name, setMember4Name] = useState('');
  const [member4Id, setMember4Id] = useState('');
  const [member4Email, setMember4Email] = useState('');

  // Payment Confirmation
  const [paymentChannel, setPaymentChannel] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [agreeRules, setAgreeRules] = useState(false);

  // Submission State & Feedback
  const [submittedRegId, setSubmittedRegId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>('');
  const [fileError, setFileError] = useState<string>('');
  const [copiedToken, setCopiedToken] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with preselectedTrackSlug if passed
  useEffect(() => {
    if (preselectedTrackSlug) {
      setSelectedCompSlug(preselectedTrackSlug);
    } else if (activeCompetitions.length > 0 && !selectedCompSlug) {
      setSelectedCompSlug(activeCompetitions[0].slug);
    }
  }, [preselectedTrackSlug, activeCompetitions]);

  // Auto-adjust participation model based on competition format constraint
  useEffect(() => {
    if (selectedCompetition) {
      if (selectedCompetition.format === 'SOLO') {
        setParticipationModel('SOLO');
      } else if (selectedCompetition.format === 'TEAM') {
        setParticipationModel('TEAM');
      }
    }
  }, [selectedCompetition]);

  // Calculate dynamic fee
  const calculatedFee = useMemo(() => {
    if (!selectedCompetition) return 1000;
    if (participationModel === 'SOLO') {
      return selectedCompetition.soloFee || 1000;
    } else {
      return selectedCompetition.teamFee || 2500;
    }
  }, [selectedCompetition, participationModel]);

  // Handle Receipt Upload (validates size < 5MB and converts file to data URL)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFileError('The selected file exceeds 5MB. Please upload an image under 5MB.');
      return;
    }
    setFileError('');
    setReceiptFile(file);
    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setReceiptUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Copy token to clipboard
  const handleCopyToken = () => {
    if (submittedRegId) {
      navigator.clipboard.writeText(submittedRegId);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2500);
    }
  };

  // Download official entry summary as text file
  const handleDownloadTokenSummary = () => {
    if (!submittedRegId) return;
    const summary = `=====================================================
SPEC'26 - STUDENTS' PROJECT EXHIBITION & COMPETITION
Department of Electronic Engineering, NED University
Official Registration Token & Confirmation
=====================================================

REGISTRATION TOKEN : ${submittedRegId}
DATE LODGED        : ${new Date().toLocaleString()}
COMPETITION TRACK  : ${selectedCompetition?.title || 'Competition Track'}
CATEGORY           : ${selectedCompetition?.category}
PARTICIPATION      : ${participationModel}
TEAM NAME          : ${teamName || fullName}
PRIMARY CANDIDATE  : ${fullName}
STUDENT ROLL NO    : ${studentId}
UNIVERSITY         : ${universityName}
DEPARTMENT         : ${department}
ACADEMIC YEAR      : ${academicYear}
CONTACT PHONE      : ${phoneNumber}
EMAIL ADDRESS      : ${emailAddress}

PAYMENT METHOD     : ${paymentChannel.toUpperCase()}
TRANSACTION ID     : ${transactionId}
ASSESSED FEE       : PKR ${calculatedFee.toLocaleString()}
STATUS             : PENDING DESK VERIFICATION

IMPORTANT INSTRUCTIONS:
1. Please retain this token for on-site accreditation.
2. Present your original university student ID card upon entry.
3. Event venue: NED University of Engineering & Technology, Main Campus.
For queries: spec@neduet.edu.pk | +92 21 99261261
=====================================================`;
    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SPEC26_${submittedRegId}_Confirmation.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fullName.trim() || !studentId.trim() || !emailAddress.trim() || !phoneNumber.trim()) {
      setFormError('Please complete all mandatory participant fields (Full Name, Student Roll No, Email, Phone).');
      return;
    }

    if (!agreeRules) {
      setFormError('Please agree to the SPEC\'26 competition regulations to proceed.');
      return;
    }
    if (!receiptUrl && !receiptFile) {
      setFormError('Please upload your payment voucher screenshot or stamped bank slip.');
      return;
    }

    setSubmitting(true);

    const teamMembersInput = [];
    if (participationModel === 'TEAM') {
      if (member2Name.trim()) {
        teamMembersInput.push({
          memberNumber: 2,
          fullName: member2Name,
          studentId: member2Id || 'N/A',
          email: member2Email || undefined
        });
      }
      if (member3Name.trim()) {
        teamMembersInput.push({
          memberNumber: 3,
          fullName: member3Name,
          studentId: member3Id || 'N/A',
          email: member3Email || undefined
        });
      }
      if (member4Name.trim()) {
        teamMembersInput.push({
          memberNumber: 4,
          fullName: member4Name,
          studentId: member4Id || 'N/A',
          email: member4Email || undefined
        });
      }
    }

    const res = await createRegistration(
      {
        userId: currentUser?.id || 'guest',
        competitionId: selectedCompetition.id,
        competitionTitle: selectedCompetition.title,
        competitionCategory: selectedCompetition.category,
        participationModel: participationModel === 'TEAM' ? 'team' : 'individual',
        teamName: participationModel === 'TEAM' ? teamName || `${fullName}'s Squad` : undefined,
        leaderName: fullName,
        leaderStudentId: studentId,
        university: universityName,
        department,
        academicYear,
        phone: phoneNumber,
        email: emailAddress,
        paymentChannel: paymentChannel || 'raast',
        transactionId: transactionId || `TRX-${Date.now().toString().slice(-6)}`,
        calculatedFee,
      },
      teamMembersInput,
      receiptFile || receiptUrl
    );

    setSubmitting(false);
    if (res.data) {
      setSubmittedRegId(res.data.registration_id || res.data.registrationId);
    } else {
      setFormError('Registration submission error: ' + (res.error || 'Unknown error occurred. Please check network.'));
    }
  };

  // -------------------------------------------------------------
  // REGISTRATIONS ABOUT TO START VIEW (Dynamic Admin Setting)
  // -------------------------------------------------------------
  if (eventSettings.registrationPhase === 'NOT_STARTED') {
    return (
      <div className="flex flex-col w-full max-w-5xl mx-auto px-6 lg:px-8 py-14 sm:py-20 animate-fadeIn">
        <div className="bg-surface-container border border-yellow-500/40 rounded-2xl p-8 sm:p-14 text-center space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

          <div className="w-20 h-20 rounded-full bg-yellow-500/20 text-yellow-400 mx-auto flex items-center justify-center border border-yellow-500/40 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
            <span className="material-symbols-outlined text-[42px]">hourglass_top</span>
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 text-xs font-code-md uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
              Registration Window Opening Soon
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
              Registrations Have Not Started Yet
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              The departmental registration portal for the Students' Project Exhibition &amp; Competition (SPEC'26) has not commenced yet. All undergraduate engineering and computing students across Pakistan will be able to register squads and select competition tracks starting on the date below.
            </p>
          </div>

          {/* Key Date Highlight Box */}
          <div className="p-6 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 max-w-lg mx-auto space-y-2">
            <span className="text-xs font-code-md text-outline uppercase tracking-wider block">
              Official Registration Opening Date
            </span>
            <div className="font-display text-2xl sm:text-3xl font-bold text-yellow-300">
              {formatDisplayDate(eventSettings.registrationStartDate)}
            </div>
            <p className="text-xs text-on-surface-variant font-code-md">
              Department of Electronic Engineering, NED University Main Campus
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('competitions')}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-primary-container text-on-primary-container font-code-md text-xs uppercase tracking-widest font-semibold hover:bg-primary-fixed-dim transition-all rounded cursor-pointer shadow-md"
            >
              <span>Explore 11 Competition Tracks</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
            <button
              onClick={() => onNavigate('guidelines')}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-surface-container-high text-on-surface hover:text-white border border-outline-variant/40 font-code-md text-xs uppercase tracking-widest font-semibold transition-all rounded cursor-pointer"
            >
              <span>Review Guidelines &amp; Directives</span>
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-surface-container-high text-on-surface hover:text-white border border-outline-variant/40 font-code-md text-xs uppercase tracking-widest font-semibold transition-all rounded cursor-pointer"
            >
              <span>Contact Event Desk</span>
            </button>
          </div>
        </div>

        {/* Tracks Preview */}
        <div className="mt-14 space-y-6">
          <div className="text-center space-y-1">
            <span className="font-label-caps text-xs text-secondary uppercase tracking-widest">
              Available Engineering Arenas
            </span>
            <h3 className="font-headline-sm text-headline-sm font-semibold text-white">
              Get Your Squad Ready For These Categories
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCompetitions.slice(0, 6).map((comp) => (
              <div key={comp.id} className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
                <span className="font-label-caps text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-secondary">
                  {comp.category}
                </span>
                <h4 className="font-bold text-white text-sm">{comp.title}</h4>
                <p className="text-xs text-on-surface-variant line-clamp-2">{comp.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // REGISTRATIONS CLOSED VIEW (Dynamic Admin Setting)
  // -------------------------------------------------------------
  if (eventSettings.registrationPhase === 'CLOSED') {
    return (
      <div className="flex flex-col w-full max-w-5xl mx-auto px-6 lg:px-8 py-14 sm:py-20 animate-fadeIn">
        <div className="bg-surface-container border border-red-500/40 rounded-2xl p-8 sm:p-14 text-center space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

          <div className="w-20 h-20 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center border border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <span className="material-symbols-outlined text-[42px]">event_busy</span>
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded bg-red-500/15 text-red-300 border border-red-500/30 text-xs font-code-md uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              Registration Window Concluded
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
              Registrations Have Ended
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              The submission portal for the Students' Project Exhibition &amp; Competition (SPEC'26) has officially concluded. The Department of Electronic Engineering is currently verifying applicant dossiers and dispatching final tournament schedules to registered team leads.
            </p>
          </div>

          {/* Key Date Highlight Box */}
          <div className="p-6 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 max-w-lg mx-auto space-y-2">
            <span className="text-xs font-code-md text-outline uppercase tracking-wider block">
              Registrations Formally Concluded On
            </span>
            <div className="font-display text-2xl sm:text-3xl font-bold text-red-400">
              {formatDisplayDate(eventSettings.registrationEndDate)}
            </div>
            <p className="text-xs text-on-surface-variant font-code-md">
              Exhibition Dates: {eventSettings.competitionDates} &middot; NED Main Campus
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('competitions')}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-primary-container text-on-primary-container font-code-md text-xs uppercase tracking-widest font-semibold hover:bg-primary-fixed-dim transition-all rounded cursor-pointer shadow-md"
            >
              <span>Explore Competition Tracks</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-surface-container-high text-on-surface hover:text-white border border-outline-variant/40 font-code-md text-xs uppercase tracking-widest font-semibold transition-all rounded cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">support_agent</span>
              <span>Contact Event Administration</span>
            </button>
            <button
              onClick={() => onNavigate('guidelines')}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-surface-container-high text-on-surface hover:text-white border border-outline-variant/40 font-code-md text-xs uppercase tracking-widest font-semibold transition-all rounded cursor-pointer"
            >
              <span>Event Guidelines &amp; Directives</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // NON-LOGGED-IN VIEW (Exact structure from registration_page_non_loggedin_code.html)
  // -------------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="flex flex-col w-full">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-10 lg:py-16 space-y-16">
          {/* Streamlined Minimal Hero */}
          <div className="text-center max-w-3xl mx-auto pt-4 pb-2 space-y-4">
            <h1 className="font-display-lg text-display-lg font-bold text-on-background tracking-tight">
              Registration Portal
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto leading-relaxed">
              Log in or create an account to register your team for SPEC'26. Complete your entry, submit project tracks, and manage team members.
            </p>
          </div>

          {/* Centered Modern Authentication Gateway Card */}
          <div className="max-w-2xl mx-auto bg-surface-container p-8 sm:p-12 text-center space-y-8 shadow-xl relative overflow-hidden rounded-xl border border-outline-variant/30">
            <div className="w-14 h-14 rounded-full bg-surface-container-high text-primary flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-[28px]">lock_open</span>
            </div>

            <div className="space-y-3">
              <h2 className="font-headline-md text-headline-md font-bold text-on-background tracking-tight">
                Sign In to Get Started
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mx-auto leading-relaxed">
                An authenticated participant account is required to register project submissions, select competition tracks, and complete payment verification.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={() => onNavigate('login')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary-container text-on-primary-container font-code-lg text-code-lg font-semibold tracking-wide hover:bg-primary-fixed-dim transition-all active:translate-y-0.5 rounded cursor-pointer"
              >
                <span>Log In to Continue</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
              <button
                onClick={() => onNavigate('signup')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-surface-container-high text-on-surface hover:text-primary hover:bg-surface-container-highest font-code-lg text-code-lg font-semibold tracking-wide transition-all active:translate-y-0.5 rounded border border-outline-variant/40 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span>Create Account</span>
              </button>
            </div>
          </div>

          {/* Streamlined Minimal 5-Step Pipeline Preview */}
          <div className="max-w-4xl mx-auto pt-6 space-y-6">
            <div className="text-center space-y-1">
              <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">
                Registration Workflow
              </span>
              <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                5-Step Easy Submission Pipeline
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
              <div className="bg-surface-container p-4 text-center space-y-1.5 rounded border border-outline-variant/20">
                <span className="font-code-md text-code-md text-primary font-semibold block">01</span>
                <p className="font-headline-sm text-[14px] font-semibold text-on-surface">Track Selection</p>
                <p className="font-body-sm text-[12px] text-on-surface-variant">Hardware &amp; Software</p>
              </div>
              <div className="bg-surface-container p-4 text-center space-y-1.5 rounded border border-outline-variant/20">
                <span className="font-code-md text-code-md text-primary font-semibold block">02</span>
                <p className="font-headline-sm text-[14px] font-semibold text-on-surface">Participation Model</p>
                <p className="font-body-sm text-[12px] text-on-surface-variant">Solo or Squad</p>
              </div>
              <div className="bg-surface-container p-4 text-center space-y-1.5 rounded border border-outline-variant/20">
                <span className="font-code-md text-code-md text-primary font-semibold block">03</span>
                <p className="font-headline-sm text-[14px] font-semibold text-on-surface">Participant Details</p>
                <p className="font-body-sm text-[12px] text-on-surface-variant">Member &amp; ID Records</p>
              </div>
              <div className="bg-surface-container p-4 text-center space-y-1.5 rounded border border-outline-variant/20">
                <span className="font-code-md text-code-md text-primary font-semibold block">04</span>
                <p className="font-headline-sm text-[14px] font-semibold text-on-surface">Payment Slip</p>
                <p className="font-body-sm text-[12px] text-on-surface-variant">Fee Confirmation</p>
              </div>
              <div className="bg-surface-container p-4 text-center space-y-1.5 rounded border border-outline-variant/20">
                <span className="font-code-md text-code-md text-primary font-semibold block">05</span>
                <p className="font-headline-sm text-[14px] font-semibold text-on-surface">Complete</p>
                <p className="font-body-sm text-[12px] text-on-surface-variant">Pass &amp; Badge Issued</p>
              </div>
            </div>
          </div>

          {/* Streamlined Compact Support Row */}
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="bg-surface-container p-6 space-y-3 rounded-xl border border-outline-variant/30">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[22px]">support_agent</span>
                <h4 className="font-headline-sm text-[16px] text-on-surface font-semibold">Need Help Registering?</h4>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Have queries about team eligibility or institutional affiliation? Contact our registration desk at{' '}
                <a className="text-primary hover:underline font-code-md text-code-md" href="mailto:spec@neduet.edu.pk">
                  spec@neduet.edu.pk
                </a>.
              </p>
            </div>

            <div className="bg-surface-container p-6 space-y-3 rounded-xl border border-outline-variant/30">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[22px]">rule</span>
                <h4 className="font-headline-sm text-[16px] text-on-surface font-semibold">Eligibility Criteria</h4>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Open to all undergraduate and graduate students from accredited institutions across Pakistan. Valid student ID required during event check-in.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SUCCESS VIEW: Rendered when registration is submitted
  // -------------------------------------------------------------
  if (submittedRegId) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center space-y-8 animate-fadeIn">
        <div className="w-20 h-20 rounded-full bg-primary-container/20 text-primary-container mx-auto flex items-center justify-center border border-primary-container/40 shadow-[0_0_30px_rgba(0,240,255,0.2)]">
          <span className="material-symbols-outlined text-[42px]">check_circle</span>
        </div>

        <div className="space-y-3">
          <span className="font-label-caps text-label-caps uppercase px-3 py-1 rounded bg-surface-container-high text-primary tracking-wider">
            Registration Lodged Successfully
          </span>
          <h1 className="font-display-lg text-headline-lg sm:text-display-md font-bold text-white tracking-tight">
            Entry Confirmed
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto leading-relaxed">
            Your application for SPEC'26 has been logged into our departmental registration registry. A verification token has been issued below.
          </p>
        </div>

        {/* Voucher Badge */}
        <div className="p-6 rounded-xl bg-surface-container border border-primary-container/30 space-y-4 max-w-md mx-auto shadow-xl text-left">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
            <span className="font-label-caps text-[11px] text-secondary uppercase tracking-widest">
              OFFICIAL DESK TOKEN
            </span>
            <span className="font-code-md text-xs px-2 py-0.5 rounded bg-primary-container/20 text-primary font-semibold">
              PENDING VERIFICATION
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-[11px] font-code-md text-outline uppercase block">Registration ID</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-code-lg text-lg text-primary-container font-bold tracking-wider">
                  {submittedRegId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="px-2 py-0.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-primary border border-outline-variant/40 text-xs font-code-md flex items-center gap-1 transition-colors cursor-pointer"
                  title="Copy token to clipboard"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copiedToken ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedToken ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-outline uppercase text-[10px]">Track:</span>
                <span className="font-semibold text-white block truncate">{selectedCompetition?.title}</span>
              </div>
              <div>
                <span className="text-outline uppercase text-[10px]">Format:</span>
                <span className="font-semibold text-white block capitalize">{participationModel.toLowerCase()}</span>
              </div>
              <div>
                <span className="text-outline uppercase text-[10px]">Lead / Participant:</span>
                <span className="font-semibold text-white block truncate">{fullName}</span>
              </div>
              <div>
                <span className="text-outline uppercase text-[10px]">Assessed Fee:</span>
                <span className="font-bold text-primary block">PKR {calculatedFee.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleDownloadTokenSummary}
            className="px-5 py-2.5 rounded bg-surface-container text-primary hover:text-white border border-outline-variant/40 font-code-md text-xs uppercase tracking-wider font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Download Pass Summary
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2.5 rounded bg-surface-container text-on-surface hover:text-white border border-outline-variant/40 font-code-md text-xs uppercase tracking-wider font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            Print Token
          </button>
          <button
            onClick={() => {
              setSubmittedRegId(null);
              setReceiptUrl('');
              setReceiptFileName('');
              setTransactionId('');
            }}
            className="px-5 py-2.5 rounded bg-surface-container text-on-surface hover:text-white border border-outline-variant/40 font-code-md text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
          >
            Register Another Track
          </button>
          <button
            onClick={() => onNavigate('competitions')}
            className="px-5 py-2.5 rounded bg-primary-container text-on-primary-container hover:bg-primary-fixed-dim font-code-md text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
          >
            Explore Other Tracks →
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // FULL LOGGED-IN REGISTRATION FORM (Exact structure from registration_page_code.html)
  // -------------------------------------------------------------
  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12 md:py-20 w-full">
      {/* Title & Introduction */}
      <div className="space-y-4 max-w-2xl mb-12">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-surface-container-high text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
            <span className="font-label-caps text-label-caps uppercase tracking-wider">Registration Portal &middot; Open</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-surface-container-high border border-outline-variant/30 text-on-surface-variant font-code-md text-xs">
            <span className="material-symbols-outlined text-[15px] text-primary">schedule</span>
            <span>Deadline: <strong className="text-white">{formatDisplayDate(eventSettings.registrationEndDate)}</strong></span>
          </div>
        </div>
        <h1 className="font-display-lg text-display-lg font-bold tracking-tight text-primary">
          Register for SPEC’26
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
          Submit your team or individual details for the Students’ Project Exhibition and Competition. Registrations are open to undergraduate engineering and computing students across Pakistan.
        </p>
      </div>

      {/* Main Registration Container */}
      <div className="bg-surface-container-lowest rounded-xl p-8 sm:p-12 shadow-xl mb-12 border border-outline-variant/30">
        <form className="space-y-12" onSubmit={handleSubmit}>
          {/* Section 1: Competition Selection */}
          <section className="space-y-5">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-surface-container-high text-primary flex items-center justify-center font-code-md text-code-md font-semibold">
                  1
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Competition Selection
                </h2>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Step 1 of 5</span>
            </div>

            <div className="space-y-2">
              <label className="block font-body-sm text-body-sm font-medium text-on-surface" htmlFor="competition-category">
                Select Competition Category <span className="text-error">*</span>
              </label>
              <div className="relative">
                <select
                  className="w-full h-12 px-4 rounded bg-surface-container text-on-surface font-body-md text-body-md focus:bg-surface-container-high outline-none transition-colors appearance-none cursor-pointer border border-outline-variant/30"
                  id="competition-category"
                  name="competition_category"
                  required
                  value={selectedCompSlug}
                  onChange={(e) => setSelectedCompSlug(e.target.value)}
                >
                  {activeCompetitions.map(comp => (
                    <option key={comp.id} value={comp.slug}>
                      {comp.title} ({comp.category})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">expand_more</span>
                </div>
              </div>

              {/* Dynamic Track Specs Note */}
              <div className="flex items-center gap-2 pt-2 text-secondary font-code-md text-code-md">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span>
                  {selectedCompetition?.specsSummary || 'Display bench & laboratory test equipment provided.'}
                </span>
              </div>
            </div>
          </section>

          <div className="h-px bg-surface-container-high w-full"></div>

          {/* Section 2: Registration Type / Participation Model */}
          <section className="space-y-6">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-surface-container-high text-primary flex items-center justify-center font-code-md text-code-md font-semibold">
                  2
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Participation Model
                </h2>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Step 2 of 5</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Individual Participant Option */}
              <label
                className={`flex items-start gap-4 p-5 rounded-lg border transition-all cursor-pointer ${
                  participationModel === 'SOLO'
                    ? 'bg-surface-container border-primary-container/60 shadow-sm'
                    : 'bg-surface-container-low border-outline-variant/30 hover:bg-surface-container'
                } ${selectedCompetition?.format === 'TEAM' ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="registration_type"
                  value="SOLO"
                  checked={participationModel === 'SOLO'}
                  disabled={selectedCompetition?.format === 'TEAM'}
                  onChange={() => setParticipationModel('SOLO')}
                  className="mt-1 w-4 h-4 accent-primary-container cursor-pointer"
                />
                <div className="space-y-1">
                  <div className="font-headline-sm text-headline-sm text-on-surface font-medium">
                    Individual Participant
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Best for solo tracks including Speedy Soldering and Speed Programming.
                  </p>
                  {selectedCompetition?.format === 'TEAM' && (
                    <span className="text-[11px] text-error font-code-md block">
                      * This track requires team entry.
                    </span>
                  )}
                </div>
              </label>

              {/* Team Entry Option */}
              <label
                className={`flex items-start gap-4 p-5 rounded-lg border transition-all cursor-pointer ${
                  participationModel === 'TEAM'
                    ? 'bg-surface-container border-primary-container/60 shadow-sm'
                    : 'bg-surface-container-low border-outline-variant/30 hover:bg-surface-container'
                } ${selectedCompetition?.format === 'SOLO' ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="registration_type"
                  value="TEAM"
                  checked={participationModel === 'TEAM'}
                  disabled={selectedCompetition?.format === 'SOLO'}
                  onChange={() => setParticipationModel('TEAM')}
                  className="mt-1 w-4 h-4 accent-primary-container cursor-pointer"
                />
                <div className="space-y-1">
                  <div className="font-headline-sm text-headline-sm text-on-surface font-medium">
                    Team Entry (2–4 Members)
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Required for Robotics, Hackathons, and multi-member project showcases.
                  </p>
                  {selectedCompetition?.format === 'SOLO' && (
                    <span className="text-[11px] text-error font-code-md block">
                      * This track is strictly solo.
                    </span>
                  )}
                </div>
              </label>
            </div>

            {/* Dynamic Team Name Box (rendered conditionally if TEAM format selected) */}
            {participationModel === 'TEAM' && (
              <div className="pt-2 space-y-2 animate-fadeIn">
                <label className="block font-body-sm text-body-sm font-medium text-on-surface" htmlFor="team-name">
                  Team Title / Project Handle <span className="text-error">*</span>
                </label>
                <input
                  className="w-full h-12 px-4 rounded bg-surface-container text-on-surface font-body-md text-body-md focus:bg-surface-container-high outline-none transition-colors border border-outline-variant/30"
                  id="team-name"
                  name="team_name"
                  placeholder="e.g., NED Apex Robotics"
                  required
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>
            )}
          </section>

          <div className="h-px bg-surface-container-high w-full"></div>

          {/* Section 3: Participant / Leader Details */}
          <section className="space-y-6">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-surface-container-high text-primary flex items-center justify-center font-code-md text-code-md font-semibold">
                  3
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  {participationModel === 'TEAM' ? 'Team Leader Details' : 'Participant Details'}
                </h2>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Step 3 of 5</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-body-sm text-body-sm font-medium text-on-surface" htmlFor="full-name">
                  Full Name <span className="text-error">*</span>
                </label>
                <input
                  className="w-full h-12 px-4 rounded bg-surface-container text-on-surface font-body-md text-body-md focus:bg-surface-container-high outline-none transition-colors border border-outline-variant/30"
                  id="full-name"
                  name="full_name"
                  placeholder="Muhammad Ali"
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="block font-body-sm text-body-sm font-medium text-on-surface" htmlFor="student-id">
                  Roll No. / University Student ID <span className="text-error">*</span>
                </label>
                <input
                  className="w-full h-12 px-4 rounded bg-surface-container text-on-surface font-body-md text-body-md focus:bg-surface-container-high outline-none transition-colors border border-outline-variant/30"
                  id="student-id"
                  name="student_id"
                  placeholder="ES-042/2022"
                  required
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="block font-body-sm text-body-sm font-medium text-on-surface" htmlFor="university-name">
                  University / Institution Name <span className="text-error">*</span>
                </label>
                <input
                  className="w-full h-12 px-4 rounded bg-surface-container text-on-surface font-body-md text-body-md focus:bg-surface-container-high outline-none transition-colors border border-outline-variant/30"
                  id="university-name"
                  name="university_name"
                  placeholder="NED University of Eng. & Tech."
                  required
                  type="text"
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="block font-body-sm text-body-sm font-medium text-on-surface" htmlFor="department">
                  Department / Discipline <span className="text-error">*</span>
                </label>
                <input
                  className="w-full h-12 px-4 rounded bg-surface-container text-on-surface font-body-md text-body-md focus:bg-surface-container-high outline-none transition-colors border border-outline-variant/30"
                  id="department"
                  name="department"
                  placeholder="Electronic Engineering"
                  required
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="block font-body-sm text-body-sm font-medium text-on-surface" htmlFor="academic-year">
                  Academic Year / Semester <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <select
                    className="w-full h-12 px-4 rounded bg-surface-container text-on-surface font-body-md text-body-md focus:bg-surface-container-high outline-none transition-colors appearance-none cursor-pointer border border-outline-variant/30"
                    id="academic-year"
                    name="academic_year"
                    required
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                  >
                    <option value="1st-year">First Year (Semesters 1-2)</option>
                    <option value="2nd-year">Second Year (Semesters 3-4)</option>
                    <option value="3rd-year">Third Year (Semesters 5-6)</option>
                    <option value="final-year">Final Year (Semesters 7-8)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px]">expand_more</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-body-sm text-body-sm font-medium text-on-surface" htmlFor="phone-number">
                  Phone / WhatsApp Number <span className="text-error">*</span>
                </label>
                <input
                  className="w-full h-12 px-4 rounded bg-surface-container text-on-surface font-body-md text-body-md focus:bg-surface-container-high outline-none transition-colors border border-outline-variant/30"
                  id="phone-number"
                  name="phone_number"
                  placeholder="+92 300 1234567"
                  required
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block font-body-sm text-body-sm font-medium text-on-surface" htmlFor="email-address">
                  Institutional or Primary Email Address <span className="text-error">*</span>
                </label>
                <input
                  className="w-full h-12 px-4 rounded bg-surface-container text-on-surface font-body-md text-body-md focus:bg-surface-container-high outline-none transition-colors border border-outline-variant/30"
                  id="email-address"
                  name="email_address"
                  placeholder="m.ali@cloud.neduet.edu.pk"
                  required
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                />
              </div>
            </div>

            {/* Secondary Team Members Sub-Grid (Dynamic conditional UI) */}
            {participationModel === 'TEAM' && (
              <div className="pt-6 space-y-6 animate-fadeIn">
                <div className="flex items-center gap-2 text-primary font-headline-sm text-headline-sm">
                  <span className="material-symbols-outlined text-[20px]">group</span>
                  <h3>Additional Team Members</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Member 2 */}
                  <div className="p-4 rounded bg-surface-container border border-outline-variant/30 space-y-3">
                    <span className="font-label-caps text-label-caps text-secondary uppercase font-semibold">
                      Member 02 <span className="text-error">*</span>
                    </span>
                    <input
                      className="w-full h-10 px-3 rounded bg-surface-container-high text-on-surface font-body-sm text-body-sm outline-none border border-outline-variant/30"
                      name="member_2_name"
                      placeholder="Full Name *"
                      required
                      type="text"
                      value={member2Name}
                      onChange={(e) => setMember2Name(e.target.value)}
                    />
                    <input
                      className="w-full h-10 px-3 rounded bg-surface-container-high text-on-surface font-body-sm text-body-sm outline-none border border-outline-variant/30"
                      name="member_2_id"
                      placeholder="Roll No / Student ID *"
                      required
                      type="text"
                      value={member2Id}
                      onChange={(e) => setMember2Id(e.target.value)}
                    />
                    <input
                      className="w-full h-10 px-3 rounded bg-surface-container-high text-on-surface font-body-sm text-body-sm outline-none border border-outline-variant/30"
                      name="member_2_email"
                      placeholder="Email Address"
                      type="email"
                      value={member2Email}
                      onChange={(e) => setMember2Email(e.target.value)}
                    />
                  </div>

                  {/* Member 3 */}
                  <div className="p-4 rounded bg-surface-container border border-outline-variant/30 space-y-3">
                    <span className="font-label-caps text-label-caps text-secondary uppercase font-semibold">
                      Member 03
                    </span>
                    <input
                      className="w-full h-10 px-3 rounded bg-surface-container-high text-on-surface font-body-sm text-body-sm outline-none border border-outline-variant/30"
                      name="member_3_name"
                      placeholder="Full Name"
                      type="text"
                      value={member3Name}
                      onChange={(e) => setMember3Name(e.target.value)}
                    />
                    <input
                      className="w-full h-10 px-3 rounded bg-surface-container-high text-on-surface font-body-sm text-body-sm outline-none border border-outline-variant/30"
                      name="member_3_id"
                      placeholder="Roll No / Student ID"
                      type="text"
                      value={member3Id}
                      onChange={(e) => setMember3Id(e.target.value)}
                    />
                    <input
                      className="w-full h-10 px-3 rounded bg-surface-container-high text-on-surface font-body-sm text-body-sm outline-none border border-outline-variant/30"
                      name="member_3_email"
                      placeholder="Email Address"
                      type="email"
                      value={member3Email}
                      onChange={(e) => setMember3Email(e.target.value)}
                    />
                  </div>

                  {/* Member 4 */}
                  <div className="p-4 rounded bg-surface-container border border-outline-variant/30 space-y-3">
                    <span className="font-label-caps text-label-caps text-secondary uppercase font-semibold">
                      Member 04 (Optional)
                    </span>
                    <input
                      className="w-full h-10 px-3 rounded bg-surface-container-high text-on-surface font-body-sm text-body-sm outline-none border border-outline-variant/30"
                      name="member_4_name"
                      placeholder="Full Name"
                      type="text"
                      value={member4Name}
                      onChange={(e) => setMember4Name(e.target.value)}
                    />
                    <input
                      className="w-full h-10 px-3 rounded bg-surface-container-high text-on-surface font-body-sm text-body-sm outline-none border border-outline-variant/30"
                      name="member_4_id"
                      placeholder="Roll No / Student ID"
                      type="text"
                      value={member4Id}
                      onChange={(e) => setMember4Id(e.target.value)}
                    />
                    <input
                      className="w-full h-10 px-3 rounded bg-surface-container-high text-on-surface font-body-sm text-body-sm outline-none border border-outline-variant/30"
                      name="member_4_email"
                      placeholder="Email Address"
                      type="email"
                      value={member4Email}
                      onChange={(e) => setMember4Email(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          <div className="h-px bg-surface-container-high w-full"></div>

          {/* Section 4: Payment Confirmation */}
          <section className="space-y-6">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-surface-container-high text-primary flex items-center justify-center font-code-md text-code-md font-semibold">
                  4
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Payment Confirmation
                </h2>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Step 4 of 5</span>
            </div>

            {/* Payment Instructions Box with Dynamic Fee Calculation */}
            <div className="p-5 rounded-lg bg-surface-container border border-outline-variant/30 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-body-md text-body-md font-semibold text-primary">
                    Official Registration Fee Details
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                    Please transfer the prescribed registration fee for your selected track:{' '}
                    <span className="text-primary font-bold">
                      PKR {calculatedFee.toLocaleString()} ({participationModel === 'SOLO' ? 'Solo Entry' : 'Team Entry'})
                    </span>{' '}
                    via Raast, direct bank transfer, or digital wallet before final submission.
                  </p>
                </div>
                <span className="font-label-caps text-label-caps px-2.5 py-1 rounded bg-surface-container-high text-secondary shrink-0 uppercase tracking-wider">
                  NED ACCT
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-outline-variant/20 text-body-sm font-body-sm">
                <div>
                  <span className="block text-on-surface-variant text-code-md font-code-md uppercase">
                    Account Title:
                  </span>
                  <span className="font-medium text-on-surface">SPEC 2026 NEDUET</span>
                </div>
                <div>
                  <span className="block text-on-surface-variant text-code-md font-code-md uppercase">
                    Bank &amp; Branch:
                  </span>
                  <span className="font-medium text-on-surface">National Bank of Pakistan (NED Branch)</span>
                </div>
                <div>
                  <span className="block text-on-surface-variant text-code-md font-code-md uppercase">
                    IBAN / Account No:
                  </span>
                  <span className="font-code-md text-code-md text-secondary tracking-wide">
                    PK18NBPA0123004567890123
                  </span>
                </div>
                <div>
                  <span className="block text-on-surface-variant text-code-md font-code-md uppercase">
                    Raast ID / Mobile:
                  </span>
                  <span className="font-code-md text-code-md text-primary tracking-wide">
                    0300-1234567 / spec@raast
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-body-sm text-body-sm font-medium text-on-surface" htmlFor="payment-channel">
                  Payment Channel / Bank <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <select
                    className="w-full h-12 px-4 rounded bg-surface-container text-on-surface font-body-md text-body-md focus:bg-surface-container-high outline-none transition-colors appearance-none cursor-pointer border border-outline-variant/30"
                    id="payment-channel"
                    name="payment_channel"
                    required
                    value={paymentChannel}
                    onChange={(e) => setPaymentChannel(e.target.value)}
                  >
                    <option value="" disabled>Select payment method...</option>
                    <option value="raast">Raast Instant Transfer</option>
                    <option value="nbp-online">NBP / Online Bank Transfer</option>
                    <option value="easypaisa">Easypaisa</option>
                    <option value="jazzcash">JazzCash</option>
                    <option value="nayapay-sadapay">NayaPay / SadaPay</option>
                    <option value="cash-desk">Cash Voucher at Department Desk</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px]">expand_more</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-body-sm text-body-sm font-medium text-on-surface" htmlFor="transaction-id">
                  Transaction ID / Reference Number <span className="text-error">*</span>
                </label>
                <input
                  className="w-full h-12 px-4 rounded bg-surface-container text-on-surface font-body-md text-body-md focus:bg-surface-container-high outline-none transition-colors border border-outline-variant/30"
                  id="transaction-id"
                  name="transaction_id"
                  placeholder="e.g., TRX-982410842 or Bank Ref No."
                  required
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
              </div>
            </div>

            {/* Payment Receipt Upload Zone with Supabase Storage Simulation & Live Preview */}
            <div className="space-y-2">
              <label className="block font-body-sm text-body-sm font-medium text-on-surface">
                Payment Voucher / Transaction Screenshot <span className="text-error">*</span>
              </label>

              {fileError && (
                <div className="p-3 rounded bg-error/10 border border-error/30 text-error text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{fileError}</span>
                </div>
              )}

              {receiptUrl ? (
                <div className="p-4 rounded-xl bg-surface-container border border-primary-container/40 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={receiptUrl}
                      alt="Uploaded voucher receipt preview"
                      onClick={() => setPreviewModalOpen(true)}
                      className="w-16 h-16 object-cover rounded border border-outline-variant/40 cursor-zoom-in hover:opacity-90 transition-opacity"
                    />
                    <div>
                      <span className="font-semibold text-sm text-white block truncate max-w-xs">
                        {receiptFileName || 'payment_receipt.png'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewModalOpen(true)}
                        className="text-xs text-primary hover:underline font-code-md inline-flex items-center gap-1 mt-0.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                        Preview Receipt Slip
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptUrl('');
                      setReceiptFileName('');
                      setReceiptFile(null);
                    }}
                    className="p-2 text-error hover:bg-error/10 rounded transition-colors cursor-pointer"
                    title="Remove and re-upload"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative border-2 border-dashed border-outline-variant/40 hover:border-primary rounded-xl p-8 bg-surface-container flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
                >
                  <input
                    ref={fileInputRef}
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                    id="payment-voucher"
                    name="payment_voucher"
                    type="file"
                    onChange={handleFileChange}
                  />
                  <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all mb-3">
                    <span className="material-symbols-outlined text-[24px]">receipt_long</span>
                  </div>
                  <p className="font-body-md text-body-md font-medium text-on-surface">
                    <span className="text-primary hover:underline">Click to browse</span> or drag and drop voucher
                  </p>
                  <p className="font-code-md text-code-md text-on-surface-variant mt-1">
                    PNG, JPG, JPEG or WEBP up to 5MB (Clear digital receipt or physical bank stamped slip)
                  </p>
                </div>
              )}
            </div>
          </section>

          <div className="h-px bg-surface-container-high w-full"></div>

          {/* Section 5: Confirmation & Submission */}
          <section className="space-y-6">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-surface-container-high text-primary flex items-center justify-center font-code-md text-code-md font-semibold">
                  5
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Confirmation &amp; Submission
                </h2>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Step 5 of 5</span>
            </div>

            <div className="p-6 rounded-lg bg-surface-container space-y-4 border border-outline-variant/30">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  checked={agreeRules}
                  onChange={(e) => setAgreeRules(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded accent-primary-container cursor-pointer"
                  id="rules-agree"
                  required
                  type="checkbox"
                />
                <span className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                  I confirm that all information provided is accurate and agree to follow the SPEC'26 competition regulations, code of conduct, and hardware handling guidelines stipulated by the Department of Electronic Engineering, NED University.
                </span>
              </label>
            </div>

            {formError && (
              <div className="p-4 rounded-lg bg-error/15 border border-error/40 text-error text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn">
                <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
                <span className="leading-relaxed">{formError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
              <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
                <span className="material-symbols-outlined text-secondary text-[18px]">verified_user</span>
                <span>An official entry voucher with your Registration ID will be issued immediately.</span>
              </div>
              <button
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded bg-primary-container text-on-primary-container font-headline-sm text-headline-sm font-semibold tracking-wide hover:bg-primary-fixed-dim transition-all shadow-md active:scale-95 cursor-pointer"
                type="submit"
                disabled={submitting}
              >
                <span>{submitting ? 'Submitting Application...' : 'Submit Registration'}</span>
                <span className="material-symbols-outlined ml-2 text-[20px]">arrow_forward</span>
              </button>
            </div>
          </section>
        </form>
      </div>

      {/* Full Voucher Receipt Preview Modal */}
      {previewModalOpen && receiptUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container max-w-2xl w-full rounded-2xl p-6 border border-outline-variant/40 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">receipt_long</span>
                <h4 className="text-sm font-semibold text-white truncate max-w-xs">{receiptFileName || 'Attached Voucher'}</h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="text-outline hover:text-white p-1 rounded-full cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="max-h-[65vh] overflow-auto flex items-center justify-center bg-surface-container-lowest rounded-lg p-2">
              <img
                src={receiptUrl}
                alt="Enlarged payment voucher preview"
                className="max-h-[60vh] max-w-full object-contain rounded"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2 rounded bg-surface-container-high hover:bg-surface-container-highest text-xs text-white font-medium cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Informational Support & Requirement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 rounded-xl bg-surface-container-lowest space-y-4 border border-outline-variant/30">
          <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-[22px]">contact_support</span>
          </div>
          <div className="space-y-1">
            <h3 className="font-headline-sm text-headline-sm font-semibold text-primary">Need Help Registering?</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Having trouble with institutional IDs or have questions regarding multi-university team compositions? Our desk coordinators are standing by to assist.
            </p>
          </div>
          <div className="pt-2 font-code-md text-code-md text-secondary">
            <a className="hover:text-primary hover:underline transition-colors flex items-center gap-2" href="mailto:spec@neduet.edu.pk">
              <span className="material-symbols-outlined text-[16px]">mail</span>
              spec@neduet.edu.pk
            </a>
          </div>
        </div>

        <div className="p-8 rounded-xl bg-surface-container-lowest space-y-4 border border-outline-variant/30">
          <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-[22px]">badge</span>
          </div>
          <div className="space-y-1">
            <h3 className="font-headline-sm text-headline-sm font-semibold text-primary">Registration Requirements</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              All registered participants must bring a valid University Student Identity Card on the day of the exhibition. One nominated team lead coordinates equipment sign-out at bench terminals.
            </p>
          </div>
          <div className="pt-2 flex items-center gap-2 text-on-surface-variant font-code-md text-code-md">
            <span className="material-symbols-outlined text-[16px] text-primary">check</span>
            <span>Open to all recognized HEC engineering institutions</span>
          </div>
        </div>
      </div>
    </div>
  );
};
