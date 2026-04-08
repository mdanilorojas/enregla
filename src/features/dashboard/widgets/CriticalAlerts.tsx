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
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${
            alerts.length > 0
              ? 'bg-red-100 text-red-500 shadow-red-500/10'
              : 'bg-emerald-100 text-emerald-500 shadow-emerald-500/10'
          }`}>
            <AlertTriangle size={16} strokeWidth={1.8} />
          </div>
          <div>
            <span className="text-[14px] font-semibold text-gray-900 block leading-tight">Alertas críticas</span>
            <span className="text-[11px] text-gray-400 font-medium">{alerts.length} alertas activas</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {alerts.length > 0 && (
            <Badge variant="risk" risk="critico">{alerts.length}</Badge>
          )}
          <button
            onClick={() => navigate('/permisos')}
            className="flex items-center gap-1 text-[12px] text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            Ver
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-50">
        {alerts.map((alert) => (
          <div key={alert.id} className="px-5 py-3.5 hover:bg-red-50/30 transition-colors group">
            <div className="flex items-start gap-3.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                alert.type === 'vencido' ? 'bg-red-100 text-red-500' : 'bg-orange-100 text-orange-500'
              }`}>
                {alert.type === 'vencido' ? <ShieldAlert size={14} strokeWidth={2} /> : <ShieldOff size={14} strokeWidth={2} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[13px] font-semibold text-gray-900">{alert.permitType}</p>
                  <LegalPill permitType={alert.permitTypeKey} variant="inline" />
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">{alert.locationName}</p>
                <p className={`text-[11px] mt-1.5 font-medium ${
                  alert.type === 'vencido' ? 'text-red-500' : 'text-orange-500'
                }`}>
                  {alert.message}
                </p>
              </div>
            </div>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="px-5 py-10 text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-500 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle size={18} />
            </div>
            <p className="text-[13px] text-emerald-600 font-semibold">Sin alertas críticas</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Todo bajo control</p>
          </div>
        )}
      </div>
    </Card>
  );
}
