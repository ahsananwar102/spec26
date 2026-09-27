import { useState, useEffect } from 'react';
import { User, Role, Competition, Registration, ContactMessage, RegStatus, EventSettings, RegistrationPhase, CategoryItem } from '../types';
import { INITIAL_USERS, INITIAL_COMPETITIONS, INITIAL_REGISTRATIONS, INITIAL_CATEGORIES } from './seedData';
import { supabase, mapSupabaseUserToAppUser, signInWithGoogleOAuth, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  USERS: 'spec26_users',
  COMPETITIONS: 'spec26_competitions',
  REGISTRATIONS: 'spec26_registrations',
  CURRENT_USER: 'spec26_current_user',
  CONTACT_MSGS: 'spec26_contact_messages',
  EVENT_SETTINGS: 'spec26_event_settings',
  PASSWORD_RESETS: 'spec26_password_resets',
  CATEGORIES: 'spec26_categories'
};

export interface PasswordResetItem {
  token: string;
  email: string;
  expiresAt: number;
  createdAt: string;
}

// Default event configuration
const DEFAULT_EVENT_SETTINGS: EventSettings = {
  registrationPhase: 'OPEN',
  eventDate: '2026-04-15',
  registrationStartDate: '2026-03-01',
  registrationEndDate: '2026-04-10',
  competitionDates: '15\u201316 April 2026',
  updatedAt: new Date().toISOString()
};

// Initialize LocalStorage with seed data if not present
function initializeStore() {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMPETITIONS)) {
    localStorage.setItem(STORAGE_KEYS.COMPETITIONS, JSON.stringify(INITIAL_COMPETITIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.REGISTRATIONS)) {
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(INITIAL_REGISTRATIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    // Start logged out — users must authenticate first
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(null));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CONTACT_MSGS)) {
    localStorage.setItem(STORAGE_KEYS.CONTACT_MSGS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.EVENT_SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.EVENT_SETTINGS, JSON.stringify(DEFAULT_EVENT_SETTINGS));
  }
}

initializeStore();

export function enforceRootAdminInvariant(rawList: User[]): User[] {
  let list: User[] = Array.isArray(rawList) && rawList.length > 0 ? [...rawList] : [...INITIAL_USERS];

  // Invariant: There MUST ALWAYS be exactly ONE Root Admin at any given time.
  let rootFound = false;

  // First pass: keep at most one existing root admin
  list = list.map(u => {
    if (u.role === 'ADMIN' && u.isRootAdmin) {
      if (!rootFound) {
        rootFound = true;
        return { ...u, isRootAdmin: true };
      } else {
        return { ...u, isRootAdmin: false };
      }
    }
    if (u.isRootAdmin && u.role !== 'ADMIN') {
      return { ...u, isRootAdmin: false };
    }
    return u;
  });

  // If no root admin was found, assign root status to user-admin-1 or the first ADMIN
  if (!rootFound) {
    let designated = false;
    list = list.map(u => {
      if (!designated && (u.id === 'user-admin-1' || u.role === 'ADMIN')) {
        designated = true;
        return { ...u, role: 'ADMIN' as Role, isRootAdmin: true };
      }
      return u;
    });

    // If still no admin exists, inject default root admin
    if (!designated) {
      list.unshift({ ...INITIAL_USERS[0], role: 'ADMIN', isRootAdmin: true });
    }
  }

  return list;
}

export function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    let list: User[] = raw ? JSON.parse(raw) : INITIAL_USERS;
    const verified = enforceRootAdminInvariant(list);
    return verified;
  } catch {
    return enforceRootAdminInvariant(INITIAL_USERS);
  }
}

export function getStoredCompetitions(): Competition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMPETITIONS);
    return raw ? JSON.parse(raw) : INITIAL_COMPETITIONS;
  } catch {
    return INITIAL_COMPETITIONS;
  }
}

export function getStoredRegistrations(): Registration[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
    return raw ? JSON.parse(raw) : INITIAL_REGISTRATIONS;
  } catch {
    return INITIAL_REGISTRATIONS;
  }
}

export function getStoredCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    const parsed: User = JSON.parse(raw);
    if (!parsed || !parsed.id || !parsed.email) return null;

    // Validate against local users database
    const users = getStoredUsers();
    const verified = users.find(u => u.id === parsed.id || u.email.toLowerCase().trim() === parsed.email.toLowerCase().trim());
    if (verified) {
      return verified;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveCurrentUser(user: User | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
  window.dispatchEvent(new Event('spec_auth_change'));
}

export function saveUsers(users: User[]) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  window.dispatchEvent(new Event('spec_users_change'));
}

export function saveCompetitions(comps: Competition[]) {
  localStorage.setItem(STORAGE_KEYS.COMPETITIONS, JSON.stringify(comps));
  window.dispatchEvent(new Event('spec_competitions_change'));
}

export function saveRegistrations(regs: Registration[]) {
  localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(regs));
  window.dispatchEvent(new Event('spec_registrations_change'));
}

export function getStoredCategories(): CategoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return raw ? JSON.parse(raw) : INITIAL_CATEGORIES;
  } catch {
    return INITIAL_CATEGORIES;
  }
}

export function saveCategories(cats: CategoryItem[]) {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
  window.dispatchEvent(new Event('spec_categories_change'));
}

export function getStoredEventSettings(): EventSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENT_SETTINGS);
    return raw ? JSON.parse(raw) : DEFAULT_EVENT_SETTINGS;
  } catch {
    return DEFAULT_EVENT_SETTINGS;
  }
}

export function saveEventSettings(settings: EventSettings) {
  localStorage.setItem(STORAGE_KEYS.EVENT_SETTINGS, JSON.stringify(settings));
  window.dispatchEvent(new Event('spec_event_settings_change'));
}

