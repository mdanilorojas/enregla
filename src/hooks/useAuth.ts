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

    // NORMAL MODE
    //
    // Workaround para supabase-js issue #2344 (deadlock cuando
    // onAuthStateChange registra durante init con sesion cerca de expirar):
    // primero esperar a que getUser() resuelva (con lockAcquireTimeout=3000
    // se recupera de orphaned locks via steal-retry), DESPUES registrar el
    // listener. Sin esto, el listener se registra mientras initialize() aun
    // sostiene el lock, y los eventos quedan en cola sin drenar.
    void (async () => {
      try {
        const { data: { user: initialUser } } = await supabase.auth.getUser();

        if (initialUser) {
          // Set inmediatamente sin profile, fetch en background
          setAuth(initialUser, null);
          const profileData = await fetchProfile(initialUser.id);
          setAuth(initialUser, profileData);
        } else {
          clear();
        }
      } catch (err) {
        console.error('[useAuth] Initial getUser failed:', err);
        clear();
      }

      // Ahora registrar el listener. Cualquier cambio futuro (TOKEN_REFRESHED,
      // SIGNED_OUT, SIGNED_IN desde otra ruta) se propaga.
      if (authSubscription) return;

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_OUT') {
            queryClient.cancelQueries();
            queryClient.clear();
            clear();
            return;
          }

          if (event === 'TOKEN_REFRESHED') {
            // No re-fetch profile; conservar estado existente
            return;
          }

          if (event === 'SIGNED_IN' && session) {
            // Skip si ya tenemos el mismo user (initialUser via getUser arriba)
            const current = useAuthStore.getState().user;
            if (current?.id === session.user.id) return;

            setAuth(session.user, null);
            const profileData = await fetchProfile(session.user.id);
            setAuth(session.user, profileData);
          }
        }
      );
      authSubscription = subscription;
    })();
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
