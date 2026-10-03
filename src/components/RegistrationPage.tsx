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

  // Form Fields (Empty by default with placeholder texts only)
  const [teamName, setTeamName] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [universityName, setUniversityName] = useState(''); // Institution Name
  const [department, setDepartment] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [alternatePhoneNumber, setAlternatePhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');

  // Teammates state (for team-based competitions)
  const [numTeammates, setNumTeammates] = useState<number | ''>('');
  const [teammateNames, setTeammateNames] = useState<string[]>([]);

  // Payment Confirmation
  const [paymentChannel, setPaymentChannel] = useState('');
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

  // Dynamic Teammate constraints based on selected track
  const maxAllowedTeammates = useMemo(() => {
    return Math.max(1, (selectedCompetition?.maxMembers || 4) - 1);
  }, [selectedCompetition]);

  const minAllowedTeammates = useMemo(() => {
    return Math.max(1, Math.min(maxAllowedTeammates, (selectedCompetition?.minMembers || 2) - 1));
  }, [selectedCompetition, maxAllowedTeammates]);

  const teammateCountOptions = useMemo(() => {
    const opts: number[] = [];
    for (let i = minAllowedTeammates; i <= maxAllowedTeammates; i++) {
      opts.push(i);
    }
    return opts;
  }, [minAllowedTeammates, maxAllowedTeammates]);

  const handleTeammateCountChange = (count: number) => {
    setNumTeammates(count);
    setTeammateNames(prev => {
      const arr = [...prev];
      if (arr.length < count) {
        while (arr.length < count) arr.push('');
      } else {
        arr.length = count;
      }
      return arr;
    });
  };

  // Adjust teammate count if active competition changes and count exceeds track max
  useEffect(() => {
    if (typeof numTeammates === 'number' && numTeammates > maxAllowedTeammates) {
      handleTeammateCountChange(maxAllowedTeammates);
    }
  }, [maxAllowedTeammates, numTeammates]);

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

  // Handle Receipt Upload (validates size < 2MB and converts file to data URL)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setFileError('The selected file exceeds 2MB. Please upload an image or PDF under 2MB.');
      return;
    }

    // Security: Validate file type and extension to prevent malicious uploads
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExtensions = ['png', 'jpg', 'jpeg', 'webp', 'pdf'];

    if (!allowedMimeTypes.includes(file.type.toLowerCase()) || !allowedExtensions.includes(extension)) {
      setFileError('Invalid file format. Only PNG, JPG, JPEG, WEBP images or PDF files are allowed.');
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
TEAM NAME          : ${participationModel === 'TEAM' ? (teamName || `${fullName}'s Squad`) : 'Individual Entry'}
PRIMARY CANDIDATE  : ${fullName}
ROLL NO / ID / CNIC: ${studentId}
INSTITUTION NAME   : ${universityName}
DEPARTMENT / GROUP : ${department}
ACADEMIC YEAR      : ${academicYear}
PRIMARY PHONE      : ${phoneNumber}
ALTERNATE PHONE    : ${alternatePhoneNumber || 'N/A'}
PRIMARY EMAIL      : ${emailAddress}
${participationModel === 'TEAM' && teammateNames.length > 0 ? `TEAMMATES          : ${teammateNames.filter(Boolean).join(', ')}\n` : ''}PAYMENT METHOD     : ${paymentChannel.toUpperCase()}
ASSESSED FEE       : PKR ${calculatedFee.toLocaleString()}
STATUS             : PENDING DESK VERIFICATION

IMPORTANT INSTRUCTIONS:
1. Please retain this token for on-site accreditation.
2. Present your original student ID card / CNIC upon entry.
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

    if (
      !fullName.trim() ||
      !studentId.trim() ||
      !universityName.trim() ||
      !department.trim() ||
      !academicYear.trim() ||
      !emailAddress.trim() ||
      !phoneNumber.trim()
    ) {
      setFormError('Please complete all mandatory participant fields (Full Name, Roll no. / Student ID no. / CNIC, Institution Name, Department, Academic Year, Primary Phone, Email).');
      return;
    }

    if (participationModel === 'TEAM') {
      if (!teamName.trim()) {
        setFormError('Please enter a team name for your squad.');
        return;
      }
      if (!numTeammates || numTeammates < 1) {
        setFormError('Please select the number of teammates on your team.');
        return;
      }
      for (let i = 0; i < numTeammates; i++) {
        if (!teammateNames[i] || !teammateNames[i].trim()) {
          setFormError(`Please enter the full name for Teammate ${i + 1}.`);
          return;
        }
      }
    }

    if (!paymentChannel) {
      setFormError('Please select a payment channel.');
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
    if (participationModel === 'TEAM' && typeof numTeammates === 'number') {
      for (let i = 0; i < numTeammates; i++) {
        teamMembersInput.push({
          memberNumber: i + 2,
          fullName: teammateNames[i].trim(),
          studentId: 'N/A',
        });
      }
    }

    const res = await createRegistration(
      {
        userId: currentUser?.id || `guest-${Date.now()}`,
        competitionId: selectedCompetition.id,
        competitionTitle: selectedCompetition.title,
        competitionCategory: selectedCompetition.category,
        participationModel: participationModel === 'TEAM' ? 'team' : 'individual',
        teamName: participationModel === 'TEAM' ? teamName || `${fullName}'s Squad` : undefined,
        leaderName: fullName.trim(),
        leaderStudentId: studentId.trim(),
        university: universityName.trim(),
        department: department.trim(),
        academicYear: academicYear.trim(),
        phone: phoneNumber.trim(),
        alternatePhone: alternatePhoneNumber.trim() || undefined,
        email: emailAddress.trim(),
        paymentChannel,
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
              The departmental registration portal for the Students' Project Exhibition &amp; Competition (SPEC'26) has not commenced yet. Students from all institutions across Karachi (schools, colleges, and universities) will be able to register squads and select competition tracks starting on the date below.
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
  // SUCCESS VIEW: Rendered when registration is submitted
  // -------------------------------------------------------------
  if (submittedRegId) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center space-y-8 animate-fadeIn">
        <div className="w-20 h-20 rounded-full bg-primary-container/20 text-primary-container mx-auto flex items-center justify-center border border-primary-container/40 shadow-[0_0_30px_rgba(240,117,9,0.2)]">
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
              setReceiptFile(null);
              setFullName('');
              setStudentId('');
              setUniversityName('');
              setDepartment('');
              setAcademicYear('');
              setPhoneNumber('');
              setAlternatePhoneNumber('');
              setEmailAddress('');
              setTeamName('');
              setNumTeammates('');
              setTeammateNames([]);
              setPaymentChannel('');
              setAgreeRules(false);
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
  // REGISTRATION FORM
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
          Submit your team or individual details for the Students’ Project Exhibition and Competition. Registrations are open to participants from all institutions across Karachi (schools, colleges, and universities).
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
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block font-body-sm text-body-sm font-medium text-on-surface" htmlFor="full-name">
                  Full Name <span className="text-error">*</span>
                </label>
                <input
                  className="w-full h-12 px-4 rounded bg-surface-container text-on-surface font-body-md text-body-md focus:bg-surface-container-high outline-none transition-colors border border-outline-variant/30"
                  id="full-name"
                  name="full_name"
                  placeholder="e.g. Muhammad Ali"
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {/* Roll no. / Student ID no. / CNIC */}
              <div className="space-y-2">
                <label className="block font-body-sm text-body-sm font-medium text-on-surface" htmlFor="student-id">
                  Roll no. / Student ID no. / CNIC <span className="text-error">*</span>
                </label>
                <input
                  className="w-full h-12 px-4 rounded bg-surface-container text-on-surface font-body-md text-body-md focus:bg-surface-container-high outline-none transition-colors border border-outline-variant/30"
                  id="student-id"
                  name="student_id"
                  placeholder="e.g. 42101-1234567-1 or Roll No / Student ID"
                  required
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />
              </div>

              {/* Institution Name */}
              <div className="space-y-2">
                <label className="block font-body-sm text-body-sm font-medium text-on-surface" htmlFor="university-name">
                  Institution Name <span className="text-error">*</span>
                </label>
                <input
                  className="w-full h-12 px-4 rounded bg-surface-container text-on-surface font-body-md text-body-md focus:bg-surface-container-high outline-none transition-colors border border-outline-variant/30"
                  id="university-name"
                  name="university_name"
                  placeholder="e.g. NED University, DJ Sindh Govt Science College, Karachi Grammar School"
                  required
                  type="text"
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                />
              </div>

              {/* Department / Discipline / Grade */}
              <div className="space-y-2">
                <label className="block font-body-sm text-body-sm font-medium text-on-surface" htmlFor="department">
                  Department / Discipline / Grade <span className="text-error">*</span>
                </label>
                <input
                  className="w-full h-12 px-4 rounded bg-surface-container text-on-surface font-body-md text-body-md focus:bg-surface-container-high outline-none transition-colors border border-outline-variant/30"
                  id="department"
                  name="department"
                  placeholder="e.g. Electronic Engineering, Pre-Engineering, Class 10"
                  required
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>

              {/* Academic Year / Class */}
              <div className="space-y-2">
                <label className="block font-body-sm text-body-sm font-medium text-on-surface" htmlFor="academic-year">
                  Academic Year / Class <span className="text-error">*</span>
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
                    <option value="" disabled>Select academic level / year...</option>
                    <option value="Matric / O-Level">Matric / O-Level</option>
                    <option value="Intermediate / A-Level">Intermediate / A-Level</option>
                    <option value="First Year (Semesters 1-2)">First Year (Semesters 1-2)</option>
                    <option value="Second Year (Semesters 3-4)">Second Year (Semesters 3-4)</option>
                    <option value="Third Year (Semesters 5-6)">Third Year (Semesters 5-6)</option>
                    <option value="Final Year (Semesters 7-8)">Final Year (Semesters 7-8)</option>
                    <option value="Postgraduate / Graduate">Postgraduate / Graduate</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px]">expand_more</span>
                  </div>
                </div>
              </div>

              {/* Primary Phone / WhatsApp */}
              <div className="space-y-2">
                <label className="block font-body-sm text-body-sm font-medium text-on-surface" htmlFor="phone-number">
                  Primary Phone / WhatsApp Number <span className="text-error">*</span>
                </label>
                <input
                  className="w-full h-12 px-4 rounded bg-surface-container text-on-surface font-body-md text-body-md focus:bg-surface-container-high outline-none transition-colors border border-outline-variant/30"
                  id="phone-number"
                  name="phone_number"
                  placeholder="e.g. +92 300 1234567"
                  required
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              {/* Alternate Phone Number */}
              <div className="space-y-2">
                <label className="block font-body-sm text-body-sm font-medium text-on-surface" htmlFor="alternate-phone-number">
                  Alternate Phone Number
                </label>
                <input
                  className="w-full h-12 px-4 rounded bg-surface-container text-on-surface font-body-md text-body-md focus:bg-surface-container-high outline-none transition-colors border border-outline-variant/30"
                  id="alternate-phone-number"
                  name="alternate_phone_number"
                  placeholder="e.g. +92 321 9876543"
                  type="tel"
                  value={alternatePhoneNumber}
                  onChange={(e) => setAlternatePhoneNumber(e.target.value)}
                />
              </div>

              {/* Primary Email Address */}
              <div className="space-y-2">
                <label className="block font-body-sm text-body-sm font-medium text-on-surface" htmlFor="email-address">
                  Primary Email Address <span className="text-error">*</span>
                </label>
                <input
                  className="w-full h-12 px-4 rounded bg-surface-container text-on-surface font-body-md text-body-md focus:bg-surface-container-high outline-none transition-colors border border-outline-variant/30"
                  id="email-address"
                  name="email_address"
                  placeholder="e.g. participant@example.com"
                  required
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                />
              </div>
            </div>

            {/* Dynamic Teammates Selection (Conditional for Team Format) */}
            {participationModel === 'TEAM' && (
              <div className="pt-6 space-y-6 animate-fadeIn border-t border-outline-variant/20 mt-6">
                <div className="flex items-center gap-2 text-primary font-headline-sm text-headline-sm">
                  <span className="material-symbols-outlined text-[20px]">group</span>
                  <h3>Additional Team Members</h3>
                </div>

                {/* Dropdown for Number of Teammates */}
                <div className="space-y-2 max-w-md">
                  <label className="block font-body-sm text-body-sm font-medium text-on-surface" htmlFor="num-teammates">
                    Number of Teammates (Excluding Team Lead) <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <select
                      className="w-full h-12 px-4 rounded bg-surface-container text-on-surface font-body-md text-body-md focus:bg-surface-container-high outline-none transition-colors appearance-none cursor-pointer border border-outline-variant/30"
                      id="num-teammates"
                      name="num_teammates"
                      required
                      value={numTeammates}
                      onChange={(e) => handleTeammateCountChange(parseInt(e.target.value, 10))}
                    >
                      <option value="" disabled>Select number of teammates...</option>
                      {teammateCountOptions.map(cnt => (
                        <option key={cnt} value={cnt}>
                          {cnt} {cnt === 1 ? 'Teammate' : 'Teammates'} (Total Squad: {cnt + 1})
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[20px]">expand_more</span>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant font-code-md">
                    Allowed team size for {selectedCompetition?.title || 'this track'}: {selectedCompetition?.minMembers || 2} to {selectedCompetition?.maxMembers || 4} members (Lead + up to {maxAllowedTeammates} teammates).
                  </p>
                </div>

                {/* Dynamically Generated Teammate Name Fields */}
                {typeof numTeammates === 'number' && numTeammates > 0 && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from({ length: numTeammates }).map((_, idx) => (
                        <div key={idx} className="p-4 rounded bg-surface-container border border-outline-variant/30 space-y-2">
                          <label className="block font-label-caps text-label-caps text-secondary uppercase font-semibold">
                            Teammate {idx + 1} Full Name <span className="text-error">*</span>
                          </label>
                          <input
                            className="w-full h-11 px-3 rounded bg-surface-container-high text-on-surface font-body-md text-body-md outline-none border border-outline-variant/30 focus:border-primary-container transition-colors"
                            placeholder={`e.g. Teammate ${idx + 1} Name`}
                            required
                            type="text"
                            value={teammateNames[idx] || ''}
                            onChange={(e) => {
                              const updated = [...teammateNames];
                              updated[idx] = e.target.value;
                              setTeammateNames(updated);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                    via direct bank transfer or digital wallet before final submission.
                  </p>
                </div>
                <span className="font-label-caps text-label-caps px-2.5 py-1 rounded bg-surface-container-high text-secondary shrink-0 uppercase tracking-wider">
                  SPEC 2026
                </span>
              </div>

              {/* Bank & Digital Wallet Account Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-outline-variant/20 text-body-sm font-body-sm">
                {/* Bank Account */}
                <div className="p-4 rounded bg-surface-container-high/60 border border-outline-variant/30 space-y-2">
                  <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                    <span className="font-label-caps text-xs text-primary uppercase font-bold tracking-wider">
                      Bank Account Details
                    </span>
                    <span className="text-[11px] font-code-md text-secondary">NBP</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-on-surface-variant block">Bank Name:</span>
                      <span className="font-semibold text-white">National Bank of Pakistan</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block">Title:</span>
                      <span className="font-semibold text-white">Chairman Department of Electronic Engineering</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-on-surface-variant block">Account No:</span>
                        <span className="font-code-md text-secondary font-bold text-sm">1063004102712278</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText('1063004102712278')}
                        className="px-2 py-0.5 rounded bg-surface-container text-primary hover:text-white border border-outline-variant/30 text-[11px] font-code-md transition-colors cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-on-surface-variant block">IBAN No:</span>
                        <span className="font-code-md text-secondary font-bold text-xs">PK86NBPA1063004102712278</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText('PK86NBPA1063004102712278')}
                        className="px-2 py-0.5 rounded bg-surface-container text-primary hover:text-white border border-outline-variant/30 text-[11px] font-code-md transition-colors cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                {/* Digital Wallets */}
                <div className="p-4 rounded bg-surface-container-high/60 border border-outline-variant/30 space-y-2">
                  <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                    <span className="font-label-caps text-xs text-primary uppercase font-bold tracking-wider">
                      Easypaisa / Jazzcash / Nayapay
                    </span>
                    <span className="text-[11px] font-code-md text-secondary">Digital Wallets</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-on-surface-variant block">Account Title:</span>
                      <span className="font-semibold text-white">Abdullah Wasi</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-on-surface-variant block">Account Number:</span>
                        <span className="font-code-md text-primary font-bold text-sm">03448240449</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText('03448240449')}
                        className="px-2 py-0.5 rounded bg-surface-container text-primary hover:text-white border border-outline-variant/30 text-[11px] font-code-md transition-colors cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-[11px] text-on-surface-variant pt-2 leading-relaxed">
                      Send the required entry fee to <strong>03448240449</strong> via Easypaisa, Jazzcash, or Nayapay, and upload the payment confirmation screenshot below.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Input Fields (Payment Channel only, Transaction ID removed) */}
            <div className="space-y-2 max-w-md">
              <label className="block font-body-sm text-body-sm font-medium text-on-surface" htmlFor="payment-channel">
                Payment Channel <span className="text-error">*</span>
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
                  <option value="Bank transfer">Bank transfer</option>
                  <option value="Easypaisa">Easypaisa</option>
                  <option value="Jazzcash">Jazzcash</option>
                  <option value="Nayapay">Nayapay</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">expand_more</span>
                </div>
              </div>
            </div>

            {/* Payment Receipt Upload Zone with 2MB Limit & Live Preview */}
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
                    accept="image/png, image/jpeg, image/jpg, image/webp, application/pdf"
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
                    PNG, JPG, JPEG, WEBP or PDF up to 2MB (Clear digital receipt or physical bank deposit slip)
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
