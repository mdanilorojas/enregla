import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Permit, Location, Renewal } from '@/types';
import { GlassCard } from '@/components/ui';
import { RefreshCw, FileText, AlertCircle, MapPin, ArrowRight, CheckCircle } from 'lucide-react';
import { daysUntil } from '@/lib/dates';

interface QuickActionsProps {
  permits: Permit[];
  locations: Location[];
  renewals: Renewal[];
}

interface Action {
  id: string;
  title: string;
  count: number;
  icon: React.ReactNode;
  variant: 'urgent' | 'warning' | 'info';
  action: () => void;
}

export function QuickActions({ permits, locations, renewals }: QuickActionsProps) {
  const navigate = useNavigate();

  const actions = useMemo<Action[]>(() => {
    const suggestions: Action[] = [];

    // Critical: Expired permits
    const expiredPermits = permits.filter((p) => p.status === 'vencido');
    if (expiredPermits.length > 0) {
      suggestions.push({
        id: 'expired',
        title: 'Vencidos',
        count: expiredPermits.length,
        icon: <AlertCircle size={16} />,
        variant: 'urgent',
        action: () => navigate('/permisos'),
      });
    }

    // Urgent renewals
    const urgentRenewals = renewals.filter(
      (r) => r.status !== 'completado' && daysUntil(r.dueDate) <= 15 && daysUntil(r.dueDate) >= 0
    );
    if (urgentRenewals.length > 0) {
      suggestions.push({
        id: 'renewals',
        title: 'Por vencer',
        count: urgentRenewals.length,
        icon: <RefreshCw size={16} />,
        variant: 'warning',
        action: () => navigate('/renovaciones'),
      });
    }

    // Missing permits
    const unregisteredPermits = permits.filter((p) => p.status === 'no_registrado');
    if (unregisteredPermits.length > 0) {
      suggestions.push({
        id: 'missing',
        title: 'Faltantes',
        count: unregisteredPermits.length,
        icon: <FileText size={16} />,
        variant: 'warning',
        action: () => navigate('/permisos'),
      });
    }

    // High risk locations
    const highRiskLocations = locations.filter((l) => l.riskLevel === 'critico' || l.riskLevel === 'alto');
    if (highRiskLocations.length > 0) {
      suggestions.push({
        id: 'risk',
        title: 'Alto riesgo',
        count: highRiskLocations.length,
        icon: <MapPin size={16} />,
        variant: 'info',
        action: () => navigate('/sedes'),
      });
    }

    return suggestions;
  }, [permits, locations, renewals, navigate]);

  const variantStyles = {
    urgent: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200',
    warning: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200',
    info: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
  };

  if (actions.length === 0) {
    return (
      <GlassCard intensity="medium" className="p-4">
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={20} />
          </div>
          <p className="text-sm font-bold text-emerald-900 mb-1">Todo en orden</p>
          <p className="text-xs text-emerald-600">Sin acciones pendientes</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard intensity="medium" className="p-4">
      <h3 className="text-sm font-bold text-gray-900 mb-3">Acciones</h3>
      <div className="space-y-2">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${variantStyles[action.variant]}`}
          >
            <div className="flex items-center gap-2">
              {action.icon}
              <span className="text-sm font-semibold">{action.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{action.count}</span>
              <ArrowRight size={14} />
            </div>
          </button>
        ))}
      </div>
    </GlassCard>
  );
}
