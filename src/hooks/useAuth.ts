import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { logout } from '@/lib/api/auth';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

// Global flag to ensure auth check only happens once
let authInitialized = false;
let authSubscription: any = null;
let initializationPromise: Promise<void> | null = null;

// Demo mode configuration
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const DEMO_USER_ID = '4bb8066b-0807-4eb7-81a8-29436b6875ea'; // demo@enregla.ec

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
        // DEMO MODE: Load demo user directly without auth
        if (DEMO_MODE) {
          console.log('[useAuth] DEMO MODE: Loading demo user profile...');

          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', DEMO_USER_ID)
              .single<Profile>();

            if (profileError) {
              console.error('[useAuth] DEMO MODE: Profile fetch error:', profileError);
              clearTimeout(safetyTimeout);
              setAuth(null, null);
              return;
            }

            console.log('[useAuth] DEMO MODE: Profile loaded:', profileData ? 'EXISTS' : 'NULL');

            // Create a mock user object for demo mode
            const mockUser = {
              id: DEMO_USER_ID,
              email: 'demo@enregla.ec',
              created_at: new Date().toISOString(),
              app_metadata: {},
              user_metadata: {},
              aud: 'authenticated',
            } as any;

            clearTimeout(safetyTimeout);
            setAuth(mockUser, profileData);
          } catch (error) {
            console.error('[useAuth] DEMO MODE: Failed:', error);
            clearTimeout(safetyTimeout);
            setAuth(null, null);
          }
          return;
        }

        // NORMAL MODE: Check initial session immediately
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
          console.log('[useAuth] Starting initial profile query...');
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single<Profile>();

          console.log('[useAuth] Initial profile query completed');
          if (profileError && profileError.code !== 'PGRST116') {
            console.error('[useAuth] Initial profile fetch error:', profileError);
          }

          console.log('[useAuth] Profile loaded:', profileData ? 'EXISTS' : 'NULL');
          clearTimeout(safetyTimeout);
          console.log('[useAuth] About to call setAuth (initial load)...');
          setAuth(session.user, profileData || null);
          console.log('[useAuth] setAuth completed (initial load)');
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
      console.log('[useAuth] Setting up auth state listener (should happen once)');
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('[useAuth] Auth state changed:', event, session ? 'with session' : 'no session');

          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
            console.log('[useAuth] Auth event - user:', session.user.id);
            console.log('[useAuth] About to fetch profile...');

            // Fetch profile BEFORE setting auth state to prevent redirect loops
            try {
              console.log('[useAuth] Starting profile query...');
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single<Profile>();

              console.log('[useAuth] Profile query completed');
              console.log('[useAuth] Profile query result - Data:', profileData ? 'EXISTS' : 'NULL', 'Error:', profileError?.message || 'NONE');
              if (profileData) {
                console.log('[useAuth] Profile company_id:', profileData.company_id);
              }

              if (profileError && profileError.code !== 'PGRST116') {
                console.error('[useAuth] Profile fetch error:', profileError);
              }

              console.log('[useAuth] About to call setAuth...');
              // Set auth with whatever we have (profile or null for new users)
              setAuth(session.user, profileData || null);
              console.log('[useAuth] setAuth completed');
            } catch (error) {
              console.error('[useAuth] Profile fetch failed:', error);
              setAuth(session.user, null);
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('[useAuth] Handling SIGNED_OUT event');
            clear();
          } else if (event === 'TOKEN_REFRESHED' && session) {
            // Don't reset profile on token refresh - just keep existing state
            console.log('[useAuth] Token refreshed, keeping existing profile');
          } else {
            console.log('[useAuth] Other event:', event);
          }
        }
      );
      authSubscription = subscription;
      console.log('[useAuth] Auth listener setup complete');
    } else {
      console.log('[useAuth] Auth listener already exists, skipping setup');
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