export function useEventSettings() {
  const [eventSettings, setEventSettings] = useState<EventSettings>(getStoredEventSettings);

  useEffect(() => {
    let isMounted = true;

    const fetchLiveSettings = async () => {
      if (supabase && isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('event_settings')
            .select('*')
            .eq('id', 'current')
            .single();

          if (!error && data && isMounted) {
            const mapped: EventSettings = {
              registrationPhase: data.registration_phase as RegistrationPhase,
              eventDate: data.event_date || '2026-04-15',
              registrationStartDate: data.registration_start_date || '2026-03-01',
              registrationEndDate: data.registration_end_date || '2026-04-10',
              competitionDates: data.competition_dates || '15–16 April 2026',
              updatedAt: data.updated_at || new Date().toISOString()
            };
            saveEventSettings(mapped);
            setEventSettings(mapped);
          }
        } catch (err) {
          console.warn('Could not fetch live event_settings from Supabase:', err);
        }
      }
    };

    fetchLiveSettings();

    const handleSettingsChange = () => {
      setEventSettings(getStoredEventSettings());
    };
    window.addEventListener('spec_event_settings_change', handleSettingsChange);

    // Poll every 8s so all devices stay dynamically synced
    const interval = setInterval(fetchLiveSettings, 8000);

    return () => {
      isMounted = false;
      window.removeEventListener('spec_event_settings_change', handleSettingsChange);
      clearInterval(interval);
    };
  }, []);

  const updateEventSettings = async (updates: Partial<EventSettings>): Promise<{ success: boolean; error?: string }> => {
    const current = getStoredEventSettings();
    const updated: EventSettings = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    saveEventSettings(updated);
    setEventSettings(updated);

    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('event_settings')
          .upsert({
            id: 'current',
            registration_phase: updated.registrationPhase,
            event_date: updated.eventDate,
            registration_start_date: updated.registrationStartDate,
            registration_end_date: updated.registrationEndDate,
            competition_dates: updated.competitionDates,
            updated_at: updated.updatedAt
          });
        if (error) {
          console.error('Supabase event_settings update error:', error.message);
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        console.error('Supabase event_settings update error:', err?.message);
        return { success: false, error: err?.message || 'Database update failed' };
      }
    }
    return { success: true };
  };

  const setRegistrationPhase = async (phase: RegistrationPhase) => {
    await updateEventSettings({ registrationPhase: phase });
  };

  return { eventSettings, updateEventSettings, setRegistrationPhase };
}

export function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return 'Date to be announced';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export async function saveContactMessage(msg: Omit<ContactMessage, 'id' | 'createdAt' | 'status'>) {
  const localId = 'msg-' + Date.now();
  const newMsg: ContactMessage = {
    ...msg,
    id: localId,
    createdAt: new Date().toISOString(),
    status: 'NEW'
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONTACT_MSGS);
    const msgs: ContactMessage[] = raw ? JSON.parse(raw) : [];
    msgs.unshift(newMsg);
    localStorage.setItem(STORAGE_KEYS.CONTACT_MSGS, JSON.stringify(msgs));
    window.dispatchEvent(new Event('spec_contact_msgs_change'));
  } catch {}

  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .insert({
          full_name: msg.fullName,
          email_address: msg.emailAddress,
          subject_category: msg.subjectCategory,
          message_body: msg.messageBody,
          status: 'NEW'
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase contact_messages error:', error.message);
      } else if (data) {
        newMsg.id = data.id;
      }
    } catch (err: any) {
      console.error('Supabase contact_messages exception:', err?.message);
    }
  }

  return newMsg;
}

