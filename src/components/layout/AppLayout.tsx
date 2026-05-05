import { Outlet, useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Home,
  MapPin,
  FileText,
  Building2,
  User,
  LogOut,
  Network,
  CalendarClock,
  ListChecks,
  Scale,
  Bell,
  Workflow,
  FolderOpen,
  Menu,
  X,
  Settings
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
    title: 'Documentos',
    url: '/documentos',
    icon: FolderOpen,
  },
  {
    title: 'Configuración',
    url: '/settings',
    icon: Settings,
  },
  {
    title: 'Marco Legal',
    url: '/marco-legal',
    icon: Scale,
  },
  {
    title: 'Mapa de Permisos',
    url: '/mapa-permisos',
    icon: Workflow,
  },
];


const pageNames: Record<string, string> = {
  '/': 'Dashboard',
  '/sedes': 'Sedes',
  '/mapa-red': 'Mapa Interactivo',
  '/permisos': 'Permisos',
  '/renovaciones': 'Renovaciones',
  '/tareas': 'Tareas',
  '/documentos': 'Documentos',
  '/settings': 'Configuración',
  '/settings/notifications': 'Notificaciones',
  '/marco-legal': 'Marco Legal',
  '/mapa-permisos': 'Mapa de Permisos',
};

const pageDescriptions: Record<string, string> = {
  '/': 'Resumen general de cumplimiento',
  '/sedes': 'Gestión de ubicaciones',
  '/mapa-red': 'Red de sedes y relaciones',
  '/permisos': 'Control de permisos y licencias',
  '/renovaciones': 'Línea de tiempo de renovaciones',
  '/tareas': 'Acciones pendientes',
  '/documentos': 'Repositorio de documentación',
  '/settings': 'Preferencias y configuración',
  '/settings/notifications': 'Preferencias de notificaciones',
  '/marco-legal': 'Normativa y regulaciones',
  '/mapa-permisos': 'Visualiza permisos por tipo de comercio',
};

export function AppLayout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Cerrado por defecto en móvil
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

  // Cerrar sidebar en móvil al cambiar de ruta
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true); // Abierto en desktop
      } else {
        setSidebarOpen(false); // Cerrado en móvil
      }
    };

    handleResize(); // Check inicial
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Cerrar sidebar al navegar en móvil
    const handlePathChange = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };
    handlePathChange();
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      {/* Overlay móvil con blur */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-100 flex flex-col z-40 transition-all duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } w-64 lg:w-64`}>
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 h-16 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">EnRegla</p>
              <p className="text-xs text-gray-500">Control operativo</p>
            </div>
          </div>

          {/* Botón cerrar en móvil */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2 px-3">
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
                <span className="text-sm">{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100">
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
        </div>
      </aside>
      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen w-full transition-all duration-300">
        {/* Top Bar */}
        <header className={`h-16 border-b flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20 transition-all duration-200 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-lg border-gray-100/60 shadow-sm'
            : 'bg-white border-gray-100/40'
        }`}>
          <div className="flex items-center gap-3 lg:gap-4">
            {/* Hamburger en móvil, toggle en desktop */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all"
            >
              <Menu size={20} className="lg:hidden" />
              <Building2 size={20} className="hidden lg:block" />
            </button>
            <div>
              <h1 className="text-base lg:text-lg font-semibold text-gray-900">{title}</h1>
              {description && (
                <p className="hidden lg:block text-xs text-gray-500 mt-0.5">{description}</p>
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

        <div className="p-4 lg:p-6 xl:p-8">
          <div className="max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
