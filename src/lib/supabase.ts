import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing environment variables!');
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

// supabase-js >= 2.105.2: lockAcquireTimeout funciona correctamente.
// 2.106.0 incluye los fixes de orphaned navigator.locks (#2106) y el
// steal-retry path que recupera de un lock huerfano sin colgarse.
//
// Diagnostico previo: en 2.103.0 con React 19 + Vite, getSession() colgaba
// indefinidamente porque la cola pendingInLock nunca drenaba (issues #2013,
// #2344, #2376). Sin lockAcquireTimeout, no hay forma de que el cliente
// rompa el deadlock.
//
// timeout corto (3s) es agresivo a proposito: si un lock no se libera en
// 3s asumimos huerfano y disparamos steal-retry. Mejor recuperar rapido
// que esperar el default de 5s.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'enregla-auth-token',
    flowType: 'pkce',
    detectSessionInUrl: true,
    lockAcquireTimeout: 3000,
  },
});
