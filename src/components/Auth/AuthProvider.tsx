import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [loading, setLoading] = useState(true);
  const login = useAppStore((s) => s.login);
  const logout = useAppStore((s) => s.logout);
  const loadMockData = useAppStore((s) => s.loadMockData);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        login();
        // Load mock data when user is authenticated
        loadMockData();
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        login();
        // Load mock data when user logs in
        loadMockData();
      } else {
        logout();
      }
    });

    return () => subscription.unsubscribe();
  }, [login, logout, loadMockData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
