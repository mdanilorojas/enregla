import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '@/lib/api/auth';
import { signInWithGoogle } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';
import { Shield, CheckCircle2 } from '@/lib/lucide-icons';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/ui/banner';
import { Input } from '@/components/ui/input';

const FEATURES = [
  'Control centralizado de permisos',
  'Alertas de vencimiento inteligentes',
  'Gestión multi-sede en tiempo real',
  'Marco legal siempre actualizado',
];

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión con Google');
      setGoogleLoading(false);
    }
  };

  const handleDevLogin = () => {
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
      company_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[var(--ds-neutral-0)]">
      {/* Left: Brand panel */}
      <aside
        className="hidden lg:flex flex-col justify-between p-[var(--ds-space-600)] bg-[var(--ds-background-brand)] text-white relative overflow-hidden"
        aria-label="Presentación de EnRegla"
      >
        {/* Logo */}
        <div className="flex items-center gap-[var(--ds-space-150)] relative z-10">
          <div className="w-10 h-10 rounded-[var(--ds-radius-200)] bg-white/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <div className="font-bold text-[var(--ds-font-size-200)] leading-tight">EnRegla</div>
            <div className="text-[10px] font-semibold tracking-[0.2em] text-white/60 uppercase">Compliance</div>
          </div>
        </div>

        {/* Hero content */}
        <div className="space-y-[var(--ds-space-400)] relative z-10">
          <div className="space-y-[var(--ds-space-200)]">
            <h1 className="text-[var(--ds-font-size-600)] font-bold leading-[1.1]">
              Tu operación,
              <br />
              siempre en regla.
            </h1>
            <p className="text-[var(--ds-font-size-200)] text-white/80 leading-relaxed max-w-md">
              Gestiona permisos, cumplimiento y renovaciones de todos tus locales desde un solo lugar.
            </p>
          </div>

          <ul className="space-y-[var(--ds-space-150)]" role="list">
            {FEATURES.map(feature => (
              <li key={feature} className="flex items-center gap-[var(--ds-space-150)]">
                <CheckCircle2 className="w-5 h-5 text-[var(--ds-background-accent)] shrink-0" aria-hidden="true" />
                <span className="text-[var(--ds-font-size-100)] text-white/90">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Trust footer */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-[var(--ds-space-150)] px-[var(--ds-space-200)] py-[var(--ds-space-150)] rounded-[var(--ds-radius-200)] bg-white/10 backdrop-blur-sm">
            <div className="flex -space-x-2">
              {['🇪🇨', '🇨🇴', '🇵🇪'].map((flag, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] ring-2 ring-[var(--ds-background-brand)]"
                >
                  {flag}
                </div>
              ))}
            </div>
            <span className="text-[var(--ds-font-size-075)] text-white/90">
              <strong>+200 empresas</strong> confían en EnRegla
            </span>
          </div>
        </div>

        {/* Decorative background blob */}
        <div
          className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, var(--ds-background-accent) 0%, transparent 70%)' }}
          aria-hidden="true"
        />
      </aside>

      {/* Right: Form panel */}
      <main className="flex items-center justify-center p-[var(--ds-space-400)] lg:p-[var(--ds-space-600)]">
        <div className="w-full max-w-md space-y-[var(--ds-space-300)]">
          {/* Mobile logo (only visible below lg) */}
          <div className="lg:hidden flex items-center gap-[var(--ds-space-150)] mb-[var(--ds-space-400)]">
            <div className="w-10 h-10 rounded-[var(--ds-radius-200)] bg-[var(--ds-background-brand)] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="font-bold text-[var(--ds-font-size-200)] leading-tight text-[var(--ds-text)]">EnRegla</div>
              <div className="text-[10px] font-semibold tracking-[0.2em] text-[var(--ds-text-subtle)] uppercase">Compliance</div>
            </div>
          </div>

          <div className="space-y-[var(--ds-space-100)]">
            <h2 className="text-[var(--ds-font-size-500)] font-bold text-[var(--ds-text)] leading-tight">
              Iniciar sesión
            </h2>
            <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)]">
              Accede a tu panel de compliance
            </p>
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
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-[var(--ds-font-size-100)] font-medium text-[var(--ds-text)]">
                  Contraseña
                </label>
                <a
                  href="#"
                  className="text-[var(--ds-font-size-075)] text-[var(--ds-text-brand)] hover:underline focus-visible:outline-none focus-visible:underline"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
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
              <div className="flex items-center gap-[var(--ds-space-150)]">
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
                {!googleLoading && (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                Continuar con Google
              </Button>
            </>
          )}

          <p className="text-center text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
            ¿No tienes cuenta?{' '}
            <a href="#" className="text-[var(--ds-text-brand)] font-medium hover:underline focus-visible:outline-none focus-visible:underline">
              Solicita acceso
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
