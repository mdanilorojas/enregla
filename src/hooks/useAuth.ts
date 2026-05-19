import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { logout } from '@/lib/api/auth';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { DEMO_MODE, DEMO_USER_ID } from '@/lib/demo';
import type { Profile } from '@/types/database';

// Global flag to ensure auth check only happens once
let authInitialized = false;
// casting due to stale generated types — see audit follow-up
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let authSubscription: any = null;
let initializationPromise: Promise<void> | null = null;

export function useAuth() {
  const { user, profile, loading, setAuth, clear } = useAuthStore();

  useEffect(() => {
    // If already initializing, wait for that to complete
    if (initializationPromise) {
      // console.log('[useAuth] Waiting for existing initialization...');
      return;
    }

    // Only initialize auth once for the entire app
    if (authInitialized) {
      // console.log('[useAuth] Already initialized, skipping');
      return;
    }

    authInitialized = true;
    // console.log('[useAuth] First initialization - relying on auth state change events...');

    // Create single initialization promise to prevent race conditions
    initializationPromise = (async () => {
      try {
        // DEMO MODE: Create mock session without auth
        if (DEMO_MODE) {
          // console.log('[useAuth] DEMO MODE: Clearing any existing session and loading demo user...');

          try {
            // Clear any existing session first
            await supabase.auth.signOut({ scope: 'local' });

            // Load profile from database (RLS allows demo company access)
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', DEMO_USER_ID)
              .single<Profile>();

            if (profileError) {
              console.error('[useAuth] DEMO MODE: Profile fetch error:', profileError);
            }

            // console.log('[useAuth] DEMO MODE: Profile loaded:', profileData);

            // Create mock user object
            // casting due to stale generated types — see audit follow-up
            const mockUser = {
              id: DEMO_USER_ID,
              email: 'demo@enregla.ec',
              created_at: new Date().toISOString(),
              app_metadata: {},
              user_metadata: {},
              aud: 'authenticated',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any;

            setAuth(mockUser, profileData || null);
            // console.log('[useAuth] DEMO MODE: Auth set successfully');
          } catch (error) {
            console.error('[useAuth] DEMO MODE: Failed:', error);
            setAuth(null, null);
          }
          return;
        }

        // NORMAL MODE: initial session fetch.
        // Antes había un setTimeout(5000) que dejaba loading=false y reseteaba
        // la sesión en redes lentas, expulsando al user a /login. Ahora confiamos
        // en que getSession() resuelve o falla eventualmente; la UI muestra
        // AppLoader mientras tanto, y onAuthStateChange sincroniza después.
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            const msg = sessionError.message?.toLowerCase() ?? '';
            if (msg.includes('refresh token') || msg.includes('refresh_token')) {
              await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
            } else {
              console.error('[useAuth] getSession failed:', sessionError);
            }
            clear();
            return;
          }

          if (!session) {
            clear();
            return;
          }

          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single<Profile>();

            if (profileError && profileError.code !== 'PGRST116') {
              console.error('[useAuth] Initial profile fetch error:', profileError);
            }

            setAuth(session.user, profileData || null);
          } catch (error) {
            console.error('[useAuth] Initial profile fetch failed:', error);
            setAuth(session.user, null);
          }
        } catch (error) {
          console.error('[useAuth] Initialization failed:', error);
          clear();
        } finally {
          initializationPromise = null;
        }
      } catch (error) {
        console.error('[useAuth] Top-level initialization error:', error);
        initializationPromise = null;
      }
    })();

    initializationPromise.catch(err => {
      console.error('[useAuth] Unhandled initialization error:', err);
    });

    // Listen for auth changes (only once) - skip in demo mode
    if (!authSubscription && !DEMO_MODE) {
      // console.log('[useAuth] Setting up auth state listener (should happen once)');
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          // console.log('[useAuth] Auth state changed:', event, session ? 'with session' : 'no session');

          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
            // console.log('[useAuth] Auth event - user:', session.user.id);
            // console.log('[useAuth] About to fetch profile...');

            // Fetch profile BEFORE setting auth state to prevent redirect loops
            try {
              // console.log('[useAuth] Starting profile query...');
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single<Profile>();

              // console.log('[useAuth] Profile query completed');
              // console.log('[useAuth] Profile query result - Data:', profileData ? 'EXISTS' : 'NULL', 'Error:', profileError?.message || 'NONE');
              if (profileData) {
                // console.log('[useAuth] Profile company_id:', profileData.company_id);
              }

              if (profileError && profileError.code !== 'PGRST116') {
                console.error('[useAuth] Profile fetch error:', profileError);
              }

              // console.log('[useAuth] About to call setAuth...');
              // Set auth with whatever we have (profile or null for new users)
              setAuth(session.user, profileData || null);
              // console.log('[useAuth] setAuth completed');
            } catch (error) {
              console.error('[useAuth] Profile fetch failed:', error);
              setAuth(session.user, null);
            }
          } else if (event === 'SIGNED_OUT') {
            // Drop all cached React Query data so the next user cannot see the previous user's data
            queryClient.cancelQueries();
            queryClient.clear();
            clear();
          } else if (event === 'TOKEN_REFRESHED' && session) {
            // Don't reset profile on token refresh - just keep existing state
            // console.log('[useAuth] Token refreshed, keeping existing profile');
          } else {
            // console.log('[useAuth] Other event:', event);
          }
        }
      );
      authSubscription = subscription;
      // console.log('[useAuth] Auth listener setup complete');
    } else {
      // console.log('[useAuth] Auth listener already exists, skipping setup');
    }

    return () => {
      // Don't unsubscribe - keep it alive for the app lifetime
    };
  }, [setAuth, clear]);

  const signOut = async () => {
    await logout();
    // Drop all cached React Query data so a subsequent user cannot see this user's data
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
