import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Database } from '@/types/database';
import { Loader2, Shield, XCircle } from '@/lib/lucide-icons';

/**
 * Página de callback para OAuth (Google)
 * Maneja la redirección después de la autenticación con proveedores externos
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let redirectTimer: ReturnType<typeof setTimeout> | null = null;

    const handleCallback = async () => {
      try {
        // Obtener la sesión del hash de la URL
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          throw new Error('No se pudo establecer la sesión');
        }

        const user = session.user;

        // Verificar si el usuario ya tiene un perfil
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        if (existingProfile) {
          // Usuario existente, actualizar el store y redirigir
          setAuth(user, existingProfile as Database['public']['Tables']['profiles']['Row']);
          navigate('/', { replace: true });
        } else {
          // Nuevo usuario de Google - necesita completar onboarding
          setAuth(user, null);
          navigate('/setup', { replace: true, state: { fromOAuth: true } });
        }
      } catch (err) {
        console.error('[AuthCallback] Error:', err);
        setError(err instanceof Error ? err.message : 'Error al procesar la autenticación');

        // Redirigir al login después de 3 segundos
        redirectTimer = setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleCallback();

    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [navigate, setAuth]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--ds-blue-50)] to-[var(--ds-neutral-50)]">
        <div className="flex flex-col items-center gap-[var(--ds-space-200)] max-w-md text-center px-[var(--ds-space-400)]">
          <div className="w-16 h-16 rounded-[var(--ds-radius-300)] bg-[var(--ds-background-danger)] flex items-center justify-center">
            <XCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-[var(--ds-font-size-400)] font-bold text-[var(--ds-text)]">
            Error de autenticación
          </h2>
          <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)]">{error}</p>
          <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
            Redirigiendo al login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--ds-blue-50)] to-[var(--ds-neutral-50)]">
      <div className="flex flex-col items-center gap-[var(--ds-space-200)]">
        <div className="w-16 h-16 rounded-[var(--ds-radius-300)] bg-[var(--ds-background-brand)] flex items-center justify-center">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-[var(--ds-background-brand)]" />
        <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)]">Autenticando...</p>
      </div>
    </div>
  );
}
