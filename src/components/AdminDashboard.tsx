import React, { useState, useMemo, useEffect } from 'react';
import { useAuth, useCompetitions, useRegistrations, useEventSettings, useUsers, useCategories, formatDisplayDate } from '../lib/store';
import { Competition, Registration, Category, Format, RegStatus, RegistrationPhase, User, Role, CategoryItem, ContactMessage } from '../types';
import { updateRegistrationStatus as updateStatusInDb, getContactMessages } from '../services/databaseService';
import { isSupabaseConfigured } from '../lib/supabaseClient';

const POPULAR_CATEGORY_ICONS = [
  { icon: 'memory', label: 'Electronics' },
  { icon: 'smart_toy', label: 'Robotics' },
  { icon: 'terminal', label: 'Coding' },
  { icon: 'devices', label: 'Projects' },
  { icon: 'sports_esports', label: 'Esports' },
  { icon: 'neurology', label: 'AI & Data' },
  { icon: 'precision_manufacturing', label: 'Mechanical' },
  { icon: 'bolt', label: 'Power/Energy' },
  { icon: 'shield', label: 'Security' },
  { icon: 'satellite_alt', label: 'Aerospace' },
  { icon: 'biotech', label: 'Biotech' },
  { icon: 'science', label: 'Sciences' },
];

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { currentUser, logout, login } = useAuth();
  const { competitions, addCompetition, updateCompetition, deleteCompetition, resetToDefault } = useCompetitions();
  const { registrations, updateRegistrationStatus, deleteRegistration } = useRegistrations();
  const { eventSettings, updateEventSettings } = useEventSettings();
  const { users, updateUserRole, addAdminUser, updateUserPassword, updateUserDetails, transferRootAdmin, deleteUser } = useUsers();
  const { categories, addCategory, updateCategory, deleteCategory, resetCategoriesToDefault } = useCategories();

  // Active Admin Sub-Tab
  const [adminTab, setAdminTab] = useState<'registrations' | 'competitions' | 'categories' | 'timeline' | 'admins' | 'messages'>('registrations');

  // Database Connection Modal State
  const [isDbConfigModalOpen, setIsDbConfigModalOpen] = useState(false);

  // Contact Messages State
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [contactMessageSearch, setContactMessageSearch] = useState('');

  useEffect(() => {
    getContactMessages().then(res => {
      if (res.data) setContactMessages(res.data);
    });
  }, [adminTab]);

  // Category Management State
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    icon: 'category'
  });
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categoryToast, setCategoryToast] = useState<string | null>(null);
  const [categoryDeleteTarget, setCategoryDeleteTarget] = useState<{ category: CategoryItem; affectedCount: number } | null>(null);
  const [categoryReassignSlug, setCategoryReassignSlug] = useState<string>('');

  // Admin Access & User Management State
  const [adminUserSearch, setAdminUserSearch] = useState('');
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Department of Electronic Engineering',
    phoneNumber: ''
  });
  const [editingAdminUser, setEditingAdminUser] = useState<User | null>(null);
  const [adminEditForm, setAdminEditForm] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Department of Electronic Engineering',
    phoneNumber: '',
    studentId: '',
  });
  const [adminEditError, setAdminEditError] = useState<string | null>(null);
  const [transferTargetAdmin, setTransferTargetAdmin] = useState<User | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [roleActionToast, setRoleActionToast] = useState<string | null>(null);

  const currentRootAdmin = useMemo(() => {
    return users.find(u => u.isRootAdmin && u.role === 'ADMIN') || users.find(u => u.role === 'ADMIN');
  }, [users]);

  const isCurrentUserRootAdmin = Boolean(currentUser && currentRootAdmin && currentUser.id === currentRootAdmin.id);

  const adminUsers = useMemo(() => {
    return users.filter(u => u.role === 'ADMIN');
  }, [users]);

  const allFilteredUsers = useMemo(() => {
    const q = adminUserSearch.toLowerCase().trim();
    return users.filter(u => {
      const matchSearch = !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.studentId && u.studentId.toLowerCase().includes(q)) ||
        (u.department && u.department.toLowerCase().includes(q));
      return matchSearch;
    });
  }, [users, adminUserSearch]);

  const filteredCategories = useMemo(() => {
    const q = categorySearch.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, categorySearch]);

  // Timeline & Dates Form State
  const [timelineForm, setTimelineForm] = useState({
    registrationPhase: eventSettings.registrationPhase,
    eventDate: eventSettings.eventDate,
    registrationStartDate: eventSettings.registrationStartDate,
    registrationEndDate: eventSettings.registrationEndDate,
    competitionDates: eventSettings.competitionDates
  });
  const [isTimelineDirty, setIsTimelineDirty] = useState(false);
  const [timelineToast, setTimelineToast] = useState(false);
  const [timelineSaving, setTimelineSaving] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  useEffect(() => {
    // CRITICAL: Never overwrite form inputs if the administrator has unsaved edits
    if (!isTimelineDirty) {
      setTimelineForm({
        registrationPhase: eventSettings.registrationPhase,
        eventDate: eventSettings.eventDate,
        registrationStartDate: eventSettings.registrationStartDate,
        registrationEndDate: eventSettings.registrationEndDate,
        competitionDates: eventSettings.competitionDates
      });
    }
  }, [eventSettings, isTimelineDirty]);

  // Admin Login Form States (used when not logged in as admin)
  const [adminLoginEmail, setAdminLoginEmail] = useState('');
  const [adminLoginPassword, setAdminLoginPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState('');
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);

  // Competitions Search & Filter
  const [compSearch, setCompSearch] = useState('');
  const [compCategoryFilter, setCompCategoryFilter] = useState<string>('all');

  // Competition Add/Edit Modal
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<Competition | null>(null);

  // Form State for Competition
  const [compForm, setCompForm] = useState({
    slug: '',
    title: '',
    category: 'ELECTRONICS' as Category,
    description: '',
    format: 'BOTH' as Format,
    minMembers: 1,
    maxMembers: 2,
    soloFee: 1000,
    teamFee: 1800,
    keyDeliverables: '',
    specsSummary: '',
    isActive: true,
  });

  // Registrations Filter & Search
  const [regSearch, setRegSearch] = useState('');
  const [regStatusFilter, setRegStatusFilter] = useState<string>('all');
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);

  // Registration modal notes
  const [regNote, setRegNote] = useState('');

  // Metrics
  const metrics = useMemo(() => {
    const totalRegs = registrations.length;
    const verifiedRegs = registrations.filter(r => r.status === 'VERIFIED');
    const pendingRegs = registrations.filter(r => r.status === 'PENDING');
    const totalRevenue = verifiedRegs.reduce((sum, r) => sum + (r.calculatedFee || 0), 0);
    const activeTracks = competitions.filter(c => c.isActive).length;

    return { totalRegs, verifiedCount: verifiedRegs.length, pendingCount: pendingRegs.length, totalRevenue, activeTracks };
  }, [registrations, competitions]);

  // Filtered Competitions
  const filteredComps = useMemo(() => {
    return competitions.filter(c => {
      const matchSearch = c.title.toLowerCase().includes(compSearch.toLowerCase()) ||
                          c.description.toLowerCase().includes(compSearch.toLowerCase());
      const matchCategory = compCategoryFilter === 'all' || c.category === compCategoryFilter;
      return matchSearch && matchCategory;
    });
  }, [competitions, compSearch, compCategoryFilter]);

  // Filtered Registrations
  const filteredRegs = useMemo(() => {
    return registrations.filter(r => {
      const matchSearch = r.registrationId.toLowerCase().includes(regSearch.toLowerCase()) ||
                          r.fullName.toLowerCase().includes(regSearch.toLowerCase()) ||
                          r.universityName.toLowerCase().includes(regSearch.toLowerCase()) ||
                          (r.teamName && r.teamName.toLowerCase().includes(regSearch.toLowerCase())) ||
                          (r.competitionTitle && r.competitionTitle.toLowerCase().includes(regSearch.toLowerCase())) ||
                          r.studentId.toLowerCase().includes(regSearch.toLowerCase());
      const matchStatus = regStatusFilter === 'all' || r.status === regStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [registrations, regSearch, regStatusFilter]);

  // Check if current user is ADMIN
  if (!currentUser || currentUser.role !== 'ADMIN') {
    const handleAdminSignIn = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!adminLoginEmail || !adminLoginPassword) {
        setAdminLoginError('Please enter both administrator email and password.');
        return;
      }
      setAdminLoginLoading(true);
      setAdminLoginError('');

      try {
        const res = await login(adminLoginEmail, adminLoginPassword);
        setAdminLoginLoading(false);
        if (!res.success) {
          setAdminLoginError(res.error || 'Authentication failed. Please verify credentials.');
        } else if (res.user?.role !== 'ADMIN') {
          setAdminLoginError('Access denied. This account does not possess administrator clearance.');
        }
      } catch (err: any) {
        setAdminLoginLoading(false);
        setAdminLoginError(err?.message || 'Authentication error occurred.');
      }
    };

    return (
      <div className="w-full max-w-md mx-auto px-4 py-16 sm:py-24">
        <div className="bg-surface-container border border-outline-variant/30 rounded-xl p-8 sm:p-10 shadow-2xl space-y-6 relative">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-primary-container/20 text-primary-container mx-auto flex items-center justify-center border border-primary-container/40 shadow-[0_0_20px_rgba(240,117,9,0.25)]">
              <span className="material-symbols-outlined text-[30px]">admin_panel_settings</span>
            </div>
            <span className="font-label-caps text-[10px] px-2.5 py-0.5 rounded bg-surface-container-high text-primary tracking-widest uppercase border border-outline-variant/30 inline-block mt-2">
              RESTRICTED CONSOLE
            </span>
            <h1 className="font-headline-lg text-headline-lg font-bold text-white tracking-tight">
              SPEC'26 Admin Portal
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs mx-auto">
              Department of Electronic Engineering, NED University
            </p>
          </div>

          <form onSubmit={handleAdminSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-code-md text-on-surface uppercase tracking-wider">
                Admin Email Address
              </label>
              <input
                type="email"
                required
                autoComplete="username"
                placeholder="admin@neduet.edu.pk"
                value={adminLoginEmail}
                onChange={(e) => setAdminLoginEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-container-lowest text-on-surface border border-outline-variant/30 placeholder:text-outline-variant rounded font-body-sm text-sm focus:outline-none focus:ring-1 focus:ring-primary-container"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-code-md text-on-surface uppercase tracking-wider">
                Security Password / Passcode
              </label>
              <div className="relative">
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={adminLoginPassword}
                  onChange={(e) => setAdminLoginPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container-lowest text-on-surface border border-outline-variant/30 placeholder:text-outline-variant rounded font-body-sm text-sm focus:outline-none focus:ring-1 focus:ring-primary-container pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3 top-2.5 text-outline hover:text-white transition-colors cursor-pointer"
                  title={showAdminPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showAdminPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {adminLoginError && (
              <div className="p-3 rounded bg-error/15 border border-error/30 text-error text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                <span>{adminLoginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={adminLoginLoading}
              className="w-full py-3 px-4 bg-primary-container text-on-primary-container font-headline-sm text-xs uppercase tracking-wider font-bold rounded flex items-center justify-center gap-2 hover:bg-primary-fixed-dim transition-all shadow-[0_0_20px_rgba(240,117,9,0.3)] cursor-pointer mt-2"
            >
              <span>{adminLoginLoading ? 'Verifying Authorization...' : 'Sign In as Administrator'}</span>
              <span className="material-symbols-outlined text-[18px]">login</span>
            </button>
          </form>

          {/* Admin portal navigation actions */}
          <div className="pt-2 border-t border-outline-variant/20 flex flex-col items-center gap-3 text-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                className="text-secondary hover:text-primary transition-colors cursor-pointer font-code-md flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">lock_reset</span>
                <span>Reset Admin Password</span>
              </button>
              <span className="text-outline/40">•</span>
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="text-on-surface-variant hover:text-white transition-colors cursor-pointer font-code-md flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                <span>Public Website</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle Competition Form open (Add or Edit)
  const handleOpenAddComp = () => {
    setEditingComp(null);
    setCompForm({
      slug: 'track-' + Date.now().toString().slice(-4),
      title: '',
      category: 'ELECTRONICS',
      description: '',
      format: 'BOTH',
      minMembers: 1,
      maxMembers: 2,
      soloFee: 1000,
      teamFee: 1800,
      keyDeliverables: '',
      specsSummary: '',
      isActive: true,
    });
    setIsCompModalOpen(true);
  };

  const handleOpenEditComp = (comp: Competition) => {
    setEditingComp(comp);
    setCompForm({
      slug: comp.slug,
      title: comp.title,
      category: comp.category,
      description: comp.description,
      format: comp.format,
      minMembers: comp.minMembers,
      maxMembers: comp.maxMembers,
      soloFee: comp.soloFee,
      teamFee: comp.teamFee,
      keyDeliverables: comp.keyDeliverables || '',
      specsSummary: comp.specsSummary || '',
      isActive: comp.isActive,
    });
    setIsCompModalOpen(true);
  };

  const handleSaveComp = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingComp) {
      updateCompetition(editingComp.id, compForm);
    } else {
      addCompetition(compForm);
    }
    setIsCompModalOpen(false);
  };

  const handleCategoryNameChange = (val: string) => {
    if (!editingCategory) {
      const autoSlug = val.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_');
      setCategoryForm(prev => ({ ...prev, name: val, slug: autoSlug }));
    } else {
      setCategoryForm(prev => ({ ...prev, name: val }));
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError(null);
    if (!categoryForm.name.trim()) {
      setCategoryError('Category name is required.');
      return;
    }
    if (editingCategory) {
      const res = await updateCategory(editingCategory.id, categoryForm);
      if (!res.success) {
        setCategoryError(res.error || 'Failed to update category.');
        return;
      }
      setCategoryToast(`Category "${categoryForm.name}" updated successfully.`);
    } else {
      const res = await addCategory(categoryForm);
      if (!res.success) {
        setCategoryError(res.error || 'Failed to create category.');
        return;
      }
      setCategoryToast(`Category "${categoryForm.name}" created successfully.`);
    }
    setIsCategoryModalOpen(false);
    setTimeout(() => setCategoryToast(null), 4000);
  };

  const handleConfirmDeleteWithReassign = async () => {
    if (!categoryDeleteTarget) return;
    if (!categoryReassignSlug) {
      alert('Please select a destination category to reassign the tracks to.');
      return;
    }
    const res = await deleteCategory(categoryDeleteTarget.category.id, categoryReassignSlug);
    if (res.success) {
      setCategoryToast(`Category "${categoryDeleteTarget.category.name}" removed and ${res.affectedCount || 0} track(s) reassigned to "${categoryReassignSlug}".`);
      setTimeout(() => setCategoryToast(null), 4000);
      setCategoryDeleteTarget(null);
    } else {
      alert(res.error || 'Failed to delete category.');
    }
  };

  const handleOpenRegDetails = (reg: Registration) => {
    setSelectedReg(reg);
    setRegNote(reg.notes || '');
  };

  const handleUpdateRegStatus = (newStatus: RegStatus) => {
    if (!selectedReg) return;
    updateRegistrationStatus(selectedReg.id, newStatus, regNote);
    updateStatusInDb(selectedReg.id, newStatus, regNote).catch(() => {});
    setSelectedReg(prev => prev ? { ...prev, status: newStatus, notes: regNote } : null);
  };

  const handleExportCSV = () => {
    const headers = [
      'Registration ID',
      'Status',
      'Track Title',
      'Category',
      'Participation Model',
      'Team Name',
      'Lead Name',
      'Roll No / Student ID / CNIC',
      'Institution Name',
      'Department / Discipline / Grade',
      'Academic Year / Class',
      'Primary Phone',
      'Alternate Phone',
      'Email',
      'Assessed Fee (PKR)',
      'Payment Channel',
      'Reference / Transaction ID',
      'Teammates',
      'Created At',
      'Admin Notes'
    ];

    const rows = filteredRegs.map(r => [
      `"${r.registrationId}"`,
      `"${r.status}"`,
      `"${(r.competitionTitle || '').replace(/"/g, '""')}"`,
      `"${r.competitionCategory || ''}"`,
      `"${r.participationModel}"`,
      `"${(r.teamName || '').replace(/"/g, '""')}"`,
      `"${(r.fullName || '').replace(/"/g, '""')}"`,
      `"${(r.studentId || '').replace(/"/g, '""')}"`,
      `"${(r.universityName || '').replace(/"/g, '""')}"`,
      `"${(r.department || '').replace(/"/g, '""')}"`,
      `"${r.academicYear || ''}"`,
      `"${r.phoneNumber || ''}"`,
      `"${r.alternatePhoneNumber || ''}"`,
      `"${r.emailAddress || ''}"`,
      r.calculatedFee || 0,
      `"${r.paymentChannel || ''}"`,
      `"${(r.transactionId || '').replace(/"/g, '""')}"`,
      `"${(r.teamMembers || []).map(m => m.name + (m.studentId && m.studentId !== 'N/A' ? ` (${m.studentId})` : '')).join('; ').replace(/"/g, '""')}"`,
      `"${r.createdAt}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `spec26_registrations_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 w-full space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-primary-container"></span>
            <span className="font-label-caps text-xs text-primary uppercase tracking-wider">
              Administration &amp; CMS Console
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-white tracking-tight mt-1">
            SPEC'26 Executive Operations
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Department of Electronic Engineering, NED University
          </p>
        </div>

        {/* Actions & Tab Navigation */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 p-1 bg-surface-container rounded-lg border border-outline-variant/30">
            <button
              onClick={() => setAdminTab('registrations')}
              className={`px-3.5 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                adminTab === 'registrations'
                  ? 'bg-primary-container text-on-primary-container'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              <span>Registrations ({registrations.length})</span>
            </button>
            <button
              onClick={() => setAdminTab('competitions')}
              className={`px-3.5 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                adminTab === 'competitions'
                  ? 'bg-primary-container text-on-primary-container'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">dashboard_customize</span>
              <span>Competitions ({competitions.length})</span>
            </button>
            <button
              onClick={() => setAdminTab('categories')}
              className={`px-3.5 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                adminTab === 'categories'
                  ? 'bg-primary-container text-on-primary-container'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">category</span>
              <span>Categories ({categories.length})</span>
            </button>
            <button
              onClick={() => setAdminTab('timeline')}
              className={`px-3.5 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                adminTab === 'timeline'
                  ? 'bg-primary-container text-on-primary-container'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
              <span>Timeline &amp; Dates</span>
              <span className={`w-1.5 h-1.5 rounded-full ${
                eventSettings.registrationPhase === 'OPEN' ? 'bg-primary-container' :
                eventSettings.registrationPhase === 'NOT_STARTED' ? 'bg-yellow-400' : 'bg-red-400'
              }`}></span>
            </button>
            <button
              onClick={() => setAdminTab('admins')}
              className={`px-3.5 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                adminTab === 'admins'
                  ? 'bg-primary-container text-on-primary-container'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">shield_person</span>
              <span>Admin Access ({adminUsers.length})</span>
            </button>
            <button
              onClick={() => setAdminTab('messages')}
              className={`px-3.5 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                adminTab === 'messages'
                  ? 'bg-primary-container text-on-primary-container'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">mail</span>
              <span>Inquiries ({contactMessages.length})</span>
            </button>
          </div>

          {/* Database Connection Status Badge */}
          <button
            onClick={() => setIsDbConfigModalOpen(true)}
            className={`px-3 py-2 rounded-lg text-xs font-code-md flex items-center gap-2 border transition-all cursor-pointer ${
              isSupabaseConfigured
                ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
            }`}
            title="Click to check or configure live Supabase database connection"
          >
            <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span>{isSupabaseConfigured ? 'DB: Live' : 'DB: Local Mock'}</span>
            <span className="material-symbols-outlined text-[14px]">tune</span>
          </button>

          <button
            onClick={() => {
              logout();
              onNavigate('home');
            }}
            className="px-3 py-2 rounded bg-surface-container hover:bg-error/20 text-error border border-outline-variant/30 text-xs font-code-md flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Log out of administrator console"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30">
          <span className="text-[11px] font-code-md text-outline uppercase tracking-wider block">
            Total Submissions
          </span>
          <div className="font-display text-3xl font-bold text-white mt-1">
            {metrics.totalRegs}
          </div>
          <span className="text-xs text-secondary font-code-md mt-1 block">
            {metrics.verifiedCount} verified / {metrics.pendingCount} pending
          </span>
        </div>

        <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30">
          <span className="text-[11px] font-code-md text-outline uppercase tracking-wider block">
            Verified Fee Intake
          </span>
          <div className="font-display text-3xl font-bold text-primary-container mt-1">
            PKR {metrics.totalRevenue.toLocaleString()}
          </div>
          <span className="text-xs text-on-surface-variant font-code-md mt-1 block">
            Direct NED account receipts
          </span>
        </div>

        <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30">
          <span className="text-[11px] font-code-md text-outline uppercase tracking-wider block">
            Awaiting Verification
          </span>
          <div className="font-display text-3xl font-bold text-tertiary-fixed-dim mt-1">
            {metrics.pendingCount}
          </div>
          <span className="text-xs text-on-surface-variant font-code-md mt-1 block">
            Requires desk voucher audit
          </span>
        </div>

        <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-code-md text-outline uppercase tracking-wider block">
              Registration Status
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${
                eventSettings.registrationPhase === 'OPEN' ? 'bg-primary-container animate-pulse' :
                eventSettings.registrationPhase === 'NOT_STARTED' ? 'bg-yellow-400' : 'bg-red-400'
              }`}></span>
              <span className="font-display text-lg font-bold text-white">
                {eventSettings.registrationPhase === 'NOT_STARTED' ? 'About to Start' :
                 eventSettings.registrationPhase === 'OPEN' ? 'Ongoing' : 'Ended'}
              </span>
            </div>
            <span className="text-xs text-secondary font-code-md mt-0.5 block truncate">
              Event: {eventSettings.competitionDates}
            </span>
          </div>
          <button
            onClick={() => setAdminTab('timeline')}
            className="text-[11px] text-primary hover:underline font-code-md flex items-center gap-1 mt-2 text-left cursor-pointer"
          >
            <span>Configure Timeline</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: REGISTRATIONS MANAGER */}
      {/* ------------------------------------------------------------- */}
      {adminTab === 'registrations' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <span className="material-symbols-outlined text-outline text-[20px]">search</span>
              <input
                type="text"
                placeholder="Search by ID, name, university, or team..."
                value={regSearch}
                onChange={(e) => setRegSearch(e.target.value)}
                className="w-full bg-transparent text-sm text-on-surface placeholder:text-outline outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-code-md text-outline">Status:</span>
              <select
                value={regStatusFilter}
                onChange={(e) => setRegStatusFilter(e.target.value)}
                className="bg-surface-container border border-outline-variant/40 rounded px-3 py-1.5 text-xs text-on-surface outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <button
                onClick={handleExportCSV}
                title="Export all filtered submissions to CSV spreadsheet"
                className="px-3.5 py-1.5 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-xs font-semibold text-primary-container flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">file_download</span>
                <span>Export CSV ({filteredRegs.length})</span>
              </button>
            </div>
          </div>

          {/* Registrations Data Table */}
          <div className="overflow-x-auto rounded-xl border border-outline-variant/30 bg-surface-container-low shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container border-b border-outline-variant/30 text-xs font-code-md uppercase text-outline">
                <tr>
                  <th className="px-6 py-4">Reg ID</th>
                  <th className="px-6 py-4">Lead / Team</th>
                  <th className="px-6 py-4">Track</th>
                  <th className="px-6 py-4">Fee</th>
                  <th className="px-6 py-4">Payment &amp; TRX</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredRegs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant">
                      No registrations found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRegs.map(reg => (
                    <tr key={reg.id} className="hover:bg-surface-container/60 transition-colors">
                      <td className="px-6 py-4 font-code-md font-semibold text-primary">
                        {reg.registrationId}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">
                          {reg.teamName ? `${reg.teamName} (${reg.fullName})` : reg.fullName}
                        </div>
                        <div className="text-xs text-on-surface-variant">
                          {reg.universityName} · {reg.studentId}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white text-xs block font-medium">
                          {reg.competitionTitle}
                        </span>
                        <span className="text-[10px] font-code-md text-outline uppercase">
                          {reg.participationModel} · {reg.teamMembers?.length > 0 ? `${reg.teamMembers.length + 1} members` : 'Solo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-code-md text-xs font-bold text-primary-container">
                        PKR {reg.calculatedFee.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-code-md text-xs">
                        <span className="text-white uppercase block">{reg.paymentChannel}</span>
                        <span className="text-outline text-[11px] truncate block max-w-[120px]">
                          {reg.transactionId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-code-md text-[11px] px-2.5 py-1 rounded font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                            reg.status === 'VERIFIED'
                              ? 'bg-primary-container/20 text-primary-container border border-primary-container/30'
                              : reg.status === 'REJECTED'
                              ? 'bg-error/20 text-error border border-error/30'
                              : 'bg-tertiary-fixed-dim/20 text-tertiary-fixed-dim border border-tertiary-fixed-dim/30'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            reg.status === 'VERIFIED' ? 'bg-primary-container' : reg.status === 'REJECTED' ? 'bg-error' : 'bg-tertiary-fixed-dim'
                          }`}></span>
                          {reg.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenRegDetails(reg)}
                          className="px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-xs font-medium text-white transition-colors border border-outline-variant/30 cursor-pointer"
                        >
                          Review &amp; Audit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: COMPETITIONS MANAGER */}
      {/* ------------------------------------------------------------- */}
      {adminTab === 'competitions' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <span className="material-symbols-outlined text-outline text-[20px]">search</span>
              <input
                type="text"
                placeholder="Search tracks by title or keywords..."
                value={compSearch}
                onChange={(e) => setCompSearch(e.target.value)}
                className="w-full bg-transparent text-sm text-on-surface placeholder:text-outline outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={compCategoryFilter}
                onChange={(e) => setCompCategoryFilter(e.target.value)}
                className="bg-surface-container border border-outline-variant/40 rounded px-3 py-1.5 text-xs text-on-surface outline-none cursor-pointer"
              >
                <option value="all">All Categories ({competitions.length})</option>
                {categories.map(cat => {
                  const count = competitions.filter(c => c.category.toUpperCase() === cat.slug.toUpperCase()).length;
                  return (
                    <option key={cat.id} value={cat.slug}>{cat.name} ({count})</option>
                  );
                })}
              </select>

              <button
                onClick={handleOpenAddComp}
                className="px-4 py-2 bg-primary-container text-on-primary-container rounded text-xs font-semibold uppercase tracking-wider hover:bg-primary-fixed-dim transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Add Competition Track
              </button>

              <button
                onClick={() => {
                  if (confirm('Reset competitions list to the original 11 tracks?')) {
                    resetToDefault();
                  }
                }}
                className="px-3 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-on-surface-variant hover:text-white rounded text-xs transition-colors cursor-pointer"
                title="Restore default 11 tracks"
              >
                Reset Defaults
              </button>
            </div>
          </div>

          {/* Competitions Table */}
          <div className="overflow-x-auto rounded-xl border border-outline-variant/30 bg-surface-container-low shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container border-b border-outline-variant/30 text-xs font-code-md uppercase text-outline">
                <tr>
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Track Title</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Format</th>
                  <th className="px-6 py-4">Fee Structure</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredComps.map((comp) => (
                  <tr key={comp.id} className="hover:bg-surface-container/60 transition-colors">
                    <td className="px-6 py-4 font-code-md text-outline">
                      {String(comp.orderNum).padStart(2, '0')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{comp.title}</div>
                      <p className="text-xs text-on-surface-variant line-clamp-1 max-w-sm mt-0.5">
                        {comp.description}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-label-caps text-[11px] px-2.5 py-1 rounded bg-surface-container-high text-secondary">
                        {comp.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-code-md text-white">
                      {comp.format} ({comp.minMembers}–{comp.maxMembers} mem)
                    </td>
                    <td className="px-6 py-4 font-code-md text-xs">
                      {comp.format === 'SOLO' && `PKR ${comp.soloFee.toLocaleString()}`}
                      {comp.format === 'TEAM' && `PKR ${comp.teamFee.toLocaleString()}`}
                      {comp.format === 'BOTH' && `Solo: ${comp.soloFee} | Team: ${comp.teamFee}`}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => updateCompetition(comp.id, { isActive: !comp.isActive })}
                        className={`font-code-md text-[11px] px-2.5 py-1 rounded font-semibold cursor-pointer ${
                          comp.isActive
                            ? 'bg-primary-container/20 text-primary-container border border-primary-container/30'
                            : 'bg-surface-container text-outline border border-outline-variant/30'
                        }`}
                      >
                        {comp.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditComp(comp)}
                        className="px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-xs font-medium text-white transition-colors border border-outline-variant/30 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete track: "${comp.title}"?`)) {
                            deleteCompetition(comp.id);
                          }
                        }}
                        className="p-1.5 rounded text-error hover:bg-error/10 transition-colors cursor-pointer"
                        title="Delete Track"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: CATEGORY MANAGEMENT */}
      {/* ------------------------------------------------------------- */}
      {adminTab === 'categories' && (
        <div className="space-y-6 animate-fadeIn">
          {categoryToast && (
            <div className="p-4 rounded-xl bg-primary-container/20 border border-primary-container text-primary-container text-sm flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px]">category</span>
                <span>{categoryToast}</span>
              </div>
              <button onClick={() => setCategoryToast(null)} className="text-white hover:opacity-80">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}

          {/* Controls Bar & Quick Overview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-surface-container-low border border-outline-variant/30">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                <span className="font-label-caps text-xs text-primary uppercase tracking-wider">
                  Competition Streams &amp; Disciplines
                </span>
              </div>
              <h2 className="font-headline-md text-headline-md font-bold text-white tracking-tight mt-1">
                Discipline Categories ({categories.length})
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Define competition categories (Electronics, Robotics, etc.), edit their display names/icons, or remove streams.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryForm({ name: '', slug: '', description: '', icon: 'category' });
                  setCategoryError(null);
                  setIsCategoryModalOpen(true);
                }}
                className="px-4 py-2 bg-primary-container text-on-primary-container rounded text-xs font-semibold uppercase tracking-wider hover:bg-primary-fixed-dim transition-colors flex items-center gap-1.5 shadow-[0_0_15px_rgba(240,117,9,0.2)] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Add Category</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset all categories back to initial defaults (Electronics, Robotics, Programming, Projects, Esports)?')) {
                    resetCategoriesToDefault();
                    setCategoryToast('Categories reset to initial defaults.');
                    setTimeout(() => setCategoryToast(null), 3000);
                  }
                }}
                className="px-3.5 py-2 bg-surface-container hover:bg-surface-container-high text-xs text-on-surface-variant hover:text-white rounded border border-outline-variant/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Reset to default seed categories"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 max-w-md">
            <span className="material-symbols-outlined text-outline text-[20px]">search</span>
            <input
              type="text"
              placeholder="Search categories by name, code or description..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="w-full bg-transparent text-sm text-on-surface placeholder:text-outline outline-none"
            />
            {categorySearch && (
              <button onClick={() => setCategorySearch('')} className="text-outline hover:text-white cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map(cat => {
              const assignedComps = competitions.filter(
                c => c.category.toUpperCase() === cat.slug.toUpperCase()
              );
              return (
                <div
                  key={cat.id}
                  className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 hover:border-primary-container/40 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-xl bg-primary-container/15 text-primary-container border border-primary-container/30 flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-[26px]">
                          {cat.icon || 'category'}
                        </span>
                      </div>
                      <span className="font-code-md text-xs px-2.5 py-1 rounded bg-surface-container-high border border-outline-variant/30 text-outline font-semibold tracking-wider">
                        {cat.slug}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-headline-sm text-headline-sm font-bold text-white group-hover:text-primary transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-on-surface-variant line-clamp-2 mt-1 leading-relaxed">
                        {cat.description || 'No description provided for this discipline.'}
                      </p>
                    </div>

                    {/* Assigned tracks pill */}
                    <div className="pt-2 border-t border-outline-variant/20 flex flex-col gap-1.5 text-xs">
                      <div className="flex items-center justify-between text-on-surface-variant">
                        <span className="font-code-md text-[11px] uppercase tracking-wider text-outline">
                          Assigned Tracks
                        </span>
                        <span className={`font-code-md text-xs font-bold ${assignedComps.length > 0 ? 'text-primary' : 'text-outline'}`}>
                          {assignedComps.length} Track{assignedComps.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {assignedComps.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                          {assignedComps.map(c => (
                            <span
                              key={c.id}
                              className="text-[10px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant border border-outline-variant/20 truncate max-w-[200px]"
                              title={c.title}
                            >
                              {c.title}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-outline italic">No competitions assigned yet</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(cat);
                        setCategoryForm({
                          name: cat.name,
                          slug: cat.slug,
                          description: cat.description || '',
                          icon: cat.icon || 'category'
                        });
                        setCategoryError(null);
                        setIsCategoryModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-xs text-on-surface hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                      title="Edit Category"
                    >
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        if (assignedComps.length > 0) {
                          setCategoryDeleteTarget({ category: cat, affectedCount: assignedComps.length });
                          const other = categories.find(c => c.id !== cat.id);
                          setCategoryReassignSlug(other ? other.slug : '');
                        } else {
                          if (confirm(`Are you sure you want to remove category "${cat.name}"?`)) {
                            await deleteCategory(cat.id);
                            setCategoryToast(`Category "${cat.name}" removed.`);
                            setTimeout(() => setCategoryToast(null), 3000);
                          }
                        }
                      }}
                      className="px-3 py-1.5 rounded text-error/80 hover:text-error hover:bg-error/10 text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      title="Remove Category"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCategories.length === 0 && (
            <div className="p-12 text-center rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-3">
              <span className="material-symbols-outlined text-4xl text-outline">search_off</span>
              <p className="text-sm text-on-surface-variant font-medium">No categories matched your search.</p>
              <button
                type="button"
                onClick={() => setCategorySearch('')}
                className="text-xs text-primary hover:underline font-code-md cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: TIMELINE & REGISTRATION PHASES */}
      {/* ------------------------------------------------------------- */}
      {adminTab === 'timeline' && (
        <div className="space-y-6 animate-fadeIn">
          {timelineToast && (
            <div className="p-4 rounded-xl bg-primary-container/20 border border-primary-container text-primary-container text-sm flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <span><strong>Timeline Updated!</strong> All competition dates and registration phases have been broadcast across the portal.</span>
              </div>
              <button onClick={() => setTimelineToast(false)} className="text-white hover:opacity-80">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}

          <div className="p-6 sm:p-8 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                <span className="font-label-caps text-xs text-primary uppercase tracking-wider">
                  Registration State Machine &amp; Dates
                </span>
              </div>
              <h2 className="font-headline-md text-headline-md font-bold text-white tracking-tight mt-1">
                Event Schedule &amp; Registration Status Control
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                Control whether the registration portal is upcoming, actively taking applications, or closed. Dates and status selected here dynamically update the homepage, registration page, and competition cards.
              </p>
            </div>

            {/* Registration Phase Selector Cards */}
            <div className="space-y-3">
              <label className="block text-xs font-code-md uppercase tracking-wider text-outline">
                Current Registration Phase (Active Mode) *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. About to Start */}
                <div
                  onClick={() => {
                    setIsTimelineDirty(true);
                    setTimelineError(null);
                    setTimelineForm(prev => ({ ...prev, registrationPhase: 'NOT_STARTED' }));
                  }}
                  className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    timelineForm.registrationPhase === 'NOT_STARTED'
                      ? 'bg-surface-container border-yellow-500/70 ring-1 ring-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.15)]'
                      : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant/60'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="material-symbols-outlined text-yellow-400 text-[26px]">hourglass_top</span>
                      {timelineForm.registrationPhase === 'NOT_STARTED' && (
                        <span className="font-code-md text-[10px] px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-bold uppercase">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-white text-base">About to Start</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Public registration form is <strong>locked</strong>. The registration page informs visitors that entries have not opened yet and reveals the scheduled start date.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-outline-variant/20 mt-4 text-[11px] font-code-md text-yellow-400">
                    Displays: "Opens on {formatDisplayDate(timelineForm.registrationStartDate)}"
                  </div>
                </div>

                {/* 2. Ongoing */}
                <div
                  onClick={() => {
                    setIsTimelineDirty(true);
                    setTimelineError(null);
                    setTimelineForm(prev => ({ ...prev, registrationPhase: 'OPEN' }));
                  }}
                  className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    timelineForm.registrationPhase === 'OPEN'
                      ? 'bg-surface-container border-primary-container ring-1 ring-primary-container/50 shadow-[0_0_20px_rgba(240,117,9,0.15)]'
                      : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant/60'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="material-symbols-outlined text-primary-container text-[26px]">lock_open</span>
                      {timelineForm.registrationPhase === 'OPEN' && (
                        <span className="font-code-md text-[10px] px-2 py-0.5 rounded bg-primary-container/20 text-primary font-bold uppercase">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-white text-base">Ongoing (Open)</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Registration form is <strong>fully accessible</strong>. Students can submit team entries, select competition tracks, and upload payment vouchers.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-outline-variant/20 mt-4 text-[11px] font-code-md text-primary-container">
                    Deadline: {formatDisplayDate(timelineForm.registrationEndDate)}
                  </div>
                </div>

                {/* 3. Ended */}
                <div
                  onClick={() => {
                    setIsTimelineDirty(true);
                    setTimelineError(null);
                    setTimelineForm(prev => ({ ...prev, registrationPhase: 'CLOSED' }));
                  }}
                  className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    timelineForm.registrationPhase === 'CLOSED'
                      ? 'bg-surface-container border-red-500/70 ring-1 ring-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                      : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant/60'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="material-symbols-outlined text-red-400 text-[26px]">event_busy</span>
                      {timelineForm.registrationPhase === 'CLOSED' && (
                        <span className="font-code-md text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold uppercase">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-white text-base">Ended (Closed)</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Registration form is <strong>locked</strong>. The registration page informs visitors that registrations ended on the specified closing date.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-outline-variant/20 mt-4 text-[11px] font-code-md text-red-400">
                    Displays: "Closed on {formatDisplayDate(timelineForm.registrationEndDate)}"
                  </div>
                </div>
              </div>
            </div>

            {/* Date Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-outline-variant/30">
              <div className="space-y-2">
                <label className="block text-xs font-code-md uppercase tracking-wider text-on-surface">
                  Exhibition &amp; Competition Title Dates (Display Text) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 27–28 October 2026"
                  value={timelineForm.competitionDates}
                  onChange={(e) => {
                    setIsTimelineDirty(true);
                    setTimelineError(null);
                    setTimelineForm(prev => ({ ...prev, competitionDates: e.target.value }));
                  }}
                  className="w-full px-4 py-2.5 bg-surface-container text-white rounded border border-outline-variant/40 text-sm outline-none focus:border-primary-container"
                />
                <p className="text-[11px] text-outline">
                  Reflected on Homepage metric banner, event symposium header, and announcements.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-code-md uppercase tracking-wider text-on-surface">
                  Event Primary Date (Calendar Date) *
                </label>
                <input
                  type="date"
                  required
                  value={timelineForm.eventDate}
                  onChange={(e) => {
                    setIsTimelineDirty(true);
                    setTimelineError(null);
                    setTimelineForm(prev => ({ ...prev, eventDate: e.target.value }));
                  }}
                  className="w-full px-4 py-2.5 bg-surface-container text-white rounded border border-outline-variant/40 text-sm outline-none focus:border-primary-container"
                />
                <p className="text-[11px] text-outline">
                  Formatted preview: <strong>{formatDisplayDate(timelineForm.eventDate)}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-code-md uppercase tracking-wider text-on-surface">
                  Registration Start Date (Opens On) *
                </label>
                <input
                  type="date"
                  required
                  value={timelineForm.registrationStartDate}
                  onChange={(e) => {
                    setIsTimelineDirty(true);
                    setTimelineError(null);
                    setTimelineForm(prev => ({ ...prev, registrationStartDate: e.target.value }));
                  }}
                  className="w-full px-4 py-2.5 bg-surface-container text-white rounded border border-outline-variant/40 text-sm outline-none focus:border-primary-container"
                />
                <p className="text-[11px] text-outline">
                  Displayed on the Registration Page when status is set to <strong>"About to Start"</strong>. Preview: <strong>{formatDisplayDate(timelineForm.registrationStartDate)}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-code-md uppercase tracking-wider text-on-surface">
                  Registration Deadline / End Date (Closes On) *
                </label>
                <input
                  type="date"
                  required
                  value={timelineForm.registrationEndDate}
                  onChange={(e) => {
                    setIsTimelineDirty(true);
                    setTimelineError(null);
                    setTimelineForm(prev => ({ ...prev, registrationEndDate: e.target.value }));
                  }}
                  className="w-full px-4 py-2.5 bg-surface-container text-white rounded border border-outline-variant/40 text-sm outline-none focus:border-primary-container"
                />
                <p className="text-[11px] text-outline">
                  Displayed on the Registration Page when status is set to <strong>"Ended"</strong>. Preview: <strong>{formatDisplayDate(timelineForm.registrationEndDate)}</strong>
                </p>
              </div>
            </div>

            {/* Live Public Site Preview */}
            <div className="p-5 rounded-xl bg-surface-container border border-outline-variant/30 space-y-3">
              <span className="text-[11px] font-code-md uppercase text-secondary font-bold block">
                Live Public Site Effect Preview:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-surface-container-lowest rounded border border-outline-variant/20 space-y-1">
                  <span className="text-outline block">Homepage Top Header Tag:</span>
                  <span className="font-semibold text-white">
                    {timelineForm.registrationPhase === 'NOT_STARTED' && 'REGISTRATIONS OPENING SOON'}
                    {timelineForm.registrationPhase === 'OPEN' && 'REGISTRATION OPEN'}
                    {timelineForm.registrationPhase === 'CLOSED' && 'REGISTRATIONS CLOSED'}
                  </span>
                </div>
                <div className="p-3 bg-surface-container-lowest rounded border border-outline-variant/20 space-y-1">
                  <span className="text-outline block">Homepage Event Date Card:</span>
                  <span className="font-semibold text-white">
                    {timelineForm.competitionDates || formatDisplayDate(timelineForm.eventDate)}
                  </span>
                </div>
                <div className="sm:col-span-2 p-3 bg-surface-container-lowest rounded border border-outline-variant/20 space-y-1">
                  <span className="text-outline block">Registration Page Behavior:</span>
                  <span className="text-on-surface-variant block">
                    {timelineForm.registrationPhase === 'NOT_STARTED' && (
                      <span className="text-yellow-400">
                        Displays "Registrations Have Not Started Yet" notice with date: <strong>{formatDisplayDate(timelineForm.registrationStartDate)}</strong> (Form is replaced).
                      </span>
                    )}
                    {timelineForm.registrationPhase === 'OPEN' && (
                      <span className="text-primary-container">
                        Displays complete 5-step registration form with deadline: <strong>{formatDisplayDate(timelineForm.registrationEndDate)}</strong>.
                      </span>
                    )}
                    {timelineForm.registrationPhase === 'CLOSED' && (
                      <span className="text-red-400">
                        Displays "Registrations Have Ended" notice stating it ended on: <strong>{formatDisplayDate(timelineForm.registrationEndDate)}</strong> (Form is replaced).
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Error Banner if update failed */}
            {timelineError && (
              <div className="p-3.5 rounded-lg bg-error/15 border border-error/40 text-error text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{timelineError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTimelineError(null)}
                  className="text-error hover:opacity-75"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            {/* Save Buttons & Action Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-outline-variant/30">
              <div className="flex items-center gap-2">
                {isTimelineDirty && (
                  <span className="text-[11px] font-code-md px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    Unsaved Changes Pending
                  </span>
                )}
                {!isTimelineDirty && (
                  <span className="text-[11px] font-code-md text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-green-400">check_circle</span>
                    All dates synchronized with database
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <button
                  type="button"
                  disabled={timelineSaving}
                  onClick={() => {
                    setIsTimelineDirty(false);
                    setTimelineError(null);
                    setTimelineForm({
                      registrationPhase: eventSettings.registrationPhase,
                      eventDate: eventSettings.eventDate,
                      registrationStartDate: eventSettings.registrationStartDate,
                      registrationEndDate: eventSettings.registrationEndDate,
                      competitionDates: eventSettings.competitionDates
                    });
                  }}
                  className="px-4 py-2.5 rounded bg-surface-container hover:bg-surface-container-high text-xs text-on-surface transition-colors cursor-pointer disabled:opacity-50"
                >
                  Reset to Current
                </button>
                <button
                  type="button"
                  disabled={timelineSaving}
                  onClick={async () => {
                    setTimelineSaving(true);
                    setTimelineError(null);
                    const res = await updateEventSettings(timelineForm);
                    setTimelineSaving(false);
                    if (!res.success) {
                      setTimelineError(res.error || 'Failed to update timeline in database.');
                    } else {
                      setIsTimelineDirty(false);
                      setTimelineToast(true);
                      setTimeout(() => setTimelineToast(false), 4000);
                    }
                  }}
                  className="px-6 py-2.5 rounded bg-primary-container text-on-primary-container hover:bg-primary-fixed-dim text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(240,117,9,0.25)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {timelineSaving ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      <span>Save &amp; Broadcast Timeline Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: ADMINISTRATORS & PRIVILEGE MANAGEMENT */}
      {/* ------------------------------------------------------------- */}
      {adminTab === 'admins' && (
        <div className="space-y-8 animate-fadeIn">
          {roleActionToast && (
            <div className="p-4 rounded-xl bg-primary-container/20 border border-primary-container text-primary-container text-sm flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px]">verified_user</span>
                <span>{roleActionToast}</span>
              </div>
              <button onClick={() => setRoleActionToast(null)} className="text-white hover:opacity-80">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}

          {/* Top Actions & Overview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-surface-container-low border border-outline-variant/30">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                <span className="font-label-caps text-xs text-primary uppercase tracking-wider">
                  Access Control List &amp; Roles
                </span>
              </div>
              <h2 className="font-headline-md text-headline-md font-bold text-white tracking-tight mt-1">
                Administrator Privileges &amp; Team Management
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed max-w-2xl">
                Grant or revoke administrative CMS privileges. Administrators have clearance to verify registration payments, modify competition specs, edit event dates, and audit submissions.
              </p>
            </div>

            <button
              onClick={() => setIsAddAdminModalOpen(true)}
              className="px-4 py-2.5 bg-primary-container text-on-primary-container rounded text-xs font-bold uppercase tracking-wider hover:bg-primary-fixed-dim transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(240,117,9,0.2)] shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Add Administrator</span>
            </button>
          </div>

          {/* Section 1: Active Administrators */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">shield_person</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-white">
                  Active Administrators ({adminUsers.length})
                </h3>
              </div>
              <span className="text-xs font-code-md text-outline">Full Read / Write / Verification Clearance</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminUsers.map((admin) => {
                const isRootAdmin = admin.id === currentRootAdmin?.id;
                const isCurrentSelf = currentUser?.id === admin.id;
                // Only the Root Admin itself or Co-Admin can edit co-admins; Root admin can ONLY be edited by the root admin self
                const canEditThisAdmin = !isRootAdmin || isCurrentUserRootAdmin;

                return (
                  <div
                    key={admin.id}
                    className="p-5 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between space-y-4 relative overflow-hidden"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-full bg-primary-container/20 border border-primary-container/40 text-primary-container flex items-center justify-center font-bold text-sm">
                          {admin.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {isRootAdmin ? (
                            <span className="text-[10px] font-code-md px-2 py-0.5 rounded bg-primary-container/20 text-primary-container font-bold uppercase border border-primary-container/40 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">stars</span>
                              <span>Root Admin</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-code-md px-2 py-0.5 rounded bg-secondary/20 text-secondary font-bold uppercase border border-secondary/40">
                              Co-Admin
                            </span>
                          )}
                          {isCurrentSelf && (
                            <span className="text-[9px] font-code-md text-outline">(Logged In As You)</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-white text-sm">{admin.name}</h4>
                        <p className="text-xs text-secondary font-code-md mt-0.5">{admin.email}</p>
                        <p className="text-[11px] text-on-surface-variant mt-1">{admin.department || 'Electronic Engineering'}</p>
                      </div>

                      <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[11px] font-code-md text-outline">
                        <span>ID: {admin.studentId || 'FAC-001'}</span>
                        <span>Pass: {admin.password ? '••••••••' : 'Secured'}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {canEditThisAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAdminUser(admin);
                                setAdminEditForm({
                                  name: admin.name || '',
                                  email: admin.email || '',
                                  password: admin.password || '',
                                  department: admin.department || '',
                                  phoneNumber: admin.phoneNumber || '',
                                  studentId: admin.studentId || '',
                                });
                                setAdminEditError(null);
                              }}
                              className="px-2.5 py-1.5 rounded bg-primary-container/20 hover:bg-primary-container/30 text-primary-container text-xs font-code-md transition-colors cursor-pointer flex items-center gap-1 border border-primary-container/40"
                              title="Edit administrator name, email, or credentials"
                            >
                              <span className="material-symbols-outlined text-[14px]">edit</span>
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                const newPass = prompt(`Set new security password for ${admin.name}:`, admin.password || 'admin123');
                                if (newPass && newPass.trim().length >= 6) {
                                  await updateUserPassword(admin.id, newPass.trim());
                                  setRoleActionToast(`Password updated for ${admin.name}!`);
                                  setTimeout(() => setRoleActionToast(null), 4000);
                                } else if (newPass) {
                                  alert('Password must be at least 6 characters in length.');
                                }
                              }}
                              className="px-2.5 py-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-xs text-on-surface font-code-md transition-colors cursor-pointer flex items-center gap-1"
                              title="Change administrator password"
                            >
                              <span className="material-symbols-outlined text-[14px]">lock_reset</span>
                              <span>Pass</span>
                            </button>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Root Admin can transfer root ownership to a Co-Admin */}
                        {isCurrentUserRootAdmin && !isRootAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setTransferTargetAdmin(admin);
                              setTransferError(null);
                            }}
                            className="px-2.5 py-1.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-code-md transition-colors cursor-pointer flex items-center gap-1 border border-amber-500/30"
                            title="Make this administrator the Root Admin"
                          >
                            <span className="material-symbols-outlined text-[14px]">stars</span>
                            <span>Make Root Admin</span>
                          </button>
                        )}

                        {!isRootAdmin && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`Revoke administrative privileges from ${admin.name} (${admin.email})? They will become a standard USER.`)) {
                                const res = await updateUserRole(admin.id, 'USER');
                                if (res && !res.success) {
                                  alert(res.error || 'Failed to revoke administrator.');
                                  return;
                                }
                                setRoleActionToast(`Revoked admin privileges from ${admin.name}. Account is now regular USER.`);
                                setTimeout(() => setRoleActionToast(null), 4000);
                              }
                            }}
                            className="px-2.5 py-1.5 rounded bg-error/15 hover:bg-error/25 text-error text-xs font-code-md transition-colors cursor-pointer flex items-center gap-1"
                            title="Revoke admin privileges"
                          >
                            <span className="material-symbols-outlined text-[14px]">person_remove</span>
                            <span>Revoke</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: User Directory & Promote to Admin */}
          <div className="space-y-4 pt-4 border-t border-outline-variant/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-white">
                  User Directory &amp; Role Assignment
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Search registered student or faculty accounts and grant them administrative clearance with one click.
                </p>
              </div>

              {/* Search User Input */}
              <div className="relative w-full sm:w-72">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search user by name, email, roll #..."
                  value={adminUserSearch}
                  onChange={(e) => setAdminUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded bg-surface-container text-xs text-white placeholder:text-outline border border-outline-variant/30 outline-none focus:border-primary-container"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-outline-variant/30 bg-surface-container-low">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-outline-variant/30 bg-surface-container text-outline font-code-md uppercase text-[11px]">
                    <th className="py-3 px-4">User Details</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Institution / Dept</th>
                    <th className="py-3 px-4">Current Role</th>
                    <th className="py-3 px-4 text-right">Privilege Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {allFilteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-container/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-surface-container-high border border-outline-variant/40 flex items-center justify-center font-bold text-xs text-on-surface">
                            {u.name.slice(0, 1)}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{u.name}</span>
                            <span className="text-[10px] text-outline font-code-md">{u.studentId || 'ID Pending'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-code-md text-on-surface-variant">
                        {u.email}
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant">
                        <span className="block truncate max-w-[200px]">{u.university || 'NED University'}</span>
                        <span className="text-[10px] text-outline block">{u.department || 'Electronic Engg.'}</span>
                      </td>
                      <td className="py-3 px-4">
                        {u.role === 'ADMIN' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-container/20 text-primary font-code-md text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                            ADMIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-code-md text-[10px]">
                            USER
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.role === 'ADMIN' ? (
                          (u.isRootAdmin || u.id === currentRootAdmin?.id) ? (
                            <span className="text-outline text-[11px] font-code-md">Protected Root</span>
                          ) : (
                            <button
                              onClick={async () => {
                                if (confirm(`Revoke admin privileges from ${u.name}?`)) {
                                  await updateUserRole(u.id, 'USER');
                                  setRoleActionToast(`Revoked admin role from ${u.name}.`);
                                  setTimeout(() => setRoleActionToast(null), 4000);
                                }
                              }}
                              className="px-2.5 py-1 rounded bg-error/15 hover:bg-error/25 text-error text-[11px] font-code-md transition-colors cursor-pointer"
                            >
                              Revoke Admin
                            </button>
                          )
                        ) : (
                          <button
                            onClick={async () => {
                              if (confirm(`Grant ADMIN privileges to ${u.name} (${u.email})? They will have full administrative access to /admin.`)) {
                                await updateUserRole(u.id, 'ADMIN');
                                setRoleActionToast(`Granted ADMIN privileges to ${u.name}! They can now log in at /admin.`);
                                setTimeout(() => setRoleActionToast(null), 4000);
                              }
                            }}
                            className="px-2.5 py-1 rounded bg-primary-container text-on-primary-container hover:bg-primary-fixed-dim text-[11px] font-code-md font-semibold transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                          >
                            <span className="material-symbols-outlined text-[14px]">shield</span>
                            <span>Promote to Admin</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {allFilteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-outline font-code-md">
                        No users match query "{adminUserSearch}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB: CONTACT INQUIRIES & MESSAGES */}
      {/* ------------------------------------------------------------- */}
      {adminTab === 'messages' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-surface-container-low border border-outline-variant/30">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                <span className="font-label-caps text-xs text-primary uppercase tracking-wider">
                  Live Contact Inquiries
                </span>
              </div>
              <h2 className="font-headline-md text-headline-md font-bold text-white mt-1">
                Participant Queries &amp; Feedback
              </h2>
              <p className="font-body-sm text-on-surface-variant text-xs mt-1">
                Real-time messages submitted via the public Contact &amp; Location page.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={contactMessageSearch}
                onChange={(e) => setContactMessageSearch(e.target.value)}
                placeholder="Search messages..."
                className="px-3.5 py-2 rounded bg-surface-container text-xs text-white border border-outline-variant/30 focus:outline-none focus:border-primary-container"
              />
              <button
                onClick={() => {
                  getContactMessages().then(res => {
                    if (res.data) setContactMessages(res.data);
                  });
                }}
                className="px-3.5 py-2 rounded bg-surface-container-high hover:bg-surface-container-highest text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Refresh messages"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Messages List */}
          {contactMessages.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-3">
              <span className="material-symbols-outlined text-[48px] text-outline">mark_email_read</span>
              <h3 className="font-bold text-white text-base">No Inquiries Found</h3>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                No participant inquiries have been submitted yet. New contact messages will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {contactMessages
                .filter(m => {
                  const q = contactMessageSearch.toLowerCase().trim();
                  if (!q) return true;
                  return (
                    m.fullName.toLowerCase().includes(q) ||
                    m.emailAddress.toLowerCase().includes(q) ||
                    m.subjectCategory.toLowerCase().includes(q) ||
                    m.messageBody.toLowerCase().includes(q)
                  );
                })
                .map((msg) => (
                  <div
                    key={msg.id}
                    className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-3 hover:border-outline-variant/60 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/20 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{msg.fullName}</span>
                        <a
                          href={`mailto:${msg.emailAddress}`}
                          className="font-code-sm text-xs text-primary hover:underline"
                        >
                          {msg.emailAddress}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-caps text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-secondary uppercase">
                          {msg.subjectCategory}
                        </span>
                        <span className="text-[11px] text-on-surface-variant font-code-sm">
                          {formatDisplayDate(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                      {msg.messageBody}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: SUPABASE DATABASE CONNECTION STATUS */}
      {/* ------------------------------------------------------------- */}
      {isDbConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-2xl w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full ${isSupabaseConfigured ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`}></span>
                <h3 className="font-headline-sm text-lg font-bold text-white">Database Connection Status</h3>
              </div>
              <button
                onClick={() => setIsDbConfigModalOpen(false)}
                className="text-on-surface-variant hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className={`p-5 rounded-xl border text-xs leading-relaxed ${
                isSupabaseConfigured
                  ? 'bg-green-500/10 border-green-500/30 text-green-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              }`}>
                {isSupabaseConfigured ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-green-400">
                      <span className="material-symbols-outlined text-[20px]">cloud_done</span>
                      <span>Connected &amp; Operational</span>
                    </div>
                    <p className="text-on-surface-variant">
                      The application is securely connected to the central PostgreSQL production database cluster.
                    </p>
                    <div className="pt-2 border-t border-green-500/20 text-[11px] text-green-400/90 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">sync</span>
                      <span>Registrations, event settings, and inquiries synchronize in real time.</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
                      <span className="material-symbols-outlined text-[20px]">cloud_off</span>
                      <span>Local Storage Mode</span>
                    </div>
                    <p className="text-on-surface-variant">
                      The application is currently operating using local browser persistence. Ensure deployment environment variables are configured in Netlify to connect the live PostgreSQL database.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setIsDbConfigModalOpen(false)}
                className="px-5 py-2 bg-surface-container hover:bg-surface-container-high text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD NEW ADMINISTRATOR */}
      {/* ------------------------------------------------------------- */}
      {isAddAdminModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary-container/20 text-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-white">
                  Add Administrator
                </h3>
              </div>
              <button
                onClick={() => setIsAddAdminModalOpen(false)}
                className="text-outline hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newAdminForm.name || !newAdminForm.email || !newAdminForm.password) {
                  alert('Please provide name, email, and password.');
                  return;
                }
                if (newAdminForm.password.length < 6) {
                  alert('Password must be at least 6 characters.');
                  return;
                }
                await addAdminUser(newAdminForm);
                setIsAddAdminModalOpen(false);
                setRoleActionToast(`Administrator "${newAdminForm.name}" created successfully! They can log in with their email and password.`);
                setNewAdminForm({
                  name: '',
                  email: '',
                  password: '',
                  department: 'Department of Electronic Engineering',
                  phoneNumber: ''
                });
                setTimeout(() => setRoleActionToast(null), 5000);
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="block text-xs font-code-md text-on-surface uppercase tracking-wider">
                  Full Name &amp; Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engr. Dr. Ali Raza"
                  value={newAdminForm.name}
                  onChange={(e) => setNewAdminForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-surface-container text-white rounded border border-outline-variant/40 text-sm outline-none focus:border-primary-container"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-code-md text-on-surface uppercase tracking-wider">
                  Official Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ali.raza@neduet.edu.pk"
                  value={newAdminForm.email}
                  onChange={(e) => setNewAdminForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-surface-container text-white rounded border border-outline-variant/40 text-sm outline-none focus:border-primary-container"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-code-md text-on-surface uppercase tracking-wider">
                  Security Passcode / Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={newAdminForm.password}
                  onChange={(e) => setNewAdminForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-surface-container text-white rounded border border-outline-variant/40 text-sm outline-none focus:border-primary-container"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-code-md text-on-surface uppercase tracking-wider">
                  Department / Organization
                </label>
                <input
                  type="text"
                  placeholder="Department of Electronic Engineering"
                  value={newAdminForm.department}
                  onChange={(e) => setNewAdminForm(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-surface-container text-white rounded border border-outline-variant/40 text-sm outline-none focus:border-primary-container"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setIsAddAdminModalOpen(false)}
                  className="px-4 py-2 rounded bg-surface-container hover:bg-surface-container-high text-xs text-on-surface transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded bg-primary-container text-on-primary-container hover:bg-primary-fixed-dim text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Create Administrator</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: EDIT ADMINISTRATOR PROFILE */}
      {/* ------------------------------------------------------------- */}
      {editingAdminUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary-container/20 text-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-white">
                    Edit Administrator
                  </h3>
                  <p className="text-[11px] text-outline font-code-md">
                    {editingAdminUser.isRootAdmin || editingAdminUser.id === currentRootAdmin?.id ? 'Root Administrator Profile' : 'Administrator Profile'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingAdminUser(null)}
                className="text-outline hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {adminEditError && (
              <div className="p-3 rounded bg-error/15 border border-error/30 text-error text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                <span>{adminEditError}</span>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setAdminEditError(null);
                if (!adminEditForm.name.trim() || !adminEditForm.email.trim()) {
                  setAdminEditError('Name and Email are required.');
                  return;
                }
                if (adminEditForm.password && adminEditForm.password.length < 6) {
                  setAdminEditError('Password must be at least 6 characters.');
                  return;
                }
                const res = await updateUserDetails(editingAdminUser.id, adminEditForm);
                if (!res.success) {
                  setAdminEditError(res.error || 'Failed to update administrator profile.');
                  return;
                }
                setRoleActionToast(`Administrator details for "${adminEditForm.name}" updated successfully!`);
                setTimeout(() => setRoleActionToast(null), 4000);
                setEditingAdminUser(null);
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="block text-xs font-code-md text-on-surface uppercase tracking-wider">
                  Full Name &amp; Title *
                </label>
                <input
                  type="text"
                  required
                  value={adminEditForm.name}
                  onChange={(e) => setAdminEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-surface-container text-white rounded border border-outline-variant/40 text-sm outline-none focus:border-primary-container"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-code-md text-on-surface uppercase tracking-wider">
                  Official Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={adminEditForm.email}
                  onChange={(e) => setAdminEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-surface-container text-white rounded border border-outline-variant/40 text-sm outline-none focus:border-primary-container"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-code-md text-on-surface uppercase tracking-wider">
                  Security Password / Passcode *
                </label>
                <input
                  type="password"
                  required
                  value={adminEditForm.password}
                  onChange={(e) => setAdminEditForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-surface-container text-white rounded border border-outline-variant/40 text-sm outline-none focus:border-primary-container font-code-md"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-code-md text-on-surface uppercase tracking-wider">
                  Department / Organization
                </label>
                <input
                  type="text"
                  value={adminEditForm.department}
                  onChange={(e) => setAdminEditForm(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-surface-container text-white rounded border border-outline-variant/40 text-sm outline-none focus:border-primary-container"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-code-md text-on-surface uppercase tracking-wider">
                    Phone / Contact
                  </label>
                  <input
                    type="text"
                    value={adminEditForm.phoneNumber}
                    onChange={(e) => setAdminEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface-container text-white rounded border border-outline-variant/40 text-xs outline-none focus:border-primary-container"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-code-md text-on-surface uppercase tracking-wider">
                    Faculty / Roll ID
                  </label>
                  <input
                    type="text"
                    value={adminEditForm.studentId}
                    onChange={(e) => setAdminEditForm(prev => ({ ...prev, studentId: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface-container text-white rounded border border-outline-variant/40 text-xs outline-none focus:border-primary-container"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setEditingAdminUser(null)}
                  className="px-4 py-2 rounded bg-surface-container hover:bg-surface-container-high text-xs text-on-surface transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded bg-primary-container text-on-primary-container hover:bg-primary-fixed-dim text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: TRANSFER ROOT ADMINISTRATOR OWNERSHIP */}
      {/* ------------------------------------------------------------- */}
      {transferTargetAdmin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-low border border-amber-500/40 rounded-xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-white">
                    Transfer Root Admin
                  </h3>
                  <p className="text-[11px] text-outline font-code-md">
                    Sole Governance Ownership Transfer
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setTransferTargetAdmin(null); setTransferError(null); }}
                className="text-outline hover:text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {transferError && (
              <div className="p-3 rounded bg-error/15 border border-error/30 text-error text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                <span>{transferError}</span>
              </div>
            )}

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 leading-relaxed space-y-2">
              <p className="font-bold text-amber-300">
                Are you sure you want to transfer Root Administrator status?
              </p>
              <p>
                You are about to promote <strong>{transferTargetAdmin.name}</strong> ({transferTargetAdmin.email}) to become the sole <strong>Root Administrator</strong>.
              </p>
              <p className="text-[11px] text-amber-200/80">
                Your own account will immediately become a regular Co-Administrator. The new Root Admin will hold irrevocable governance authority.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => { setTransferTargetAdmin(null); setTransferError(null); }}
                className="px-4 py-2 rounded bg-surface-container hover:bg-surface-container-high text-xs text-on-surface transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const res = await transferRootAdmin(transferTargetAdmin.id);
                  if (!res.success) {
                    setTransferError(res.error || 'Failed to transfer root administrator status.');
                    return;
                  }
                  setRoleActionToast(`Root Administrator privileges successfully transferred to ${transferTargetAdmin.name}!`);
                  setTimeout(() => setRoleActionToast(null), 5000);
                  setTransferTargetAdmin(null);
                  setTransferError(null);
                }}
                className="px-5 py-2.5 rounded bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                <span>Confirm &amp; Transfer Root</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT COMPETITION TRACK */}
      {/* ------------------------------------------------------------- */}
      {isCompModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
              <div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-white">
                  {editingComp ? 'Edit Competition Track' : 'Create New Competition Track'}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Update rules, category, capacity, and fee breakdown.
                </p>
              </div>
              <button
                onClick={() => setIsCompModalOpen(false)}
                className="text-outline hover:text-white p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveComp} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-code-md text-on-surface-variant uppercase">
                    Track Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={compForm.title}
                    onChange={(e) => setCompForm({ ...compForm, title: e.target.value })}
                    placeholder="e.g. Autonomous Drone Sprint"
                    className="w-full px-3 py-2 bg-surface-container text-white rounded border border-outline-variant/40 text-sm outline-none focus:border-primary-container"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-code-md text-on-surface-variant uppercase">
                    Category *
                  </label>
                  <select
                    value={compForm.category}
                    onChange={(e) => setCompForm({ ...compForm, category: e.target.value as Category })}
                    className="w-full px-3 py-2 bg-surface-container text-white rounded border border-outline-variant/40 text-sm outline-none cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.slug}>{cat.name} ({cat.slug})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-code-md text-on-surface-variant uppercase">
                    Format *
                  </label>
                  <select
                    value={compForm.format}
                    onChange={(e) => setCompForm({ ...compForm, format: e.target.value as Format })}
                    className="w-full px-3 py-2 bg-surface-container text-white rounded border border-outline-variant/40 text-sm outline-none cursor-pointer"
                  >
                    <option value="BOTH">Solo &amp; Team</option>
                    <option value="SOLO">Solo Only</option>
                    <option value="TEAM">Team Only</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-code-md text-on-surface-variant uppercase">
                    Member Limits (Min – Max)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={compForm.minMembers}
                      onChange={(e) => setCompForm({ ...compForm, minMembers: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 bg-surface-container text-white rounded border border-outline-variant/40 text-sm"
                    />
                    <span className="text-outline">to</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={compForm.maxMembers}
                      onChange={(e) => setCompForm({ ...compForm, maxMembers: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 bg-surface-container text-white rounded border border-outline-variant/40 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-code-md text-on-surface-variant uppercase">
                    Solo Entry Fee (PKR)
                  </label>
                  <input
                    type="number"
                    value={compForm.soloFee}
                    onChange={(e) => setCompForm({ ...compForm, soloFee: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-surface-container text-white rounded border border-outline-variant/40 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-code-md text-on-surface-variant uppercase">
                    Team Entry Fee (PKR)
                  </label>
                  <input
                    type="number"
                    value={compForm.teamFee}
                    onChange={(e) => setCompForm({ ...compForm, teamFee: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-surface-container text-white rounded border border-outline-variant/40 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-code-md text-on-surface-variant uppercase">
                  Description *
                </label>
                <textarea
                  rows={2}
                  required
                  value={compForm.description}
                  onChange={(e) => setCompForm({ ...compForm, description: e.target.value })}
                  placeholder="Summary of track evaluation and scope..."
                  className="w-full px-3 py-2 bg-surface-container text-white rounded border border-outline-variant/40 text-sm outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-code-md text-on-surface-variant uppercase">
                  Key Deliverables &amp; Rules
                </label>
                <input
                  type="text"
                  value={compForm.keyDeliverables}
                  onChange={(e) => setCompForm({ ...compForm, keyDeliverables: e.target.value })}
                  placeholder="e.g. Working breadboard prototype alongside written circuit analysis..."
                  className="w-full px-3 py-2 bg-surface-container text-white rounded border border-outline-variant/40 text-sm outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-code-md text-on-surface-variant uppercase">
                  Specs Summary Chip
                </label>
                <input
                  type="text"
                  value={compForm.specsSummary}
                  onChange={(e) => setCompForm({ ...compForm, specsSummary: e.target.value })}
                  placeholder="e.g. 1 to 4 Members | Display bench & AC power provided"
                  className="w-full px-3 py-2 bg-surface-container text-white rounded border border-outline-variant/40 text-sm outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="compIsActive"
                  checked={compForm.isActive}
                  onChange={(e) => setCompForm({ ...compForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded accent-primary-container cursor-pointer"
                />
                <label htmlFor="compIsActive" className="text-xs text-on-surface cursor-pointer select-none">
                  Track is Active (available for registration)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setIsCompModalOpen(false)}
                  className="px-4 py-2 rounded bg-surface-container hover:bg-surface-container-high text-xs font-medium text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded bg-primary-container text-on-primary-container hover:bg-primary-fixed-dim text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {editingComp ? 'Save Changes' : 'Create Track'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: REVIEW REGISTRATION & PAYMENT RECEIPT */}
      {/* ------------------------------------------------------------- */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-6 sm:p-8 max-w-3xl w-full space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
              <div>
                <span className="font-code-md text-xs text-primary font-semibold block">
                  {selectedReg.registrationId}
                </span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-white mt-0.5">
                  Registration Review: {selectedReg.fullName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReg(null)}
                className="text-outline hover:text-white p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              {/* Left Column: Participant & Squad Details */}
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-surface-container border border-outline-variant/20 space-y-2">
                  <span className="text-[10px] font-code-md text-secondary uppercase tracking-widest block font-bold">
                    Primary / Leader Details
                  </span>
                  <div className="space-y-1 text-xs">
                    <p><span className="text-outline">Full Name:</span> <strong className="text-white">{selectedReg.fullName}</strong></p>
                    <p><span className="text-outline">Roll No / Student ID / CNIC:</span> <strong className="text-primary">{selectedReg.studentId}</strong></p>
                    <p><span className="text-outline">Institution:</span> {selectedReg.universityName}</p>
                    <p><span className="text-outline">Department / Discipline / Grade:</span> {selectedReg.department} ({selectedReg.academicYear})</p>
                    <p><span className="text-outline">Email:</span> {selectedReg.emailAddress}</p>
                    <p><span className="text-outline">Primary Phone:</span> {selectedReg.phoneNumber}</p>
                    {selectedReg.alternatePhoneNumber && (
                      <p><span className="text-outline">Alternate Phone:</span> {selectedReg.alternatePhoneNumber}</p>
                    )}
                  </div>
                </div>

                {selectedReg.teamName && (
                  <div className="p-4 rounded-lg bg-surface-container border border-outline-variant/20 space-y-2">
                    <span className="text-[10px] font-code-md text-secondary uppercase tracking-widest block font-bold">
                      Team Handle: {selectedReg.teamName}
                    </span>
                    {selectedReg.teamMembers && selectedReg.teamMembers.length > 0 ? (
                      <div className="space-y-2 text-xs">
                        {selectedReg.teamMembers.map((tm, idx) => (
                          <div key={idx} className="p-2 bg-surface-container-high rounded border border-outline-variant/20">
                            <span className="font-semibold text-white block">Member 0{tm.memberIndex}: {tm.name}</span>
                            {tm.studentId && tm.studentId !== 'N/A' && (
                              <span className="text-outline font-code-md text-[11px]">{tm.studentId} {tm.email ? `· ${tm.email}` : ''}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-on-surface-variant">No secondary team members logged.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Payment & Voucher Details */}
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-surface-container border border-outline-variant/20 space-y-2">
                  <span className="text-[10px] font-code-md text-secondary uppercase tracking-widest block font-bold">
                    Payment Verification
                  </span>
                  <div className="space-y-1 text-xs font-code-md">
                    <p><span className="text-outline">Method:</span> <strong className="text-white uppercase">{selectedReg.paymentChannel}</strong></p>
                    <p><span className="text-outline">Transaction ID:</span> <strong className="text-primary">{selectedReg.transactionId}</strong></p>
                    <p><span className="text-outline">Fee Prescribed:</span> <strong className="text-primary-container">PKR {selectedReg.calculatedFee.toLocaleString()}</strong></p>
                    <p><span className="text-outline">Current Status:</span> <strong className="text-white">{selectedReg.status}</strong></p>
                  </div>
                </div>

                {/* Uploaded Voucher Receipt Preview */}
                <div className="space-y-2">
                  <span className="text-[10px] font-code-md text-secondary uppercase tracking-widest block font-bold">
                    Attached Voucher Slip
                  </span>
                  {selectedReg.receiptUrl ? (
                    <div className="border border-outline-variant/40 rounded-lg p-2 bg-surface-container space-y-2">
                      <div className="h-44 bg-surface-container-lowest rounded overflow-hidden flex items-center justify-center">
                        <img
                          src={selectedReg.receiptUrl}
                          alt="Payment Voucher Slip"
                          className="max-h-full max-w-full object-contain cursor-zoom-in"
                          onClick={() => {
                            const url = selectedReg.receiptUrl;
                            if (url && (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('data:image/') || url.startsWith('data:application/pdf'))) {
                              window.open(url, '_blank', 'noopener,noreferrer');
                            }
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-outline truncate max-w-xs">{selectedReg.receiptFileName || 'receipt.png'}</span>
                        <a
                          href={selectedReg.receiptUrl && (selectedReg.receiptUrl.startsWith('https://') || selectedReg.receiptUrl.startsWith('http://') || selectedReg.receiptUrl.startsWith('data:image/') || selectedReg.receiptUrl.startsWith('data:application/pdf')) ? selectedReg.receiptUrl : '#'}
                          download={selectedReg.receiptFileName || `voucher_${selectedReg.registrationId}.png`}
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">download</span>
                          Download
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded bg-surface-container text-xs text-outline text-center">
                      No receipt uploaded.
                    </div>
                  )}
                </div>

                {/* Admin Audit Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] font-code-md text-outline uppercase block">
                    Desk Verification Notes
                  </label>
                  <textarea
                    rows={2}
                    value={regNote}
                    onChange={(e) => setRegNote(e.target.value)}
                    placeholder="Enter reconciliation or accreditation notes..."
                    className="w-full px-3 py-2 bg-surface-container text-white rounded border border-outline-variant/40 text-xs outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Status Change Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="text-xs text-outline font-code-md">Update Status:</span>
                <button
                  onClick={() => handleUpdateRegStatus('VERIFIED')}
                  className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                    selectedReg.status === 'VERIFIED'
                      ? 'bg-primary-container text-on-primary-container ring-2 ring-primary-container'
                      : 'bg-surface-container text-primary hover:bg-primary-container/20'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Verify &amp; Approve
                </button>
                <button
                  onClick={() => handleUpdateRegStatus('PENDING')}
                  className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                    selectedReg.status === 'PENDING'
                      ? 'bg-tertiary-fixed-dim text-on-tertiary-fixed ring-2 ring-tertiary-fixed-dim'
                      : 'bg-surface-container text-tertiary-fixed-dim hover:bg-tertiary-fixed-dim/20'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">pending</span>
                  Mark Pending
                </button>
                <button
                  onClick={() => handleUpdateRegStatus('REJECTED')}
                  className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                    selectedReg.status === 'REJECTED'
                      ? 'bg-error text-on-error ring-2 ring-error'
                      : 'bg-surface-container text-error hover:bg-error/20'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  Reject
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-surface-container hover:bg-surface-container-high text-xs text-secondary hover:text-white rounded border border-outline-variant/40 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Print official registration desk pass for event check-in"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  Print Desk Pass
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete registration ${selectedReg.registrationId}?`)) {
                      deleteRegistration(selectedReg.id);
                      setSelectedReg(null);
                    }
                  }}
                  className="px-3 py-2 text-error hover:bg-error/10 text-xs rounded transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Delete Entry
                </button>
                <button
                  onClick={() => setSelectedReg(null)}
                  className="px-4 py-2 rounded bg-surface-container hover:bg-surface-container-high text-xs font-medium text-white transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT CATEGORY */}
      {/* ------------------------------------------------------------- */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
              <div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-white">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Configure the discipline stream name, code, icon, and overview.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-outline hover:text-white p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {categoryError && (
              <div className="p-3 rounded bg-error/15 border border-error/30 text-error text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                <span>{categoryError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-code-md text-on-surface-variant uppercase">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={categoryForm.name}
                  onChange={(e) => handleCategoryNameChange(e.target.value)}
                  placeholder="e.g. Artificial Intelligence & Data"
                  className="w-full px-3 py-2 bg-surface-container text-white rounded border border-outline-variant/40 text-sm outline-none focus:border-primary-container"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-code-md text-on-surface-variant uppercase">
                    Category Code / Slug *
                  </label>
                  <span className="text-[10px] text-outline font-code-md">AUTO-FORMATTED</span>
                </div>
                <input
                  type="text"
                  required
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })}
                  placeholder="e.g. AI_DATA"
                  className="w-full px-3 py-2 bg-surface-container text-white rounded border border-outline-variant/40 text-sm font-code-md outline-none focus:border-primary-container uppercase"
                />
                <span className="text-[11px] text-outline leading-tight block">
                  Unique identifier used to associate competition tracks and registrations.
                </span>
              </div>

              {/* Icon Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-code-md text-on-surface-variant uppercase">
                  Category Icon (Material Symbol)
                </label>
                
                {/* Popular Icon Presets */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {POPULAR_CATEGORY_ICONS.map(item => (
                    <button
                      key={item.icon}
                      type="button"
                      onClick={() => setCategoryForm({ ...categoryForm, icon: item.icon })}
                      className={`p-2 rounded border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        categoryForm.icon === item.icon
                          ? 'bg-primary-container/20 border-primary-container text-primary-container ring-1 ring-primary-container'
                          : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:border-outline-variant/60 hover:text-white'
                      }`}
                      title={item.label}
                    >
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                      <span className="text-[9px] truncate max-w-full font-code-md">{item.icon}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Icon input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value.trim().toLowerCase() })}
                    placeholder="or enter custom icon name (e.g. psychology)"
                    className="flex-1 px-3 py-1.5 bg-surface-container text-white rounded border border-outline-variant/40 text-xs font-code-md outline-none focus:border-primary-container"
                  />
                  <div className="w-8 h-8 rounded bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[18px]">
                      {categoryForm.icon || 'category'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-code-md text-on-surface-variant uppercase">
                  Description / Field Summary
                </label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Short description of this engineering discipline stream..."
                  className="w-full px-3 py-2 bg-surface-container text-white rounded border border-outline-variant/40 text-xs outline-none focus:border-primary-container"
                />
              </div>

              {/* Preview */}
              <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/30 space-y-1">
                <span className="text-[10px] font-code-md uppercase text-outline block">Preview Pill</span>
                <div className="flex items-center gap-2">
                  <span className="font-label-caps text-xs px-2.5 py-1 rounded bg-primary-container/20 border border-primary-container/40 text-primary-container uppercase tracking-wider flex items-center gap-1.5 font-bold">
                    <span className="material-symbols-outlined text-[14px]">{categoryForm.icon || 'category'}</span>
                    <span>{categoryForm.name || 'Category Name'}</span>
                  </span>
                  <span className="font-code-md text-[11px] text-outline">
                    [{categoryForm.slug || 'SLUG'}]
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded bg-surface-container hover:bg-surface-container-high text-xs text-on-surface transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-primary-container text-on-primary-container hover:bg-primary-fixed-dim text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(240,117,9,0.2)]"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DELETE CATEGORY CONFLICT & REASSIGNMENT */}
      {/* ------------------------------------------------------------- */}
      {categoryDeleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-low border border-error/40 rounded-xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl my-8">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-error/20 border border-error/40 text-error flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-headline-sm text-headline-sm font-bold text-white">
                  Tracks Assigned to Category
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Category <strong>"{categoryDeleteTarget.category.name}"</strong> has{' '}
                  <strong className="text-primary">{categoryDeleteTarget.affectedCount}</strong> active competition track(s) assigned.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-container text-xs text-on-surface-variant space-y-2 border border-outline-variant/30">
              <span className="text-[11px] font-code-md text-outline uppercase block font-semibold">
                Reassign tracks to:
              </span>
              <select
                value={categoryReassignSlug}
                onChange={(e) => setCategoryReassignSlug(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-lowest text-white rounded border border-outline-variant/40 text-xs outline-none cursor-pointer"
              >
                <option value="" disabled>Select destination category</option>
                {categories
                  .filter(c => c.id !== categoryDeleteTarget.category.id)
                  .map(c => (
                    <option key={c.id} value={c.slug}>
                      {c.name} ({c.slug})
                    </option>
                  ))}
              </select>
              <p className="text-[11px] text-outline leading-tight pt-1">
                All existing competition tracks under "{categoryDeleteTarget.category.name}" will be migrated to the chosen category.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setCategoryDeleteTarget(null)}
                className="px-4 py-2 rounded bg-surface-container hover:bg-surface-container-high text-xs text-on-surface transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteWithReassign}
                disabled={!categoryReassignSlug}
                className="px-4 py-2 rounded bg-error text-white hover:bg-error/80 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                <span>Reassign &amp; Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
