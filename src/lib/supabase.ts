import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing environment variables!');
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

// Web Locks API default. Antes usábamos noopLock como workaround del
// doble-mount de StrictMode, pero noopLock causaba deadlocks entre
// queries paralelos (proceedWithSession colgaba en refreshSession sin
// emitir 'done'). Ahora StrictMode está deshabilitado en main.tsx, así
// que ya no es necesario el override.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'enregla-auth-token',
    flowType: 'pkce',
    detectSessionInUrl: true,
  },
});
