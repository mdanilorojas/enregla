import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Permit, Location, Renewal } from '@/types';
import { Card } from '@/components/ui';
import { RefreshCw, FileText, AlertCircle, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { daysUntil } from '@/lib/dates';

interface QuickActionsProps {
  permits: Permit[];
  locations: Location[];
  renewals: Renewal[];
}

interface Action {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  variant: 'urgent' | 'warning' | 'info';
  action: () => void;
  priority: number;
}

export function QuickActions({ permits, locations, renewals }: QuickActionsProps) {
  const navigate = useNavigate();

  const actions = useMemo<Action[]>(() => {
    const suggestions: Action[] = [];

    // Critical: Expired permits
    const expiredPermits = permits.filter((p) => p.status === 'vencido');
    if (expiredPermits.length > 0) {
      suggestions.push({
        id: 'renew-expired',
        title: 'Renovar permisos vencidos',
        description: `${expiredPermits.length} permiso${expiredPermits.length !== 1 ? 's' : ''} requieren renovación inmediata`,
        icon: <RefreshCw size={18} />,
        variant: 'urgent',
        action: () => navigate('/renovaciones'),
        priority: 1,
      });
    }

    // High: Renewals due soon (next 15 days)
    const urgentRenewals = renewals.filter(
      (r) => r.status !== 'completado' && daysUntil(r.dueDate) <= 15 && daysUntil(r.dueDate) >= 0
    );
    if (urgentRenewals.length > 0) {
      suggestions.push({
        id: 'urgent-renewals',
        title: 'Renovaciones próximas',
        description: `${urgentRenewals.length} renovación${urgentRenewals.length !== 1 ? 'es' : ''} vencen en los próximos 15 días`,
        icon: <AlertCircle size={18} />,
        variant: 'warning',
        action: () => navigate('/renovaciones'),
        priority: 2,
      });
    }

    // Medium: Missing permits
    const unregisteredPermits = permits.filter((p) => p.status === 'no_registrado');
    if (unregisteredPermits.length > 0) {
      suggestions.push({
        id: 'register-permits',
        title: 'Registrar permisos faltantes',
        description: `${unregisteredPermits.length} permiso${unregisteredPermits.length !== 1 ? 's' : ''} pendientes de documentación`,
        icon: <FileText size={18} />,
        variant: 'warning',
        action: () => navigate('/permisos'),
        priority: 3,
      });
    }

    // Low: Locations with high risk
    const highRiskLocations = locations.filter((l) => l.riskLevel === 'critico' || l.riskLevel === 'alto');
    if (highRiskLocations.length > 0) {
      suggestions.push({
        id: 'review-locations',
        title: 'Revisar sedes de alto riesgo',
        description: `${highRiskLocations.length} sede${highRiskLocations.length !== 1 ? 's' : ''} requieren atención`,
        icon: <MapPin size={18} />,
        variant: 'info',
        action: () => navigate('/sedes'),
        priority: 4,
      });
    }

    // Sort by priority
    return suggestions.sort((a, b) => a.priority - b.priority).slice(0, 4);
  }, [permits, locations, renewals, navigate]);

  if (actions.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} />
          </div>
          <h3 className="text-lg font-bold text-emerald-900 mb-2">¡Todo en orden!</h3>
          <p className="text-sm text-emerald-700">
            No hay acciones pendientes. Tu operación está bajo control.
          </p>
        </div>
      </Card>
    );
  }

  const variantStyles = {
    urgent: {
      bg: 'bg-red-50 hover:bg-red-100 border-red-200',
      icon: 'bg-red-100 text-red-600',
      text: 'text-red-900',
    },
    warning: {
      bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
      icon: 'bg-amber-100 text-amber-600',
      text: 'text-amber-900',
    },
    info: {
      bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
      icon: 'bg-blue-100 text-blue-600',
      text: 'text-blue-900',
    },
  };

  return (
    <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shadow-sm">
          <Sparkles size={18} strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-base font-bold text-violet-900">Acciones Recomendadas</h3>
          <p className="text-xs text-violet-600">Basado en tu estado actual</p>
        </div>
      </div>

      <div className="space-y-3">
        {actions.map((action) => {
          const styles = variantStyles[action.variant];
          return (
            <button
              key={action.id}
              onClick={action.action}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.02] hover:shadow-md border ${styles.bg}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${styles.icon}`}>
                {action.icon}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className={`text-sm font-bold ${styles.text} truncate`}>{action.title}</p>
                <p className="text-xs text-gray-600 mt-0.5 truncate">{action.description}</p>
              </div>
              <ArrowRight size={16} className="text-gray-400 shrink-0" />
            </button>
          );
        })}
      </div>
    </Card>
  );
}
