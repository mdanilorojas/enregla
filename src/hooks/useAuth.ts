import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getCurrentUser } from '@/lib/api/auth';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const { user, profile, loading, setAuth, setLoading, clear } = useAuthStore();

  useEffect(() => {
    // In dev mode, skip Supabase validation if we already have a user (from dev login)
    if (import.meta.env.DEV && user) {
      setLoading(false);
      return;
    }

    // Check current session
    getCurrentUser()
      .then((data) => {
        if (data) {
          setAuth(data.user, data.profile);
        } else {
          clear();
        }
      })
      .catch(() => {
        clear();
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const userData = await getCurrentUser();
          if (userData) {
            setAuth(userData.user, userData.profile);
          }
        } else if (event === 'SIGNED_OUT') {
          clear();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setAuth, setLoading, clear, user]);

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    role: profile?.role,
    companyId: profile?.company_id,
  };
}
