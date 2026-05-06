import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '@/lib/api/auth';
import { signInWithGoogle } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';
import { LogIn, Shield } from '@/lib/lucide-icons';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/ui/banner';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function LoginView() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  const hasSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Completa todos los campos');
      return;
    }

    setLoading(true);

    try {
      const data = await login({ email, password });
      setAuth(data.user, data.profile);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
      // El usuario será redirigido a Google y luego de vuelta a /auth/callback
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión con Google');
      setGoogleLoading(false);
    }
  };

  const handleDevLogin = () => {
    // Mock user data for development - bypasses onboarding
    const mockUser = {
      id: 'dev-user-123',
      email: 'dev@supermaxi.com',
      created_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      role: 'authenticated',
    } as any;

    const mockProfile = {
      id: 'dev-user-123',
      company_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // Supermaxi company from seed data
      full_name: 'Demo User (Dev)',
      role: 'admin' as const,
      avatar_url: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setAuth(mockUser, mockProfile);
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-[var(--ds-space-400)] bg-gradient-to-br from-[var(--ds-blue-50)] to-[var(--ds-neutral-50)]">
      <div className="w-full max-w-md space-y-[var(--ds-space-300)]">
        <div className="text-center space-y-[var(--ds-space-150)]">
          <div className="inline-flex w-16 h-16 rounded-[var(--ds-radius-300)] bg-[var(--ds-background-brand)] items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-[var(--ds-font-size-500)] font-bold text-[var(--ds-text)]">EnRegla</h1>
          <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)]">Preciso, Confiable, Protector</p>
        </div>

        {isDemoMode && (
          <Banner variant="info" title="Modo Demo">
            Funciones limitadas habilitadas para demostración.
          </Banner>
        )}

        {error && (
          <Banner variant="error" title="Error">
            {error}
          </Banner>
        )}

        <Card className="p-[var(--ds-space-400)]">
          <form onSubmit={handleSubmit} className="space-y-[var(--ds-space-200)]">
            <div className="space-y-[var(--ds-space-075)]">
              <label htmlFor="email" className="block text-[var(--ds-font-size-100)] font-medium text-[var(--ds-text)]">
                Correo electrónico
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-[var(--ds-space-075)]">
              <label htmlFor="password" className="block text-[var(--ds-font-size-100)] font-medium text-[var(--ds-text)]">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full"
              disabled={loading}
              loading={loading}
            >
              Entrar
            </Button>

            {import.meta.env.DEV && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleDevLogin}
              >
                Dev Login (Skip Auth)
              </Button>
            )}
          </form>

          {hasSupabase && (
            <>
              <div className="flex items-center gap-[var(--ds-space-150)] my-[var(--ds-space-300)]">
                <div className="flex-1 h-px bg-[var(--ds-border)]" />
                <span className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] font-medium">
                  o continúa con
                </span>
                <div className="flex-1 h-px bg-[var(--ds-border)]" />
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                loading={googleLoading}
              >
                <LogIn className="w-4 h-4" />
                Iniciar con Google
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
