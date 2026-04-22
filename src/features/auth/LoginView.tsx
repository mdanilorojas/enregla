import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '@/lib/api/auth';
import { signInWithGoogle } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';
import { Shield, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui';
import { Button } from '@/components/ui';

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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

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
    <div className="min-h-screen flex">
      {/* Left — Brand panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] relative overflow-hidden flex-col justify-between p-10 login-brand-panel bg-[#1e3a8a]">
        {/* Subtle texture for depth without decoration */}
        <div className="absolute inset-0 login-grain opacity-[0.015]" />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
              <span className="text-white font-bold text-[13px] tracking-tight">ER</span>
            </div>
            <div>
              <span className="text-white font-bold text-[18px] tracking-tight block leading-tight">EnRegla</span>
              <span className="text-blue-200/70 text-[10px] font-semibold uppercase tracking-[0.12em]">Compliance</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center -mt-10">
          <h1 className="text-[32px] font-semibold text-white leading-[1.2] tracking-tight mb-4">
            Tu operación,<br />
            siempre en regla.
          </h1>
          <p className="text-blue-100/75 text-[15px] leading-relaxed max-w-sm mb-10">
            Gestiona permisos, cumplimiento y renovaciones de todos tus locales desde un solo lugar.
          </p>

          <div className="space-y-3">
            {FEATURES.map((feat) => (
              <div
                key={feat}
                className="flex items-center gap-3"
              >
                <div className="w-5 h-5 rounded-md bg-white/8 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={12} className="text-blue-200" strokeWidth={2.5} />
                </div>
                <span className="text-[13px] text-blue-50/85 font-medium">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/8">
            <div className="flex -space-x-2">
              {['bg-amber-400', 'bg-green-500', 'bg-blue-400', 'bg-red-500'].map((c, i) => (
                <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-[#1e3a8a] flex items-center justify-center`}>
                  <span className="text-white text-[9px] font-bold">{['KF', 'MC', 'BK', 'PH'][i]}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[12px] text-white/85 font-medium">+200 empresas confían en EnRegla</p>
              <p className="text-[10px] text-blue-100/60">Ecuador · Colombia · Perú</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-[#FAFBFC]">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-lg bg-blue-900 flex items-center justify-center">
              <span className="text-white font-bold text-[13px]">ER</span>
            </div>
            <div>
              <span className="text-[18px] font-bold text-gray-900 tracking-tight block leading-tight">EnRegla</span>
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-[0.12em]">Compliance</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-[24px] font-bold text-gray-900 tracking-tight">Iniciar sesión</h2>
            <p className="text-[14px] text-gray-400 mt-1.5">Accede a tu panel de compliance</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                autoComplete="email"
                className="h-11"
                aria-describedby={error ? "login-error" : undefined}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <button type="button" className="text-xs text-blue-900 hover:text-blue-800 font-semibold transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-11 pr-12"
                  aria-describedby={error ? "login-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div id="login-error" role="alert" className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
                <Shield size={14} className="text-red-600 shrink-0" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-blue-900 hover:bg-blue-800 text-white font-semibold shadow-sm shadow-blue-900/10 transition-colors"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Entrar
                  <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </Button>

            {/* Dev Login Button - Only visible in development */}
            {import.meta.env.DEV && (
              <Button
                type="button"
                onClick={handleDevLogin}
                variant="outline"
                className="w-full h-10 border-2 border-yellow-400 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold shadow-lg shadow-yellow-500/25"
              >
                🚀 Dev Login (Skip Auth)
              </Button>
            )}
          </form>

          {/* Divider - Only show if Google OAuth is available */}
          {import.meta.env.VITE_SUPABASE_URL && (
            <div className="flex items-center gap-4 my-7">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[11px] text-gray-400 font-medium">o continúa con</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          )}

          {/* Social login - Only show if Supabase is configured */}
          {import.meta.env.VITE_SUPABASE_URL && (
            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              variant="outline"
              className="w-full h-11"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-900 rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  <span className="ml-2">Continuar con Google</span>
                </>
              )}
            </Button>
          )}

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-8">
            ¿No tienes cuenta?{' '}
            <button className="text-blue-900 hover:text-blue-800 font-semibold transition-colors">
              Solicita acceso
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
