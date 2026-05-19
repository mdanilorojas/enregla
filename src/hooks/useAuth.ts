import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { logout } from '@/lib/api/auth';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { DEMO_MODE, DEMO_USER_ID } from '@/lib/demo';
import type { Profile } from '@/types/database';

let authInitialized = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let authSubscription: any = null;

async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle<Profile>();
    if (error && error.code !== 'PGRST116') {
      console.error('[useAuth] Profile fetch error:', error);
      return null;
    }
    return data ?? null;
  } catch (err) {
    console.error('[useAuth] Profile fetch threw:', err);
    return null;
  }
}

export function useAuth() {
  const { user, profile, loading, setAuth, clear } = useAuthStore();

  useEffect(() => {
    if (authInitialized) return;
    authInitialized = true;

    // DEMO MODE
    if (DEMO_MODE) {
      void (async () => {
        try {
          await supabase.auth.signOut({ scope: 'local' });
          const profileData = await fetchProfile(DEMO_USER_ID);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mockUser: any = {
            id: DEMO_USER_ID,
            email: 'demo@enregla.ec',
            created_at: new Date().toISOString(),
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
          };
          setAuth(mockUser, profileData);
        } catch (err) {
          console.error('[useAuth] DEMO MODE failed:', err);
          setAuth(null, null);
        }
      })();
      return;
    }

    // NORMAL MODE: confiar 100% en onAuthStateChange. Supabase emite
    // automaticamente INITIAL_SESSION al montar el listener. Sin getSession()
    // inicial que puede colgar el lock interno de gotrue.
    if (authSubscription) return;

    // Watchdog: si no llega INITIAL_SESSION en 5s, asumir no logueado
    const initWatchdog = setTimeout(() => {
      const state = useAuthStore.getState();
      if (state.loading) {
        console.warn('[useAuth] INITIAL_SESSION watchdog fired; clearing');
        clear();
      }
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        clearTimeout(initWatchdog);
        // En /auth/callback, AuthCallback es la unica autoridad
        const onAuthCallback = typeof window !== 'undefined' &&
          window.location.pathname.startsWith('/auth/callback');

        if (event === 'SIGNED_OUT') {
          queryClient.cancelQueries();
          queryClient.clear();
          clear();
          return;
        }

        if (event === 'TOKEN_REFRESHED' && session) {
          // No re-fetch profile; conservar estado existente
          return;
        }

        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
          if (onAuthCallback) {
            // AuthCallback hidratará tras navigate fuera de /auth/callback
            return;
          }
          // Set user inmediatamente (no esperar profile fetch)
          setAuth(session.user, null);
          // Fetch profile en background
          const profileData = await fetchProfile(session.user.id);
          setAuth(session.user, profileData);
          return;
        }

        if (event === 'INITIAL_SESSION' && !session) {
          clear();
          return;
        }
      }
    );
    authSubscription = subscription;
  }, [setAuth, clear]);

  const signOut = async () => {
    await logout();
    queryClient.cancelQueries();
    queryClient.clear();
    clear();
  };

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    role: profile?.role,
    companyId: profile?.company_id,
    signOut,
  };
}
