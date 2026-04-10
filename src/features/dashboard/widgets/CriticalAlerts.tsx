import { useMemo } from 'react';
import type { Permit, Location, PermitType } from '@/types';
import { PERMIT_TYPE_LABELS } from '@/types';
import { Card, Badge, LegalPill } from '@/components/ui';
import { AlertTriangle, ShieldAlert, ShieldOff, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  permits: Permit[];
  locations: Location[];
}

interface AlertItem {
  id: string;
  type: 'vencido' | 'no_registrado';
  permitType: string;
  permitTypeKey: PermitType;
  locationName: string;
  message: string;
}

export function CriticalAlerts({ permits, locations }: Props) {
  const navigate = useNavigate();

  const alerts = useMemo<AlertItem[]>(() => {
    const items: AlertItem[] = [];

    permits.forEach((p) => {
      if (p.status === 'vencido' || p.status === 'no_registrado') {
        const loc = locations.find((l) => l.id === p.locationId);
        items.push({
          id: p.id,
          type: p.status,
          permitType: PERMIT_TYPE_LABELS[p.type],
          permitTypeKey: p.type,
          locationName: loc?.name || '',
          message: p.status === 'vencido'
            ? 'Permiso vencido — riesgo activo'
            : 'Permiso requerido no registrado',
        });
      }
    });

    return items;
  }, [permits, locations]);

  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
            alerts.length > 0
              ? 'bg-red-100 text-red-500 shadow-red-500/10'
              : 'bg-emerald-100 text-emerald-500 shadow-emerald-500/10'
          }`}>
            <AlertTriangle size={18} strokeWidth={2} />
          </div>
          <div>
            <span className="text-base font-bold text-gray-900 block leading-tight">Alertas críticas</span>
            <span className="text-sm text-gray-500 font-medium">{alerts.length} alertas activas</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {alerts.length > 0 && (
            <Badge variant="risk" risk="critico">{alerts.length}</Badge>
          )}
          <button
            onClick={() => navigate('/permisos')}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            Ver
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-50">
        {alerts.map((alert) => (
          <div key={alert.id} className="px-6 py-4 hover:bg-red-50/30 transition-colors group">
            <div className="flex items-start gap-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                alert.type === 'vencido' ? 'bg-red-100 text-red-500' : 'bg-orange-100 text-orange-500'
              }`}>
                {alert.type === 'vencido' ? <ShieldAlert size={16} strokeWidth={2} /> : <ShieldOff size={16} strokeWidth={2} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-gray-900">{alert.permitType}</p>
                  <LegalPill permitType={alert.permitTypeKey} variant="inline" />
                </div>
                <p className="text-sm text-gray-500 mt-1">{alert.locationName}</p>
                <p className={`text-sm mt-2 font-semibold ${
                  alert.type === 'vencido' ? 'text-red-500' : 'text-orange-500'
                }`}>
                  {alert.message}
                </p>
              </div>
            </div>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-500 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={20} />
            </div>
            <p className="text-base text-emerald-600 font-bold">Sin alertas críticas</p>
            <p className="text-sm text-gray-500 mt-1">Todo bajo control</p>
          </div>
        )}
      </div>
    </Card>
  );
}
