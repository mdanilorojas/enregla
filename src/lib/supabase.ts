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

// Supabase GoTrue por default usa Web Locks API para sincronizar sesion
// entre multiples tabs del mismo origen. Pero tiene un bug bien documentado
// con React StrictMode: el doble-mount causa que dos instancias del cliente
// peleen el mismo lock, y el segundo aborta al primero con
// NavigatorLockAcquireTimeoutError "Lock was released because another request
// stole it". Eso rompe login en dev Y en produccion.
//
// Trade-off: perdemos sync fino cross-tab del refresh de sesion. En nuestra
// app (gestion admin de una empresa, raramente multi-tab) el trade-off vale
// la pena. Supabase ofrece este override explicitamente.
//
// Ref: https://github.com/supabase/auth-js/issues/762
const noopLock = async <R>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> => fn();

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'enregla-auth-token',
    lock: noopLock,
    flowType: 'pkce',
    detectSessionInUrl: true,
  },
});
