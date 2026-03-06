import { createClient } from '@supabase/supabase-js';

// Prioritize environment variables, but fallback to the provided keys for immediate stability
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wmmniuzoyfglogunspmb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtbW5pdXpveWZnbG9ndW5zcG1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjcwOTcsImV4cCI6MjA4NzcwMzA5N30.DGvp2Ypv60RelK9apPa1Qg7Y3OFtOCywAftPu7KhFnU';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Log connection attempt (for debugging)
supabase.from('users').select('count', { count: 'exact', head: true })
  .then(({ error }) => {
    if (error) console.error('Supabase connection check failed:', error.message);
    else console.log('Supabase connection established successfully.');
  });
