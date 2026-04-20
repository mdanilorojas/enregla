import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Database } from '@/types/database';

/**
 * Página de callback para OAuth (Google)
 * Maneja la redirección después de la autenticación con proveedores externos
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[AuthCallback] Iniciando procesamiento...');

        // Obtener la sesión del hash de la URL
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('[AuthCallback] Sesión obtenida:', session ? 'Sí' : 'No', sessionError);

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          throw new Error('No se pudo establecer la sesión');
        }

        const user = session.user;
        console.log('[AuthCallback] Usuario:', user.email);

        // Verificar si el usuario ya tiene un perfil
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        console.log('[AuthCallback] Perfil existente:', existingProfile ? 'Sí' : 'No', profileError);

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        if (existingProfile) {
          // Usuario existente, actualizar el store y redirigir
          console.log('[AuthCallback] Redirigiendo a dashboard...');
          setAuth(user, existingProfile as Database['public']['Tables']['profiles']['Row']);
          navigate('/', { replace: true });
        } else {
          // Nuevo usuario de Google - necesita completar onboarding
          console.log('[AuthCallback] Nuevo usuario, redirigiendo a onboarding...');
          setAuth(user, null);
          navigate('/setup', { replace: true, state: { fromOAuth: true } });
        }
      } catch (err) {
        console.error('[AuthCallback] Error:', err);
        setError(err instanceof Error ? err.message : 'Error al procesar la autenticación');

        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate, setAuth]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFBFC]">
        <div className="max-w-md w-full p-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error de autenticación</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-400">Redirigiendo al login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFBFC]">
      <div className="max-w-md w-full p-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Procesando autenticación</h2>
          <p className="text-gray-600">Por favor espera...</p>
        </div>
      </div>
    </div>
  );
}
