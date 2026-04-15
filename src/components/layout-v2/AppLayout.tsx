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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui-v2/sidebar';

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

function AppLayoutContent() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const { open } = useSidebar();
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
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar collapsible="icon" variant="sidebar">
          {/* Header con empresa */}
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-white">
                    <Building2 className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">EnRegla</span>
                    <span className="truncate text-xs text-sidebar-foreground/70">
                      Control operativo
                    </span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          {/* Content con menú */}
          <SidebarContent>
            {/* Menú principal */}
            <SidebarGroup>
              <SidebarGroupLabel>Menú principal</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link to={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Settings */}
            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <SidebarMenu>
                  {settingsItems.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link to={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {/* Footer con usuario */}
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex items-center gap-2 px-2 py-2">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
                    <User className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {profile?.full_name || 'Usuario'}
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/70">
                      {profile?.role === 'admin' ? 'Administrador' : profile?.role === 'operator' ? 'Operador' : 'Visor'}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="ml-auto p-1 hover:bg-sidebar-accent rounded transition-colors"
                    title="Cerrar sesión"
                    type="button"
                  >
                    <LogOut className="size-4" />
                  </button>
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main
          className="flex-1 min-w-0 transition-[margin-left] duration-200"
          style={{
            marginLeft: open ? '16rem' : '3rem',
            width: `calc(100% - ${open ? '16rem' : '3rem'})`
          }}
        >
          {/* Top Bar */}
          <header className={`h-16 border-b flex items-center justify-between px-6 sticky top-0 z-20 transition-all duration-200 ${
            scrolled
              ? 'bg-white/95 backdrop-blur-lg border-gray-200/60 shadow-sm'
              : 'bg-white border-gray-200/40'
          }`}>
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
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
        </main>
    </div>
  );
}

export function AppLayout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppLayoutContent />
    </SidebarProvider>
  );
}
