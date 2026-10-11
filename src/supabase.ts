import { createClient } from '@supabase/supabase-js';

// Supabase credentials provided by user
const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};
export const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://jrkrcfkivpfuvxihkshr.supabase.co';
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_mAPgJ92ExbNV2KQ7I4rVWw_MG9fMU77';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});
