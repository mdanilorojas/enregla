import { Outlet, useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Home,
  MapPin,
  FileText,
  Settings,
  Building2,
  User,
  LogOut,
  Network,
  CalendarClock,
  ListChecks,
  Scale,
  Bell
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const menuItems = [
  {
    title: 'Dashboard',
    url: '/',
    icon: Home,
  },
  {
    title: 'Sedes',
    url: '/sedes',
    icon: MapPin,
  },
  {
    title: 'Mapa Interactivo',
    url: '/mapa-red',
    icon: Network,
  },
  {
    title: 'Permisos',
    url: '/permisos',
    icon: FileText,
  },
  {
    title: 'Renovaciones',
    url: '/renovaciones',
    icon: CalendarClock,
  },
  {
    title: 'Tareas',
    url: '/tareas',
    icon: ListChecks,
  },
  {
    title: 'Marco Legal',
    url: '/marco-legal',
    icon: Scale,
  },
];

const settingsItems = [
  {
    title: 'Configuración',
    url: '/configuracion',
    icon: Settings,
  },
];

const pageNames: Record<string, string> = {
  '/': 'Dashboard',
  '/sedes': 'Sedes',
  '/mapa-red': 'Mapa Interactivo',
  '/permisos': 'Permisos',
  '/renovaciones': 'Renovaciones',
  '/tareas': 'Tareas',
  '/marco-legal': 'Marco Legal',
};

const pageDescriptions: Record<string, string> = {
  '/': 'Resumen general de cumplimiento',
  '/sedes': 'Gestión de ubicaciones',
  '/mapa-red': 'Red de sedes y relaciones',
  '/permisos': 'Control de permisos y licencias',
  '/renovaciones': 'Línea de tiempo de renovaciones',
  '/tareas': 'Acciones pendientes',
  '/marco-legal': 'Normativa y regulaciones',
};

export function AppLayout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  const basePath = '/' + location.pathname.split('/').filter(Boolean).slice(0, 1).join('/');
  const title = pageNames[basePath] || pageNames[location.pathname] || 'EnRegla';
  const description = pageDescriptions[basePath] || '';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col z-40 transition-all duration-200 ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-200">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center">
            <Building2 size={20} className="text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <p className="text-sm font-semibold text-gray-900">EnRegla</p>
              <p className="text-xs text-gray-500">Control operativo</p>
            </div>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <p className={`text-xs font-semibold text-gray-400 uppercase mb-2 px-3 ${!sidebarOpen && 'hidden'}`}>
            Menú principal
          </p>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <Link
                key={item.url}
                to={item.url}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon size={20} />
                {sidebarOpen && <span className="text-sm">{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <User size={16} className="text-blue-900" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{profile?.full_name || 'Usuario'}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{profile?.role || 'viewer'}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Cerrar sesión"
              >
                <LogOut size={16} className="text-gray-600" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signOut()}
              className="w-full p-2 hover:bg-gray-50 rounded transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={20} className="text-gray-600 mx-auto" />
            </button>
          )}
        </div>
      </aside>
      {/* Main Content */}
      <div className={`transition-all duration-200 ${sidebarOpen ? 'ml-64' : 'ml-16'} min-h-screen`}>
        {/* Top Bar */}
        <header className={`h-16 border-b flex items-center justify-between px-6 sticky top-0 z-20 transition-all duration-200 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-lg border-gray-200/60 shadow-sm'
            : 'bg-white border-gray-200/40'
        }`}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all"
            >
              <Building2 size={20} />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
              {description && (
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification */}
            <button className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all">
              <Bell size={20} strokeWidth={2} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
          </div>
        </header>

        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
