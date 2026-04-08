import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Shield,
  CalendarClock,
  FileText,
  ListChecks,
  Scale,
  Network,
  ChevronLeft,
  ChevronRight,
  Building2,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/store';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', badge: null, color: 'blue' as const },
  { to: '/sedes', icon: MapPin, label: 'Sedes', badge: null, color: 'violet' as const },
  { to: '/permisos', icon: Shield, label: 'Permisos', badge: null, color: 'emerald' as const },
  { to: '/renovaciones', icon: CalendarClock, label: 'Renovaciones', badge: null, color: 'amber' as const },
  { to: '/documentos', icon: FileText, label: 'Documentos', badge: null, color: 'sky' as const },
  { to: '/tareas', icon: ListChecks, label: 'Tareas', badge: null, color: 'rose' as const },
  { to: '/marco-legal', icon: Scale, label: 'Marco Legal', badge: null, color: 'indigo' as const },
  { to: '/mapa', icon: Network, label: 'Mapa de sedes', badge: null, color: 'blue' as const },
];

const activeColorMap = {
  blue: 'bg-blue-50 text-blue-600 border-blue-500',
  violet: 'bg-violet-50 text-violet-600 border-violet-500',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-500',
  amber: 'bg-amber-50 text-amber-700 border-amber-500',
  sky: 'bg-sky-50 text-sky-600 border-sky-500',
  rose: 'bg-rose-50 text-rose-600 border-rose-500',
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-500',
};

const iconBgMap = {
  blue: 'bg-blue-100/60 text-blue-600',
  violet: 'bg-violet-100/60 text-violet-600',
  emerald: 'bg-emerald-100/60 text-emerald-600',
  amber: 'bg-amber-100/60 text-amber-700',
  sky: 'bg-sky-100/60 text-sky-600',
  rose: 'bg-rose-100/60 text-rose-600',
  indigo: 'bg-indigo-100/60 text-indigo-600',
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const company = useAppStore((s) => s.company);
  const permits = useAppStore((s) => s.permits);
  const tasks = useAppStore((s) => s.tasks);

  const criticalPermits = permits.filter((p) => p.status === 'vencido' || p.status === 'no_registrado').length;
  const pendingTasks = tasks.filter((t) => t.status !== 'completada').length;

  const badges: Record<string, number | null> = {
    '/permisos': criticalPermits > 0 ? criticalPermits : null,
    '/tareas': pendingTasks > 0 ? pendingTasks : null,
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200/80 flex flex-col z-40 transition-all duration-200 ${
        collapsed ? 'w-[64px]' : 'w-[252px]'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-[64px] shrink-0 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
          <span className="text-white font-bold text-[12px] tracking-tight">ER</span>
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-[15px] font-bold text-gray-900 tracking-tight leading-tight">EnRegla</span>
            <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Compliance</span>
          </div>
        )}
      </div>

      {/* Company */}
      {!collapsed && company && (
        <div className="mx-3 mt-3 mb-1 px-3 py-2.5 rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-100/80">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white border border-gray-200/60 flex items-center justify-center shadow-sm">
              <Building2 size={13} className="text-gray-500" />
            </div>
            <div className="min-w-0">
              <span className="text-[12px] text-gray-800 truncate font-semibold block">{company.name}</span>
              <span className="text-[10px] text-gray-400 truncate block">Multi-sede</span>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <div className="px-3 py-1.5 mb-1">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Menú principal</span>
          </div>
        )}
        {navItems.map(({ to, icon: Icon, label, color }) => {
          const badgeCount = badges[to];
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150 relative border border-transparent ${
                  isActive
                    ? `${activeColorMap[color]} shadow-sm`
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                } ${collapsed ? 'justify-center px-0' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-150 ${
                    isActive ? iconBgMap[color] : 'text-gray-400 group-hover:text-gray-600'
                  }`}>
                    <Icon size={16} strokeWidth={1.8} />
                  </div>
                  {!collapsed && (
                    <>
                      <span className="flex-1">{label}</span>
                      {badgeCount && (
                        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-sm shadow-red-500/30">
                          {badgeCount}
                        </span>
                      )}
                    </>
                  )}
                  {collapsed && badgeCount && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold shadow-sm shadow-red-500/30">
                      {badgeCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* CTA Card */}
      {!collapsed && (
        <div className="mx-3 mb-3">
          <div className="rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                <Sparkles size={16} className="text-white" />
              </div>
              <p className="text-white font-semibold text-[13px] leading-tight mb-1">EnRegla Pro</p>
              <p className="text-blue-200 text-[11px] leading-snug mb-3">Alertas automáticas y reportes avanzados.</p>
              <button className="w-full py-2 px-3 rounded-lg bg-white text-blue-700 text-[12px] font-semibold hover:bg-blue-50 transition-colors shadow-sm">
                Conocer más
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer toggle */}
      <div className="px-3 pb-3 border-t border-gray-100 pt-2">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full rounded-lg py-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
