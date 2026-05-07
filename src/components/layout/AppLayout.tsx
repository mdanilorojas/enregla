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
  Scale,
  Bell,
  Workflow,
  Menu,
  X,
  Settings
} from '@/lib/lucide-icons';
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
  '/settings': 'Preferencias y configuración',
  '/settings/notifications': 'Preferencias de notificaciones',
  '/marco-legal': 'Normativa y regulaciones',
  '/mapa-permisos': 'Visualiza permisos por tipo de comercio',
};

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-background-brand)] focus-visible:ring-offset-2';

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
    <div className="flex min-h-screen w-full bg-[var(--ds-neutral-50)]">
      {/* Skip-to-content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-[var(--ds-space-200)] focus:py-[var(--ds-space-100)] focus:bg-[var(--ds-background-brand)] focus:text-white focus:rounded-[var(--ds-radius-200)] focus:shadow-[var(--ds-shadow-overlay)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-background-brand)] focus-visible:ring-offset-2"
      >
        Saltar al contenido
      </a>

      {/* Overlay móvil con blur */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="Navegación principal"
        className={`fixed left-0 top-0 h-screen bg-[var(--ds-neutral-0)] border-r border-[var(--ds-border)] flex flex-col z-40 transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } w-64 lg:w-64`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-[var(--ds-space-150)] px-[var(--ds-space-200)] h-16 border-b border-[var(--ds-border)]">
          <div className="flex items-center gap-[var(--ds-space-150)]">
            <div className="w-10 h-10 rounded-[var(--ds-radius-200)] bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center">
              <Building2 size={20} className="text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[var(--ds-font-size-100)] font-semibold text-[var(--ds-text)]">EnRegla</p>
              <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">Control operativo</p>
            </div>
          </div>

          {/* Botón cerrar en móvil */}
          <button
            onClick={() => setSidebarOpen(false)}
            className={`lg:hidden p-[var(--ds-space-100)] hover:bg-[var(--ds-neutral-100)] rounded-[var(--ds-radius-200)] transition-colors ${focusRing}`}
            aria-label="Cerrar menú"
          >
            <X size={20} className="text-[var(--ds-text-subtle)]" aria-hidden="true" />
          </button>
        </div>

        {/* Menu */}
        <nav aria-label="Secciones de la aplicación" className="flex-1 p-[var(--ds-space-150)] overflow-y-auto">
          <p id="menu-heading" className="text-[var(--ds-font-size-075)] font-semibold text-[var(--ds-text-subtlest)] uppercase mb-2 px-[var(--ds-space-150)]">
            Menú principal
          </p>
          <ul aria-labelledby="menu-heading" className="list-none p-0 m-0">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <li key={item.url}>
                  <Link
                    to={item.url}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-[var(--ds-space-150)] px-[var(--ds-space-150)] py-2.5 rounded-[var(--ds-radius-200)] mb-1 transition-colors ${focusRing} ${
                      isActive
                        ? 'bg-[var(--ds-blue-50)] text-[var(--ds-text-brand)] font-medium'
                        : 'text-[var(--ds-text-subtle)] hover:bg-[var(--ds-neutral-50)] hover:text-[var(--ds-text)]'
                    }`}
                  >
                    <item.icon size={20} aria-hidden="true" />
                    <span className="text-[var(--ds-font-size-100)]">{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-[var(--ds-space-150)] border-t border-[var(--ds-border)]">
          <div className="flex items-center gap-[var(--ds-space-150)] px-[var(--ds-space-150)] py-2 bg-[var(--ds-neutral-50)] rounded-[var(--ds-radius-200)]">
            <div className="w-8 h-8 rounded-[var(--ds-radius-200)] bg-[var(--ds-blue-50)] flex items-center justify-center">
              <User size={16} className="text-[var(--ds-text-brand)]" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[var(--ds-font-size-100)] font-semibold text-[var(--ds-text)] truncate">{profile?.full_name || 'Usuario'}</p>
              <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] truncate capitalize">{profile?.role || 'viewer'}</p>
            </div>
            <button
              onClick={() => signOut()}
              className={`p-1 hover:bg-[var(--ds-neutral-100)] rounded transition-colors ${focusRing}`}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut size={16} className="text-[var(--ds-text-subtle)]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>
      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen w-full transition-all duration-300">
        {/* Top Bar */}
        <header className={`h-16 border-b flex items-center justify-between px-[var(--ds-space-200)] lg:px-[var(--ds-space-300)] sticky top-0 z-20 transition-all duration-200 ${
          scrolled
            ? 'bg-[var(--ds-neutral-0)]/95 backdrop-blur-lg border-[var(--ds-border)] shadow-[var(--ds-shadow-raised)]'
            : 'bg-[var(--ds-neutral-0)] border-[var(--ds-border)]'
        }`}>
          <div className="flex items-center gap-[var(--ds-space-150)] lg:gap-[var(--ds-space-200)]">
            {/* Hamburger en móvil, toggle en desktop */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-[var(--ds-space-100)] rounded-[var(--ds-radius-200)] text-[var(--ds-text-subtle)] hover:text-[var(--ds-text)] hover:bg-[var(--ds-neutral-50)] transition-all ${focusRing}`}
              aria-label="Alternar menú lateral"
            >
              <Menu size={20} className="lg:hidden" aria-hidden="true" />
              <Building2 size={20} className="hidden lg:block" aria-hidden="true" />
            </button>
            <div>
              <h1 className="text-base lg:text-[var(--ds-font-size-300)] font-semibold text-[var(--ds-text)]">{title}</h1>
              {description && (
                <p className="hidden lg:block text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mt-0.5">{description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-[var(--ds-space-150)]">
            {/* Notification */}
            <button
              className={`relative p-[var(--ds-space-100)] rounded-[var(--ds-radius-200)] text-[var(--ds-text-subtle)] hover:text-[var(--ds-text)] hover:bg-[var(--ds-neutral-50)] transition-all ${focusRing}`}
              aria-label="Notificaciones"
            >
              <Bell size={20} strokeWidth={2} aria-hidden="true" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[var(--ds-neutral-0)]" aria-hidden="true" />
            </button>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="p-[var(--ds-space-200)] lg:p-[var(--ds-space-300)] xl:p-[var(--ds-space-400)] focus:outline-none"
        >
          <div className="max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