// React Hooks for state synchronization across components
export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredCurrentUser);

  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(getStoredCurrentUser());
    };
    window.addEventListener('spec_auth_change', handleAuthChange);

    // Supabase Auth listener
    let authListenerSubscription: { unsubscribe: () => void } | null = null;
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const appUser = mapSupabaseUserToAppUser(session.user);
          saveCurrentUser(appUser);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          if (typeof window !== 'undefined') {
            window.location.hash = 'reset-password';
          }
        }
        if (session?.user) {
          const appUser = mapSupabaseUserToAppUser(session.user);
          saveCurrentUser(appUser);
        }
      });
      authListenerSubscription = subscription;
    }

    return () => {
      window.removeEventListener('spec_auth_change', handleAuthChange);
      authListenerSubscription?.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async (): Promise<{ success: boolean; isMock?: boolean; error?: string }> => {
    const result = await signInWithGoogleOAuth();
    if (!result.success) {
      return { success: false, error: result.error };
    }
    if (result.url) {
      window.location.href = result.url;
      return { success: true };
    }
    return { success: true, isMock: result.isMock };
  };

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail) {
      return { success: false, error: 'Email address is required.' };
    }

    let found: User | undefined;

    // Check central database first
    if (supabase && isSupabaseConfigured) {
      try {
        const { data: dbRow, error } = await supabase
          .from('app_users')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (!error && dbRow) {
          found = {
            id: dbRow.id,
            name: dbRow.name,
            email: dbRow.email,
            password: dbRow.password,
            role: (dbRow.role || 'USER').toUpperCase() as Role,
            isRootAdmin: Boolean(dbRow.is_root_admin),
            university: dbRow.university,
            department: dbRow.department,
            studentId: dbRow.student_id,
            phoneNumber: dbRow.phone_number,
            createdAt: dbRow.created_at || new Date().toISOString()
          };

          // Synchronize this fresh database record into local cache
          const currentLocal = getStoredUsers();
          const hasUser = currentLocal.some(u => u.id === found!.id || u.email.toLowerCase() === cleanEmail);
          const merged = hasUser
            ? currentLocal.map(u => (u.id === found!.id || u.email.toLowerCase() === cleanEmail) ? found! : u)
            : [...currentLocal, found];
          saveUsers(enforceRootAdminInvariant(merged));
        }
      } catch (err) {
        console.warn('Supabase login check note:', err);
      }
    }

    // Fall back to local users store if Supabase is offline or user was not in DB
    if (!found) {
      const users = getStoredUsers();
      found = users.find(u => u.email.toLowerCase().trim() === cleanEmail);
    }

    if (found) {
      if (found.role === 'ADMIN') {
        const expectedPwd = found.password || 'admin123';
        if (cleanPassword !== expectedPwd) {
          return { success: false, error: 'Incorrect administrator password.' };
        }
      } else if (found.password && cleanPassword && found.password !== cleanPassword) {
        return { success: false, error: 'Incorrect password. Please verify your credentials.' };
      }
      saveCurrentUser(found);
      return { success: true, user: found };
    }

    return { success: false, error: 'Account not found. Please check your email or create an account.' };
  };

  const signup = async (data: {
    name: string;
    email: string;
    password?: string;
    university?: string;
    department?: string;
    studentId?: string;
    phoneNumber?: string;
  }): Promise<{ success: boolean; error?: string; user?: User }> => {
    const cleanEmail = data.email.toLowerCase().trim();
    if (!cleanEmail) {
      return { success: false, error: 'Email address is required.' };
    }
    if (!data.name?.trim()) {
      return { success: false, error: 'Full name is required.' };
    }

    // Check central database for duplicate email
    if (supabase && isSupabaseConfigured) {
      try {
        const { data: dbUser } = await supabase
          .from('app_users')
          .select('id')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (dbUser) {
          return { success: false, error: 'An account with this email address already exists. Please log in.' };
        }
      } catch (err) {
        console.warn('Supabase signup duplicate check note:', err);
      }
    }

    const users = getStoredUsers();
    const existing = users.find(u => u.email.toLowerCase().trim() === cleanEmail);
    if (existing) {
      return { success: false, error: 'An account with this email address already exists. Please log in.' };
    }

    const newUser: User = {
      id: 'user-' + Date.now(),
      name: data.name.trim(),
      email: cleanEmail,
      password: data.password?.trim() || 'user123',
      role: 'USER',
      isRootAdmin: false,
      university: data.university || 'NED University of Engineering & Technology',
      department: data.department || 'Electronic Engineering',
      studentId: data.studentId || 'ES-' + Math.floor(100 + Math.random() * 900) + '/2023',
      phoneNumber: data.phoneNumber || '+92 300 1234567',
      createdAt: new Date().toISOString()
    };

    // Insert user into central database
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from('app_users').insert({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          role: 'USER',
          is_root_admin: false,
          university: newUser.university,
          department: newUser.department,
          student_id: newUser.studentId,
          phone_number: newUser.phoneNumber,
          created_at: newUser.createdAt,
          updated_at: newUser.createdAt
        });
      } catch (err: any) {
        console.warn('Supabase signup insert error:', err?.message);
      }
    }

    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);
    saveCurrentUser(newUser);
    return { success: true, user: newUser };
  };

  const loginOrSignupGoogleUser = async (userData: {
    name: string;
    email: string;
    university?: string;
    department?: string;
    studentId?: string;
    phoneNumber?: string;
  }): Promise<{ success: boolean; user: User }> => {
    const cleanEmail = userData.email.toLowerCase().trim();
    let userToUse: User | null = null;

    if (supabase && isSupabaseConfigured) {
      try {
        const { data: dbRow } = await supabase
          .from('app_users')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (dbRow) {
          userToUse = {
            id: dbRow.id,
            name: dbRow.name,
            email: dbRow.email,
            password: dbRow.password,
            role: (dbRow.role || 'USER').toUpperCase() as Role,
            isRootAdmin: Boolean(dbRow.is_root_admin),
            university: dbRow.university,
            department: dbRow.department,
            studentId: dbRow.student_id,
            phoneNumber: dbRow.phone_number,
            createdAt: dbRow.created_at || new Date().toISOString()
          };
        }
      } catch (err) {
        console.warn('Supabase Google auth check note:', err);
      }
    }

    if (!userToUse) {
      const users = getStoredUsers();
      const existing = users.find(u => u.email.toLowerCase().trim() === cleanEmail);
      if (existing) {
        userToUse = existing;
      } else {
        userToUse = {
          id: 'user-' + Date.now(),
          name: userData.name.trim(),
          email: cleanEmail,
          role: 'USER',
          isRootAdmin: false,
          university: userData.university || 'NED University of Engineering & Technology',
          department: userData.department || 'Electronic Engineering',
          studentId: userData.studentId || 'STU-' + Math.floor(1000 + Math.random() * 9000),
          phoneNumber: userData.phoneNumber || '+92 300 1234567',
          createdAt: new Date().toISOString()
        };

        if (supabase && isSupabaseConfigured) {
          try {
            await supabase.from('app_users').insert({
              id: userToUse.id,
              name: userToUse.name,
              email: userToUse.email,
              password: 'user123',
              role: 'USER',
              is_root_admin: false,
              university: userToUse.university,
              department: userToUse.department,
              student_id: userToUse.studentId,
              phone_number: userToUse.phoneNumber,
              created_at: userToUse.createdAt,
              updated_at: userToUse.createdAt
            });
          } catch (err: any) {
            console.warn('Supabase Google user insert note:', err?.message);
          }
        }
      }
    }

    const localUsers = getStoredUsers();
    const updatedUsers = localUsers.some(u => u.id === userToUse!.id)
      ? localUsers.map(u => u.id === userToUse!.id ? userToUse! : u)
      : [...localUsers, userToUse];
    saveUsers(updatedUsers);
    saveCurrentUser(userToUse);
    return { success: true, user: userToUse };
  };

  const logout = () => {
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    saveCurrentUser(null);
  };


  const requestPasswordReset = async (email: string): Promise<{
    success: boolean;
    error?: string;
    resetLink?: string;
    isSupabase?: boolean;
  }> => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your account email address.' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const users = getStoredUsers();
    const userFound = users.some(u => u.email.toLowerCase().trim() === cleanEmail);

    let sentViaSupabase = false;
    if (supabase && isSupabaseConfigured) {
      try {
        const redirectUrl = `${window.location.origin}/#reset-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: redirectUrl,
        });
        if (!error) {
          sentViaSupabase = true;
        } else {
          console.warn('Supabase resetPasswordForEmail notice:', error.message);
        }
      } catch (err: any) {
        console.warn('Supabase password reset call failed:', err);
      }
    }

    if (!userFound && !sentViaSupabase && !isSupabaseConfigured) {
      return {
        success: false,
        error: 'No registered account found with this email address. Please check spelling or create an account.'
      };
    }

    // Generate local recovery token for instant verification & demo/standalone testing
    const token = 'rst_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const existingRaw = localStorage.getItem(STORAGE_KEYS.PASSWORD_RESETS);
    const list: PasswordResetItem[] = existingRaw ? JSON.parse(existingRaw) : [];
    const now = Date.now();
    const active = list.filter(item => item.expiresAt > now && item.email !== cleanEmail);
    active.push({
      token,
      email: cleanEmail,
      expiresAt: now + 3600 * 1000, // 1 hour validity
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEYS.PASSWORD_RESETS, JSON.stringify(active));

    // Security: In production, never leak the reset token to the unauthenticated caller
    if (import.meta.env.DEV) {
      console.info(`[Dev/Local Only] Password reset link for ${cleanEmail}: ${window.location.origin}/#reset-password?email=${encodeURIComponent(cleanEmail)}&token=${token}`);
    }

    return {
      success: true,
      isSupabase: sentViaSupabase
    };
  };

  const verifyResetToken = (email: string, token: string): boolean => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanToken = token.trim();
    if (!cleanEmail || !cleanToken) return false;

    const existingRaw = localStorage.getItem(STORAGE_KEYS.PASSWORD_RESETS);
    if (!existingRaw) return false;
    try {
      const list: PasswordResetItem[] = JSON.parse(existingRaw);
      const now = Date.now();
      return list.some(item => item.email === cleanEmail && item.token === cleanToken && item.expiresAt > now);
    } catch {
      return false;
    }
  };

  const completePasswordReset = async (
    email: string,
    newPassword: string,
    token?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = newPassword.trim();

    if (!cleanPassword || cleanPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters in length.' };
    }

    // If token is provided, verify it (unless active Supabase session)
    if (token) {
      const isValid = verifyResetToken(cleanEmail, token);
      if (!isValid) {
        const session = supabase ? (await supabase.auth.getSession()).data.session : null;
        if (!session) {
          return { success: false, error: 'This password reset link is invalid or has expired. Please request a new link.' };
        }
      }
    }

    // Update via Supabase if configured & active
    if (supabase) {
      try {
        const { error } = await supabase.auth.updateUser({ password: cleanPassword });
        if (error) {
          console.warn('Supabase updateUser password notice:', error.message);
        }
      } catch (err: any) {
        console.warn('Supabase password update error:', err);
      }
    }

    if (supabase && isSupabaseConfigured) {
      try {
        await supabase
          .from('app_users')
          .update({
            password: cleanPassword,
            updated_at: new Date().toISOString()
          })
          .ilike('email', cleanEmail);
      } catch (err: any) {
        console.warn('Supabase app_users password update error:', err?.message);
      }
    }

    // Update in local users store
    const list = getStoredUsers();
    let updated: User[];
    const exists = list.some(u => u.email.toLowerCase().trim() === cleanEmail);

    if (exists) {
      updated = list.map(u => u.email.toLowerCase().trim() === cleanEmail ? { ...u, password: cleanPassword } : u);
    } else {
      updated = list;
    }
    saveUsers(updated);

    // Update current session if the same user is logged in
    const current = getStoredCurrentUser();
    if (current && current.email.toLowerCase().trim() === cleanEmail) {
      saveCurrentUser({ ...current, password: cleanPassword });
    }

    // Invalidate the reset token
    try {
      const existingRaw = localStorage.getItem(STORAGE_KEYS.PASSWORD_RESETS);
      if (existingRaw) {
        const list: PasswordResetItem[] = JSON.parse(existingRaw);
        const remaining = list.filter(item => item.email !== cleanEmail);
        localStorage.setItem(STORAGE_KEYS.PASSWORD_RESETS, JSON.stringify(remaining));
      }
    } catch {}

    return { success: true };
  };

  return {
    currentUser,
    login,
    signup,
    logout,
    loginWithGoogle,
    loginOrSignupGoogleUser,
    requestPasswordReset,
    verifyResetToken,
    completePasswordReset
  };
}

