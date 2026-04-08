import { useLocation } from 'react-router-dom';
import { Menu, Search, Bell, Settings } from 'lucide-react';

const pageNames: Record<string, string> = {
  '/': 'Dashboard',
  '/sedes': 'Sedes',
  '/permisos': 'Permisos',
  '/renovaciones': 'Renovaciones',
  '/documentos': 'Documentos',
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
  '/documentos': 'Repositorio documental',
  '/tareas': 'Acciones pendientes',
  '/marco-legal': 'Normativa y regulaciones',
  '/mapa': 'Grafo interactivo de sedes y regulaciones',
};

interface TopBarProps {
  onMenuToggle: () => void;
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const location = useLocation();
  const basePath = '/' + location.pathname.split('/').filter(Boolean).slice(0, 1).join('/');
  const title = pageNames[basePath] || pageNames[location.pathname] || '';
  const description = pageDescriptions[basePath] || '';

  return (
    <header className="h-[64px] border-b border-gray-200/60 bg-white/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-20">
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

        {/* Avatar */}
        <div className="ml-1 w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm shadow-blue-500/20 cursor-pointer hover:shadow-md hover:shadow-blue-500/30 transition-shadow">
          <span className="text-white text-[11px] font-bold">DC</span>
        </div>
      </div>
    </header>
  );
}
