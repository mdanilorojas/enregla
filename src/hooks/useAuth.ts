import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { logout } from '@/lib/api/auth';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

// Global flag to ensure auth check only happens once
let authInitialized = false;
let authSubscription: any = null;
let initializationPromise: Promise<void> | null = null;

export function useAuth() {
  const { user, profile, loading, setAuth, clear } = useAuthStore();

  useEffect(() => {
    // If already initializing, wait for that to complete
    if (initializationPromise) {
      console.log('[useAuth] Waiting for existing initialization...');
      return;
    }

    // Only initialize auth once for the entire app
    if (authInitialized) {
      console.log('[useAuth] Already initialized, skipping');
      return;
    }

    authInitialized = true;
    console.log('[useAuth] First initialization - relying on auth state change events...');

    // Safety timeout: if loading doesn't resolve in 5s, force it off
    const safetyTimeout = setTimeout(() => {
      console.warn('[useAuth] Safety timeout triggered - forcing loading=false');
      setAuth(null, null);
      initializationPromise = null;
    }, 5000);

    // Create single initialization promise to prevent race conditions
    initializationPromise = (async () => {
      try {
        // Check initial session immediately
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[useAuth] getSession failed:', sessionError);
          clearTimeout(safetyTimeout);
          clear();
          return;
        }

        if (!session) {
          console.log('[useAuth] No initial session found');
          clearTimeout(safetyTimeout);
          clear();
          return;
        }

        // Load profile for existing session
        console.log('[useAuth] Initial session found, loading profile...');
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single<Profile>();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('[useAuth] Initial profile fetch error:', profileError);
          }

          console.log('[useAuth] Profile loaded:', profileData ? 'EXISTS' : 'NULL');
          clearTimeout(safetyTimeout);
          setAuth(session.user, profileData || null);
        } catch (error) {
          console.error('[useAuth] Initial profile fetch failed:', error);
          clearTimeout(safetyTimeout);
          setAuth(session.user, null);
        }
      } catch (error) {
        console.error('[useAuth] Initialization failed:', error);
        clearTimeout(safetyTimeout);
        clear();
      } finally {
        initializationPromise = null;
      }
    })();

    initializationPromise.catch(err => {
      console.error('[useAuth] Unhandled initialization error:', err);
    });

    // Listen for auth changes (only once)
    if (!authSubscription) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('[useAuth] Auth state changed:', event, session ? 'with session' : 'no session');

          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
            console.log('[useAuth] Auth event - user:', session.user.id);

            // Fetch profile BEFORE setting auth state to prevent redirect loops
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single<Profile>();

              console.log('[useAuth] Profile query result - Data:', profileData ? 'EXISTS' : 'NULL', 'Error:', profileError?.message || 'NONE');
              if (profileData) {
                console.log('[useAuth] Profile company_id:', profileData.company_id);
              }

              if (profileError && profileError.code !== 'PGRST116') {
                console.error('[useAuth] Profile fetch error:', profileError);
              }

              // Set auth with whatever we have (profile or null for new users)
              setAuth(session.user, profileData || null);
            } catch (error) {
              console.error('[useAuth] Profile fetch failed:', error);
              setAuth(session.user, null);
            }
          } else if (event === 'SIGNED_OUT') {
            clear();
          } else if (event === 'TOKEN_REFRESHED' && session) {
            // Don't reset profile on token refresh - just keep existing state
            console.log('[useAuth] Token refreshed, keeping existing profile');
          }
        }
      );
      authSubscription = subscription;
    }

    return () => {
      // Don't unsubscribe - keep it alive for the app lifetime
    };
  }, [setAuth, clear]);

  const signOut = async () => {
    await logout();
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
