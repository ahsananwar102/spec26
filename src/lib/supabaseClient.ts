import {
  supabase,
  isSupabaseReady,
  isSupabaseConfigured,
  configureCustomSupabase,
  clearCustomSupabase,
  signInWithGoogleOAuth,
  mapSupabaseUserToAppUser,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} from './supabase';

export {
  supabase,
  isSupabaseReady,
  isSupabaseConfigured,
  configureCustomSupabase,
  clearCustomSupabase,
  signInWithGoogleOAuth,
  mapSupabaseUserToAppUser,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
};

export default supabase;
