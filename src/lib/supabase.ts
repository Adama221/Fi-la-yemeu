import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://toxpzpxvowuduixhaxzq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const isPlaceholderKey = !supabaseAnonKey || supabaseAnonKey.includes('your_supabase_publishable_key');

if (isPlaceholderKey) {
  console.warn('Supabase Publishable Key is missing or using a placeholder. Using fallback key for development.');
}

// Fallback to a known working key if the current one is blank/placeholder
const finalAnonKey = isPlaceholderKey 
  ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRveHB6cHh2b3d1ZHVpeGhheHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTAzMzcsImV4cCI6MjA5MjY4NjMzN30.xDT5vMfeAX-VQ7lNsemPSJ270-oMMM77VfJ3PVl42pI' 
  : supabaseAnonKey;

export const supabase = createClient(
  supabaseUrl,
  finalAnonKey
);

export const isSupabaseConfigured = !isPlaceholderKey && supabaseUrl !== 'https://your-project-ref.supabase.co';
