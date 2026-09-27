import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';

const getEnvOrStoredUrl = (): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('spec26_supabase_url');
    if (stored) return stored.trim();
  }
  return ((import.meta as any).env?.VITE_SUPABASE_URL || (import.meta as any).env?.SUPABASE_URL || '').trim();
};

const getEnvOrStoredKey = (): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('spec26_supabase_anon_key');
    if (stored) return stored.trim();
  }
  return ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.SUPABASE_ANON_KEY || '').trim();
};

export const SUPABASE_URL = getEnvOrStoredUrl();
export const SUPABASE_ANON_KEY = getEnvOrStoredKey();

export const isSupabaseConfigured: boolean = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('your-project-id') &&
  !SUPABASE_URL.includes('placeholder-project') &&
  !SUPABASE_ANON_KEY.includes('your-anon-key') &&
  !SUPABASE_ANON_KEY.includes('placeholder-anon-key')
);

export const isSupabaseReady = isSupabaseConfigured;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function configureCustomSupabase(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('spec26_supabase_url', url.trim());
    localStorage.setItem('spec26_supabase_anon_key', key.trim());
    window.location.reload();
  }
}

export function clearCustomSupabase() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('spec26_supabase_url');
    localStorage.removeItem('spec26_supabase_anon_key');
    window.location.reload();
  }
}

/**
 * Initiates OAuth2 Google Sign-In with Supabase Auth
 */
export async function signInWithGoogleOAuth(): Promise<{
  success: boolean;
  url?: string;
  error?: string;
  isMock?: boolean;
}> {
  if (supabase) {
    try {
      const redirectUrl = window.location.origin;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.url) {
        return { success: true, url: data.url };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'OAuth initialization failed' };
    }
  }

  // If Supabase credentials are not yet injected, return isMock flag
  return { success: true, isMock: true };
}

/**
 * Formats a Supabase User object into our application User model
 */
export function mapSupabaseUserToAppUser(sbUser: SupabaseUser) {
  const metadata = sbUser.user_metadata || {};
  const fullName =
    metadata.full_name ||
    metadata.name ||
    sbUser.email?.split('@')[0].replace('.', ' ') ||
    'SPEC Participant';

  return {
    id: sbUser.id,
    name: fullName,
    email: sbUser.email || '',
    role: (metadata.role || (sbUser.email?.includes('admin') ? 'ADMIN' : 'USER')) as 'USER' | 'ADMIN',
    university: metadata.university || 'NED University of Engineering & Technology',
    studentId: metadata.student_id || 'STU-' + sbUser.id.slice(0, 4).toUpperCase(),
    department: metadata.department || 'Electronic Engineering',
    phoneNumber: metadata.phone || '+92 300 1234567',
    createdAt: sbUser.created_at || new Date().toISOString(),
  };
}
