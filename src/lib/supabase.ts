import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tepsspmrqgvkzxzfbrcx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const isPlaceholderKey = !supabaseAnonKey || supabaseAnonKey.includes('your_supabase_publishable_key');

if (isPlaceholderKey) {
  console.warn('Supabase Publishable Key is missing or using a placeholder. Using fallback key for development.');
}

// Fallback to a known working key if the current one is blank/placeholder
// Supabase Project: https://tepsspmrqgvkzxzfbrcx.supabase.co
// Redirect URI for Google OAuth: https://tepsspmrqgvkzxzfbrcx.supabase.co/auth/v1/callback
const finalAnonKey = isPlaceholderKey 
  ? 'sb_publishable_UATQjEaVAPHfL-2K6FJTMQ_rAZbPGOj' 
  : supabaseAnonKey;

export const supabase = createClient(
  supabaseUrl,
  finalAnonKey
);

export const isSupabaseConfigured = !isPlaceholderKey && supabaseUrl !== 'https://your-project-ref.supabase.co';