export function useCompetitions() {
  const [competitions, setCompetitions] = useState<Competition[]>(getStoredCompetitions);

  useEffect(() => {
    let isMounted = true;

    const fetchLiveCompetitions = async () => {
      if (supabase && isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('competitions')
            .select('*')
            .order('track_number', { ascending: true });

          if (!error && data && data.length > 0 && isMounted) {
            const mapped: Competition[] = data.map((row: any) => ({
              id: row.id,
              slug: row.slug,
              orderNum: parseInt(row.track_number, 10) || 1,
              title: row.title,
              category: row.category?.toUpperCase(),
              description: row.description,
              format: row.format,
              minMembers: row.min_members,
              maxMembers: row.max_members,
              soloFee: Number(row.solo_fee || 0),
              teamFee: Number(row.team_fee || 0),
              keyDeliverables: row.rules_summary,
              specsSummary: row.rules_summary,
              isActive: row.is_active,
              createdAt: row.created_at,
              updatedAt: row.updated_at
            }));
            saveCompetitions(mapped);
            setCompetitions(mapped);
          }
        } catch (err) {
          console.warn('Could not fetch competitions from Supabase:', err);
        }
      }
    };

    fetchLiveCompetitions();

    const handleCompChange = () => {
      setCompetitions(getStoredCompetitions());
    };
    window.addEventListener('spec_competitions_change', handleCompChange);
    return () => {
      isMounted = false;
      window.removeEventListener('spec_competitions_change', handleCompChange);
    };
  }, []);

  const addCompetition = async (data: Omit<Competition, 'id' | 'orderNum'>) => {
    const list = getStoredCompetitions();
    const newComp: Competition = {
      ...data,
      id: 'comp-' + Date.now(),
      orderNum: list.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [...list, newComp];
    saveCompetitions(updated);
    setCompetitions(updated);

    if (supabase && isSupabaseConfigured) {
      try {
        const { data: inserted } = await supabase.from('competitions').insert({
          slug: data.slug,
          track_number: newComp.orderNum,
          title: data.title,
          category: data.category.toUpperCase(),
          description: data.description,
          format: data.format,
          min_members: data.minMembers,
          max_members: data.maxMembers,
          solo_fee: data.soloFee,
          team_fee: data.teamFee,
          rules_summary: data.keyDeliverables || data.specsSummary || '',
          is_active: data.isActive
        }).select().single();
        if (inserted?.id) {
          newComp.id = inserted.id;
        }
      } catch (err) {
        console.error('Failed to insert competition into Supabase:', err);
      }
    }
    return newComp;
  };

  const updateCompetition = async (id: string, data: Partial<Competition>) => {
    const list = getStoredCompetitions();
    const updated = list.map(c => c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c);
    saveCompetitions(updated);
    setCompetitions(updated);

    if (supabase && isSupabaseConfigured) {
      try {
        const payload: any = { updated_at: new Date().toISOString() };
        if (data.title !== undefined) payload.title = data.title;
        if (data.category !== undefined) payload.category = data.category.toUpperCase();
        if (data.description !== undefined) payload.description = data.description;
        if (data.format !== undefined) payload.format = data.format;
        if (data.minMembers !== undefined) payload.min_members = data.minMembers;
        if (data.maxMembers !== undefined) payload.max_members = data.maxMembers;
        if (data.soloFee !== undefined) payload.solo_fee = data.soloFee;
        if (data.teamFee !== undefined) payload.team_fee = data.teamFee;
        if (data.isActive !== undefined) payload.is_active = data.isActive;
        if (data.keyDeliverables !== undefined) payload.rules_summary = data.keyDeliverables;

        await supabase.from('competitions').update(payload).or(`id.eq.${id},slug.eq.${id}`);
      } catch (err) {
        console.error('Failed to update competition in Supabase:', err);
      }
    }
  };

  const deleteCompetition = async (id: string) => {
    const list = getStoredCompetitions();
    const updated = list.filter(c => c.id !== id);
    saveCompetitions(updated);
    setCompetitions(updated);

    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from('competitions').delete().or(`id.eq.${id},slug.eq.${id}`);
      } catch (err) {
        console.error('Failed to delete competition from Supabase:', err);
      }
    }
  };

  const resetToDefault = () => {
    saveCompetitions(INITIAL_COMPETITIONS);
  };

  return { competitions, addCompetition, updateCompetition, deleteCompetition, resetToDefault };
}

