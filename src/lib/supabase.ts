import { createClient } from '@supabase/supabase-js';

// Default to env vars or null
const envSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const envSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function getSupabaseClient(customUrl?: string, customKey?: string) {
  const url = customUrl || (typeof window !== 'undefined' ? localStorage.getItem('crm_supabase_url') || envSupabaseUrl : envSupabaseUrl);
  const key = customKey || (typeof window !== 'undefined' ? localStorage.getItem('crm_supabase_anon_key') || envSupabaseAnonKey : envSupabaseAnonKey);

  if (!url || !key) {
    return null;
  }

  try {
    return createClient(url, key);
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error);
    return null;
  }
}
