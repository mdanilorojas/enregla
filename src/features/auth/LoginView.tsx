import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '@/lib/api/auth';
import { useAuthStore } from '@/store/authStore';
import { Shield, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';

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

  const handleDevLogin = () => {
    // Mock user data for development
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
      company_id: null, // NULL to trigger onboarding flow
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
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] relative overflow-hidden flex-col justify-between p-10 login-brand-panel">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900" />
        <div className="absolute inset-0 login-grain opacity-[0.03]" />

        {/* Floating orbs */}
        <div className="absolute top-20 -left-10 w-60 h-60 rounded-full bg-blue-500/20 blur-3xl login-float" />
        <div className="absolute bottom-32 right-0 w-48 h-48 rounded-full bg-indigo-400/20 blur-3xl login-float-delayed" />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-sky-400/15 blur-2xl login-float-slow" />

        {/* Grid pattern */}
        <div className="absolute inset-0 login-grid opacity-[0.04]" />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <span className="text-white font-bold text-[13px] tracking-tight">ER</span>
            </div>
            <div>
              <span className="text-white font-bold text-[18px] tracking-tight block leading-tight">EnRegla</span>
              <span className="text-blue-200/60 text-[10px] font-semibold uppercase tracking-[0.15em]">Compliance</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center -mt-10">
          <h1 className="text-[36px] font-bold text-white leading-[1.15] tracking-tight mb-4">
            Tu operación,<br />
            siempre en regla.
          </h1>
          <p className="text-blue-200/70 text-[15px] leading-relaxed max-w-sm mb-10">
            Gestiona permisos, cumplimiento y renovaciones de todos tus locales desde un solo lugar.
          </p>

          <div className="space-y-3.5">
            {FEATURES.map((feat, i) => (
              <div
                key={feat}
                className="flex items-center gap-3 opacity-0 animate-slide-up"
                style={{ animationDelay: `${300 + i * 100}ms`, animationFillMode: 'forwards' }}
              >
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                </div>
                <span className="text-[13px] text-blue-100/80 font-medium">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="flex -space-x-2">
              {['bg-amber-400', 'bg-emerald-400', 'bg-blue-400', 'bg-rose-400'].map((c, i) => (
                <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-blue-800 flex items-center justify-center`}>
                  <span className="text-white text-[9px] font-bold">{['KF', 'MC', 'BK', 'PH'][i]}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[12px] text-white/80 font-medium">+200 empresas confían en EnRegla</p>
              <p className="text-[10px] text-blue-300/50">Ecuador · Colombia · Perú</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-[#FAFBFC]">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-[13px]">ER</span>
            </div>
            <div>
              <span className="text-[18px] font-bold text-gray-900 tracking-tight block leading-tight">EnRegla</span>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-[0.15em]">Compliance</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-[24px] font-bold text-gray-900 tracking-tight">Iniciar sesión</h2>
            <p className="text-[14px] text-gray-400 mt-1.5">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[14px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[12px] font-semibold text-gray-600">
                  Contraseña
                </label>
                <button type="button" className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[14px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-300 hover:text-gray-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
                <Shield size={14} className="text-red-500 shrink-0" />
                <p className="text-[12px] text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-[14px] font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-lg"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Entrar
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Dev Login Button - Only visible in development */}
            {import.meta.env.DEV && (
              <button
                type="button"
                onClick={handleDevLogin}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[13px] font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] transition-all duration-200 border-2 border-amber-400"
              >
                🚀 Dev Login (Skip Auth)
              </button>
            )}
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-7">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[11px] text-gray-400 font-medium">o continúa con</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Social login */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all duration-200">
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all duration-200">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              X
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-[12px] text-gray-400 mt-8">
            ¿No tienes cuenta?{' '}
            <button className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              Solicita acceso
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
