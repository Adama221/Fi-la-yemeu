import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://toxpzpxvowuduixhaxzq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRveHB6cHh2b3d1ZHVpeGhheHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTAzMzcsImV4cCI6MjA5MjY4NjMzN30.xDT5vMfeAX-VQ7lNsemPSJ270-oMMM77VfJ3PVl42pI';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
