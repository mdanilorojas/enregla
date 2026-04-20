import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';

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
  const [scrolled, setScrolled] = useState(false);

  const basePath = '/' + location.pathname.split('/').filter(Boolean).slice(0, 1).join('/');
  const title = pageNames[basePath] || pageNames[location.pathname] || '';
  const description = pageDescriptions[basePath] || '';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`h-16 border-b flex items-center justify-between px-6 sticky top-0 z-20 transition-all duration-200 ${
      scrolled
        ? 'bg-white/95 backdrop-blur-lg border-gray-200/60 shadow-sm'
        : 'bg-white border-gray-200/40'
    }`}>
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden mr-1 p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Menu size={20} />
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
  );
}
