import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/lib/api/auth';

const pageNames: Record<string, string> = {
  '/': 'Dashboard',
  '/sedes': 'Sedes',
  '/permisos': 'Permisos',
  '/renovaciones': 'Renovaciones',
  '/tareas': 'Tareas',
  '/marco-legal': 'Marco Legal',
  '/mapa': 'Mapa de sedes',
  '/setup': 'Configuración inicial',
};

const pageDescriptions: Record<string, string> = {
  '/': 'Resumen general de cumplimiento',
  '/sedes': 'Gestión de ubicaciones',
  '/permisos': 'Control de permisos y licencias',
  '/renovaciones': 'Línea de tiempo de renovaciones',
  '/tareas': 'Acciones pendientes',
  '/marco-legal': 'Normativa y regulaciones',
  '/mapa': 'Grafo interactivo de sedes y regulaciones',
};

interface TopBarProps {
  onMenuToggle: () => void;
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const basePath = '/' + location.pathname.split('/').filter(Boolean).slice(0, 1).join('/');
  const title = pageNames[basePath] || pageNames[location.pathname] || '';
  const description = pageDescriptions[basePath] || '';

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const userInitials = profile?.full_name ? getInitials(profile.full_name) : 'DC';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`h-[64px] border-b flex items-center justify-between px-6 sticky top-0 z-20 transition-all duration-300 ${
      scrolled
        ? 'bg-white/70 backdrop-blur-2xl border-gray-200/80 shadow-sm'
        : 'bg-white/90 backdrop-blur-xl border-gray-200/60'
    }`}>
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden mr-1 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Menu size={18} />
        </button>
        <div>
          <h1 className="text-[15px] font-semibold text-gray-900 tracking-tight leading-tight">{title}</h1>
          {description && (
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">{description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2.5 bg-gray-50 border border-gray-200/60 rounded-xl px-3.5 py-2 w-[220px] hover:border-gray-300 transition-colors cursor-text group">
          <Search size={14} className="text-gray-400 group-hover:text-gray-500" />
          <span className="text-[12px] text-gray-400">Buscar...</span>
          <kbd className="ml-auto text-[10px] text-gray-400 bg-white border border-gray-200/80 rounded px-1.5 py-0.5 font-medium shadow-sm">⌘K</kbd>
        </div>

        {/* Notification */}
        <button className="relative p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
          <Bell size={17} strokeWidth={1.8} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* Settings */}
        <button className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
          <Settings size={17} strokeWidth={1.8} />
        </button>

        {/* Avatar with dropdown */}
        <div className="relative ml-1">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm shadow-blue-500/20 cursor-pointer hover:shadow-md hover:shadow-blue-500/30 transition-shadow"
          >
            <span className="text-white text-[11px] font-bold">{userInitials}</span>
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white/90 backdrop-blur-xl border border-gray-200/80 rounded-xl shadow-lg py-2 z-40">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-[13px] font-semibold text-gray-900">{profile?.full_name || 'Usuario'}</p>
                  <p className="text-[11px] text-gray-500 capitalize">{profile?.role || 'viewer'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-[12px] text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} />
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