export function useCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>(getStoredCategories);

  useEffect(() => {
    let isMounted = true;

    const fetchLiveCategories = async () => {
      if (supabase && isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('order_num', { ascending: true });

          if (!error && data && data.length > 0 && isMounted) {
            const mapped: CategoryItem[] = data.map((row: any) => ({
              id: row.id,
              slug: row.slug,
              name: row.name,
              description: row.description || '',
              icon: row.icon || 'category',
              orderNum: row.order_num || 1,
              createdAt: row.created_at
            }));
            saveCategories(mapped);
            setCategories(mapped);
          }
        } catch (err) {
          console.warn('Could not fetch categories from Supabase:', err);
        }
      }
    };

    fetchLiveCategories();

    const handleCategoriesChange = () => {
      setCategories(getStoredCategories());
    };
    window.addEventListener('spec_categories_change', handleCategoriesChange);
    return () => {
      isMounted = false;
      window.removeEventListener('spec_categories_change', handleCategoriesChange);
    };
  }, []);

  const addCategory = async (data: {
    name: string;
    slug?: string;
    description?: string;
    icon?: string;
  }): Promise<{ success: boolean; category?: CategoryItem; error?: string }> => {
    const cleanName = data.name.trim();
    if (!cleanName) {
      return { success: false, error: 'Category name is required.' };
    }

    let slug = (data.slug || cleanName)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    if (!slug) {
      slug = 'CAT_' + Date.now().toString(36).toUpperCase();
    }

    const list = getStoredCategories();
    if (list.some(c => c.slug.toUpperCase() === slug.toUpperCase())) {
      return { success: false, error: `A category with identifier "${slug}" already exists.` };
    }

    const newCat: CategoryItem = {
      id: 'cat-' + Date.now(),
      slug,
      name: cleanName,
      description: data.description?.trim() || '',
      icon: data.icon?.trim() || 'category',
      orderNum: list.length + 1,
      createdAt: new Date().toISOString()
    };

    const updated = [...list, newCat];
    saveCategories(updated);
    setCategories(updated);

    if (supabase && isSupabaseConfigured) {
      try {
        const { data: inserted } = await supabase.from('categories').insert({
          slug,
          name: cleanName,
          description: newCat.description,
          icon: newCat.icon,
          order_num: newCat.orderNum
        }).select().single();
        if (inserted?.id) {
          newCat.id = inserted.id;
        }
      } catch (err: any) {
        console.error('Supabase addCategory error:', err?.message);
      }
    }

    return { success: true, category: newCat };
  };

  const updateCategory = async (
    id: string,
    data: {
      name: string;
      slug?: string;
      description?: string;
      icon?: string;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    const list = getStoredCategories();
    const existing = list.find(c => c.id === id);
    if (!existing) {
      return { success: false, error: 'Category not found.' };
    }

    const cleanName = data.name.trim();
    if (!cleanName) {
      return { success: false, error: 'Category name is required.' };
    }

    let newSlug = (data.slug || cleanName)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    if (!newSlug) newSlug = existing.slug;

    if (newSlug.toUpperCase() !== existing.slug.toUpperCase() && list.some(c => c.id !== id && c.slug.toUpperCase() === newSlug.toUpperCase())) {
      return { success: false, error: `Another category with identifier "${newSlug}" already exists.` };
    }

    const oldSlug = existing.slug;

    const updatedList = list.map(c => {
      if (c.id === id) {
        return {
          ...c,
          name: cleanName,
          slug: newSlug,
          description: data.description !== undefined ? data.description.trim() : c.description,
          icon: data.icon !== undefined ? data.icon.trim() : c.icon,
        };
      }
      return c;
    });

    saveCategories(updatedList);
    setCategories(updatedList);

    // Cascade slug change to competitions
    if (newSlug.toUpperCase() !== oldSlug.toUpperCase()) {
      const comps = getStoredCompetitions();
      const updatedComps = comps.map(comp => {
        if (comp.category.toUpperCase() === oldSlug.toUpperCase()) {
          return { ...comp, category: newSlug };
        }
        return comp;
      });
      saveCompetitions(updatedComps);
    }

    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from('categories').update({
          name: cleanName,
          slug: newSlug,
          description: data.description !== undefined ? data.description.trim() : existing.description,
          icon: data.icon !== undefined ? data.icon.trim() : existing.icon,
        }).or(`id.eq.${id},slug.eq.${existing.slug}`);
      } catch (err: any) {
        console.error('Supabase updateCategory error:', err?.message);
      }
    }

    return { success: true };
  };

  const deleteCategory = async (
    id: string,
    reassignToSlug?: string
  ): Promise<{ success: boolean; error?: string; affectedCount?: number }> => {
    const list = getStoredCategories();
    const existing = list.find(c => c.id === id);
    if (!existing) {
      return { success: false, error: 'Category not found.' };
    }

    const comps = getStoredCompetitions();
    const affected = comps.filter(c => c.category.toUpperCase() === existing.slug.toUpperCase());

    if (affected.length > 0 && !reassignToSlug) {
      return {
        success: false,
        error: `Cannot remove "${existing.name}": ${affected.length} active competition track(s) are currently assigned to this category. Please reassign or delete those tracks first.`,
        affectedCount: affected.length
      };
    }

    if (affected.length > 0 && reassignToSlug) {
      const targetSlug = reassignToSlug.toUpperCase();
      const updatedComps = comps.map(c => {
        if (c.category.toUpperCase() === existing.slug.toUpperCase()) {
          return { ...c, category: targetSlug };
        }
        return c;
      });
      saveCompetitions(updatedComps);
    }

    const updatedList = list.filter(c => c.id !== id);
    saveCategories(updatedList);
    setCategories(updatedList);

    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from('categories').delete().or(`id.eq.${id},slug.eq.${existing.slug}`);
      } catch (err: any) {
        console.error('Supabase deleteCategory error:', err?.message);
      }
    }

    return { success: true, affectedCount: affected.length };
  };

  const resetCategoriesToDefault = () => {
    saveCategories(INITIAL_CATEGORIES);
  };

  return {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    resetCategoriesToDefault
  };
}

