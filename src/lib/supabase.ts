import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// console.log('[Supabase] Initializing client...');
// console.log('[Supabase] URL:', supabaseUrl ? 'SET' : 'MISSING');
// console.log('[Supabase] Key:', supabaseAnonKey ? 'SET' : 'MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing environment variables!');
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

// console.log('[Supabase] Client created successfully');

// Create a single supabase client for interacting with your database.
// storageKey is namespaced to avoid collisions with other Supabase projects
// running on the same localhost origin (e.g. life-update in another port).
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'enregla-auth-token',
  },
});
