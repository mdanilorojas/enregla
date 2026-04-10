import { useMemo } from 'react';
import type { Renewal, Permit, Location } from '@/types';
import { PERMIT_TYPE_LABELS } from '@/types';
import { Card, LegalPill } from '@/components/ui';
import { formatDateRelative, daysUntil } from '@/lib/dates';
import { CalendarClock, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  renewals: Renewal[];
  permits: Permit[];
  locations: Location[];
}

export function DeadlineStrip({ renewals, permits, locations }: Props) {
  const navigate = useNavigate();

  const upcoming = useMemo(() => {
    return renewals
      .filter((r) => r.status !== 'completado')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5)
      .map((r) => {
        const permit = permits.find((p) => p.id === r.permitId);
        const location = locations.find((l) => l.id === r.locationId);
        const days = daysUntil(r.dueDate);
        return { ...r, permit, location, days };
      });
  }, [renewals, permits, locations]);

  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm shadow-amber-500/10">
            <CalendarClock size={18} strokeWidth={2} />
          </div>
          <div>
            <span className="text-base font-bold text-gray-900 block leading-tight">Próximos vencimientos</span>
            <span className="text-sm text-gray-500 font-medium">{upcoming.length} pendientes</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/renovaciones')}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
        >
          Ver todos
          <ArrowRight size={16} />
        </button>
      </div>
      <div className="divide-y divide-gray-50">
        {upcoming.map((item) => (
          <div key={item.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors group">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              item.days < 0 ? 'bg-red-100 text-red-500' :
              item.days <= 30 ? 'bg-amber-100 text-amber-600' :
              'bg-gray-100 text-gray-400'
            }`}>
              <Clock size={16} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {item.permit ? PERMIT_TYPE_LABELS[item.permit.type] : 'Permiso'}
                </p>
                {item.permit && <LegalPill permitType={item.permit.type} variant="inline" />}
              </div>
              <p className="text-sm text-gray-500 truncate mt-1">
                {item.location?.name}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className={`text-sm font-bold whitespace-nowrap block ${
                item.days < 0 ? 'text-red-500' :
                item.days <= 30 ? 'text-amber-600' :
                'text-gray-600'
              }`}>
                {formatDateRelative(item.dueDate)}
              </span>
              {item.days < 0 && (
                <span className="text-[10px] text-red-400 font-medium">Vencido</span>
              )}
            </div>
          </div>
        ))}
        {upcoming.length === 0 && (
          <div className="px-5 py-10 text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-500 flex items-center justify-center mx-auto mb-2">
              <CalendarClock size={18} />
            </div>
            <p className="text-[13px] text-gray-500 font-medium">Sin vencimientos próximos</p>
          </div>
        )}
      </div>
    </Card>
  );
}