export function useRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>(getStoredRegistrations);

  useEffect(() => {
    let isMounted = true;

    const fetchLiveRegistrations = async () => {
      if (supabase && isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('registrations')
            .select(`
              *,
              team_members (
                id,
                member_number,
                full_name,
                student_id,
                email
              )
            `)
            .order('created_at', { ascending: false });

          if (!error && data && isMounted) {
            const comps = getStoredCompetitions();
            const formatted: Registration[] = data.map((row: any) => {
              const comp = comps.find(c => c.id === row.competition_id || c.slug === row.competition_id);
              return {
                id: row.id,
                registrationId: row.registration_id || `SPEC26-NED-${row.id.slice(0, 5)}`,
                userId: row.user_id,
                competitionId: row.competition_id,
                competitionTitle: comp?.title || 'Competition Track',
                competitionCategory: comp?.category?.toUpperCase(),
                participationModel: row.participation_model === 'team' ? 'TEAM' : 'SOLO',
                teamName: row.team_name,
                fullName: row.leader_name,
                studentId: row.leader_student_id,
                universityName: row.university,
                department: row.department,
                academicYear: row.academic_year,
                phoneNumber: row.phone,
                emailAddress: row.email,
                paymentChannel: row.payment_channel,
                transactionId: row.transaction_id,
                receiptUrl: row.receipt_url,
                receiptFileName: 'voucher.png',
                status: row.status?.toUpperCase() as RegStatus,
                calculatedFee: Number(row.calculated_fee || 0),
                notes: row.notes,
                createdAt: row.created_at,
                teamMembers: (row.team_members || []).map((tm: any) => ({
                  id: tm.id,
                  registrationId: row.id,
                  memberIndex: tm.member_number,
                  name: tm.full_name,
                  studentId: tm.student_id,
                  email: tm.email,
                })),
              };
            });
            saveRegistrations(formatted);
            setRegistrations(formatted);
          }
        } catch (err) {
          console.warn('Could not fetch registrations from Supabase:', err);
        }
      }
    };

    fetchLiveRegistrations();

    const handleRegChange = () => {
      setRegistrations(getStoredRegistrations());
    };
    window.addEventListener('spec_registrations_change', handleRegChange);

    // Poll every 8s so admin dashboard stays completely up to date with new submissions
    const interval = setInterval(fetchLiveRegistrations, 8000);

    return () => {
      isMounted = false;
      window.removeEventListener('spec_registrations_change', handleRegChange);
      clearInterval(interval);
    };
  }, []);

  const addRegistration = (data: Omit<Registration, 'id' | 'registrationId' | 'status' | 'createdAt'>) => {
    const list = getStoredRegistrations();
    const regNum = Math.floor(10000 + Math.random() * 90000);
    const newReg: Registration = {
      ...data,
      id: 'reg-' + Date.now(),
      registrationId: `SPEC26-NED-${regNum}`,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    const updated = [newReg, ...list];
    saveRegistrations(updated);
    setRegistrations(updated);
    return newReg;
  };

  const updateRegistrationStatus = async (id: string, status: RegStatus, notes?: string) => {
    const list = getStoredRegistrations();
    const updated = list.map(r => r.id === id ? { ...r, status, notes: notes ?? r.notes } : r);
    saveRegistrations(updated);
    setRegistrations(updated);

    if (supabase && isSupabaseConfigured) {
      try {
        await supabase
          .from('registrations')
          .update({
            status: status.toLowerCase(),
            notes: notes ?? undefined,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
      } catch (err: any) {
        console.error('Supabase updateRegistrationStatus error:', err?.message);
      }
    }
  };

  const deleteRegistration = async (id: string) => {
    const list = getStoredRegistrations();
    const updated = list.filter(r => r.id !== id);
    saveRegistrations(updated);
    setRegistrations(updated);

    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from('registrations').delete().eq('id', id);
      } catch (err: any) {
        console.error('Supabase deleteRegistration error:', err?.message);
      }
    }
  };

  return { registrations, addRegistration, updateRegistrationStatus, deleteRegistration };
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>(getStoredUsers);

  useEffect(() => {
    let isMounted = true;

    const fetchLiveUsers = async () => {
      if (supabase && isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('app_users')
            .select('*')
            .order('created_at', { ascending: true });

          if (!error && data && isMounted) {
            if (data.length === 0) {
              // Automatically seed the default Root Admin in Supabase so it's initialized!
              const defaultRoot = INITIAL_USERS[0];
              await supabase.from('app_users').upsert({
                id: defaultRoot.id,
                name: defaultRoot.name,
                email: defaultRoot.email.toLowerCase().trim(),
                password: defaultRoot.password,
                role: 'ADMIN',
                is_root_admin: true,
                university: defaultRoot.university,
                department: defaultRoot.department,
                student_id: defaultRoot.studentId,
                phone_number: defaultRoot.phoneNumber,
                created_at: defaultRoot.createdAt,
                updated_at: new Date().toISOString()
              }, { onConflict: 'email' });
            } else {
              const mapped: User[] = data.map((row: any) => ({
                id: row.id,
                name: row.name,
                email: row.email,
                password: row.password,
                role: (row.role || 'USER').toUpperCase() as Role,
                isRootAdmin: Boolean(row.is_root_admin),
                university: row.university || 'NED University of Engineering & Technology',
                department: row.department || 'Electronic Engineering',
                studentId: row.student_id,
                phoneNumber: row.phone_number,
                createdAt: row.created_at || new Date().toISOString()
              }));
              const verified = enforceRootAdminInvariant(mapped);
              saveUsers(verified);
              setUsers(verified);

              // Also sync current active session user with live DB
              const activeSession = getStoredCurrentUser();
              if (activeSession) {
                const freshMe = verified.find(u => u.id === activeSession.id || u.email.toLowerCase() === activeSession.email.toLowerCase());
                if (freshMe && (freshMe.role !== activeSession.role || freshMe.isRootAdmin !== activeSession.isRootAdmin || freshMe.name !== activeSession.name)) {
                  saveCurrentUser({
                    ...activeSession,
                    role: freshMe.role,
                    isRootAdmin: freshMe.isRootAdmin,
                    name: freshMe.name,
                    department: freshMe.department
                  });
                }
              }
            }
          }
        } catch (err: any) {
          console.warn('Could not fetch app_users from Supabase:', err?.message);
        }
      }
    };

    fetchLiveUsers();

    const handleUsersChange = () => {
      setUsers(getStoredUsers());
    };
    window.addEventListener('spec_users_change', handleUsersChange);

    // Poll every 5s so role assignments, password updates, and new signups sync in real time across sessions
    const interval = setInterval(fetchLiveUsers, 5000);

    return () => {
      isMounted = false;
      window.removeEventListener('spec_users_change', handleUsersChange);
      clearInterval(interval);
    };
  }, []);

  const updateUserRole = async (userId: string, newRole: Role): Promise<{ success: boolean; error?: string }> => {
    const list = getStoredUsers();
    const target = list.find(u => u.id === userId);
    if (!target) return { success: false, error: 'User not found.' };

    if (target.isRootAdmin && newRole !== 'ADMIN') {
      return { success: false, error: 'The Root Administrator cannot be demoted or revoked. Transfer Root Admin status first.' };
    }

    const updated = list.map(u => u.id === userId ? { ...u, role: newRole } : u);
    saveUsers(updated);
    setUsers(updated);

    const current = getStoredCurrentUser();
    if (current && current.id === userId) {
      saveCurrentUser({ ...current, role: newRole });
    }

    if (supabase && isSupabaseConfigured) {
      try {
        await supabase
          .from('app_users')
          .update({
            role: newRole,
            is_root_admin: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
      } catch (err: any) {
        console.error('Supabase updateUserRole error:', err?.message);
      }
    }
    return { success: true };
  };

  const addAdminUser = async (data: { name: string; email: string; password: string; department?: string; phoneNumber?: string }): Promise<User> => {
    const list = getStoredUsers();
    const cleanEmail = data.email.toLowerCase().trim();
    const existing = list.find(u => u.email.toLowerCase().trim() === cleanEmail);

    const targetUser: User = existing ? {
      ...existing,
      name: data.name.trim(),
      role: 'ADMIN' as Role,
      password: data.password.trim(),
      department: data.department || existing.department,
      phoneNumber: data.phoneNumber || existing.phoneNumber
    } : {
      id: 'admin-' + Date.now(),
      name: data.name.trim(),
      email: cleanEmail,
      password: data.password.trim(),
      role: 'ADMIN',
      isRootAdmin: false,
      university: 'NED University of Engineering & Technology',
      department: data.department || 'Department of Electronic Engineering',
      studentId: 'FAC-' + Math.floor(100 + Math.random() * 900),
      phoneNumber: data.phoneNumber || '+92 21 99261261',
      createdAt: new Date().toISOString()
    };

    const updated = existing
      ? list.map(u => u.id === existing.id ? targetUser : u)
      : [...list, targetUser];

    saveUsers(updated);
    setUsers(updated);

    if (supabase && isSupabaseConfigured) {
      try {
        await supabase
          .from('app_users')
          .upsert({
            id: targetUser.id,
            name: targetUser.name,
            email: targetUser.email,
            password: targetUser.password,
            role: 'ADMIN',
            is_root_admin: false,
            university: targetUser.university,
            department: targetUser.department,
            student_id: targetUser.studentId,
            phone_number: targetUser.phoneNumber,
            updated_at: new Date().toISOString()
          }, { onConflict: 'email' });
      } catch (err: any) {
        console.error('Supabase addAdminUser error:', err?.message);
      }
    }

    return targetUser;
  };

  const updateUserPassword = async (userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    const list = getStoredUsers();
    const cleanPass = newPassword.trim();
    if (!cleanPass || cleanPass.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }
    const updated = list.map(u => u.id === userId ? { ...u, password: cleanPass } : u);
    saveUsers(updated);
    setUsers(updated);

    const current = getStoredCurrentUser();
    if (current && current.id === userId) {
      saveCurrentUser({ ...current, password: cleanPass });
    }

    if (supabase && isSupabaseConfigured) {
      try {
        await supabase
          .from('app_users')
          .update({
            password: cleanPass,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
      } catch (err: any) {
        console.error('Supabase updateUserPassword error:', err?.message);
      }
    }
    return { success: true };
  };

  const updateUserPasswordByEmail = async (email: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    const list = getStoredUsers();
    const cleanEmail = email.toLowerCase().trim();
    const cleanPass = newPassword.trim();
    const target = list.find(u => u.email.toLowerCase().trim() === cleanEmail);
    if (!target) return { success: false, error: 'User not found.' };

    const updated = list.map(u => u.email.toLowerCase().trim() === cleanEmail ? { ...u, password: cleanPass } : u);
    saveUsers(updated);
    setUsers(updated);

    if (supabase && isSupabaseConfigured) {
      try {
        await supabase
          .from('app_users')
          .update({
            password: cleanPass,
            updated_at: new Date().toISOString()
          })
          .ilike('email', cleanEmail);
      } catch (err: any) {
        console.error('Supabase updateUserPasswordByEmail error:', err?.message);
      }
    }
    return { success: true };
  };

  const updateUserDetails = async (
    userId: string,
    data: {
      name?: string;
      email?: string;
      password?: string;
      department?: string;
      phoneNumber?: string;
      studentId?: string;
    },
    requesterId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const list = getStoredUsers();
    const existing = list.find(u => u.id === userId);
    if (!existing) return { success: false, error: 'User account not found.' };

    // Security check: Only the Root Admin can edit Root Admin profile/credentials
    if (existing.isRootAdmin && requesterId && requesterId !== existing.id) {
      return { success: false, error: 'Co-administrators are not permitted to alter Root Administrator credentials.' };
    }

    if (data.email) {
      const cleanEmail = data.email.toLowerCase().trim();
      const duplicate = list.find(u => u.id !== userId && u.email.toLowerCase().trim() === cleanEmail);
      if (duplicate) {
        return { success: false, error: 'Another user account is already using this email address.' };
      }
    }

    const updatedUser: User = {
      ...existing,
      name: data.name !== undefined && data.name.trim() ? data.name.trim() : existing.name,
      email: data.email !== undefined && data.email.trim() ? data.email.toLowerCase().trim() : existing.email,
      password: data.password !== undefined && data.password.trim() ? data.password.trim() : existing.password,
      department: data.department !== undefined ? data.department.trim() : existing.department,
      phoneNumber: data.phoneNumber !== undefined ? data.phoneNumber.trim() : existing.phoneNumber,
      studentId: data.studentId !== undefined ? data.studentId.trim() : existing.studentId,
    };

    const updated = list.map(u => u.id === userId ? updatedUser : u);
    saveUsers(updated);
    setUsers(updated);

    const current = getStoredCurrentUser();
    if (current && (current.id === userId || current.email.toLowerCase().trim() === existing.email.toLowerCase().trim())) {
      saveCurrentUser({
        ...current,
        name: updatedUser.name,
        email: updatedUser.email,
        password: updatedUser.password,
        department: updatedUser.department,
        phoneNumber: updatedUser.phoneNumber,
        studentId: updatedUser.studentId,
      });
    }

    if (supabase && isSupabaseConfigured) {
      try {
        await supabase
          .from('app_users')
          .update({
            name: updatedUser.name,
            email: updatedUser.email,
            password: updatedUser.password,
            department: updatedUser.department,
            phone_number: updatedUser.phoneNumber,
            student_id: updatedUser.studentId,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
      } catch (err: any) {
        console.error('Supabase updateUserDetails error:', err?.message);
      }
    }

    return { success: true };
  };

  const transferRootAdmin = async (
    newRootAdminId: string,
    currentRootAdminId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const list = getStoredUsers();
    const activeUser = getStoredCurrentUser();
    const callerId = currentRootAdminId || activeUser?.id;
    const currentRoot = (callerId ? list.find(u => u.id === callerId && u.isRootAdmin) : null) || list.find(u => u.isRootAdmin);
    if (!currentRoot) {
      return { success: false, error: 'Only the active Root Administrator has clearance to transfer Root Admin status.' };
    }

    const targetAdmin = list.find(u => u.id === newRootAdminId);
    if (!targetAdmin) {
      return { success: false, error: 'Target administrator account not found.' };
    }

    if (targetAdmin.role !== 'ADMIN') {
      return { success: false, error: 'Root status can only be transferred to an active administrator.' };
    }

    if (targetAdmin.id === currentRoot.id) {
      return { success: false, error: 'Account is already the active Root Administrator.' };
    }

    const updated = list.map(u => {
      if (u.id === targetAdmin.id) {
        return { ...u, role: 'ADMIN' as Role, isRootAdmin: true };
      }
      if (u.id === currentRoot.id) {
        return { ...u, isRootAdmin: false };
      }
      return { ...u, isRootAdmin: false };
    });

    saveUsers(updated);
    setUsers(updated);

    const active = getStoredCurrentUser();
    if (active) {
      if (active.id === currentRoot.id) {
        saveCurrentUser({ ...active, isRootAdmin: false });
      } else if (active.id === targetAdmin.id) {
        saveCurrentUser({ ...active, isRootAdmin: true });
      }
    }

    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from('app_users').update({
          is_root_admin: false,
          updated_at: new Date().toISOString()
        }).eq('id', currentRoot.id);

        await supabase.from('app_users').update({
          is_root_admin: true,
          role: 'ADMIN',
          updated_at: new Date().toISOString()
        }).eq('id', targetAdmin.id);
      } catch (err: any) {
        console.error('Supabase transferRootAdmin error:', err?.message);
      }
    }

    return { success: true };
  };

  const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    const list = getStoredUsers();
    const target = list.find(u => u.id === userId);
    if (!target) return { success: false, error: 'User not found.' };

    if (target.isRootAdmin) {
      return { success: false, error: 'The Root Administrator cannot be deleted under any circumstances.' };
    }

    const updated = list.filter(u => u.id !== userId);
    saveUsers(updated);
    setUsers(updated);

    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from('app_users').delete().eq('id', userId);
      } catch (err: any) {
        console.error('Supabase deleteUser error:', err?.message);
      }
    }
    return { success: true };
  };

  return { users, updateUserRole, addAdminUser, updateUserPassword, updateUserPasswordByEmail, updateUserDetails, transferRootAdmin, deleteUser };
}
