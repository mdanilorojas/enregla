import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { Card, Badge, StatusDot, EmptyState, LegalPill } from '@/components/ui';
import {
  PERMIT_TYPE_LABELS,
  PERMIT_STATUS_LABELS,
} from '@/types';
import { formatDateRelative, daysUntil } from '@/lib/dates';
import { Filter, ChevronRight, Shield } from 'lucide-react';

export function PermitListView() {
  const { permits, locations } = useAppStore();
  const navigate = useNavigate();
  const [filterSede, setFilterSede] = useState<string>('all');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterEstado, setFilterEstado] = useState<string>('all');

  const filtered = useMemo(() => {
    return permits.filter((p) => {
      if (filterSede !== 'all' && p.locationId !== filterSede) return false;
      if (filterTipo !== 'all' && p.type !== filterTipo) return false;
      if (filterEstado !== 'all' && p.status !== filterEstado) return false;
      return true;
    });
  }, [permits, filterSede, filterTipo, filterEstado]);

  const uniqueTypes = [...new Set(permits.map((p) => p.type))];
  const uniqueStatuses = [...new Set(permits.map((p) => p.status))];

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm shadow-emerald-500/10">
            <Shield size={16} strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Permisos</h2>
            <p className="text-[12px] text-gray-400 font-medium">{permits.length} permisos rastreados en {locations.length} sedes</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Filter size={14} className="text-gray-400" />
        <select
          value={filterSede}
          onChange={(e) => setFilterSede(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
        >
          <option value="all">Todas las sedes</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>

        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
        >
          <option value="all">Todos los tipos</option>
          {uniqueTypes.map((t) => (
            <option key={t} value={t}>{PERMIT_TYPE_LABELS[t]}</option>
          ))}
        </select>

        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
        >
          <option value="all">Todos los estados</option>
          {uniqueStatuses.map((s) => (
            <option key={s} value={s}>{PERMIT_STATUS_LABELS[s]}</option>
          ))}
        </select>

        {(filterSede !== 'all' || filterTipo !== 'all' || filterEstado !== 'all') && (
          <button
            onClick={() => { setFilterSede('all'); setFilterTipo('all'); setFilterEstado('all'); }}
            className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors font-medium"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {filtered.map((permit) => {
          const loc = locations.find((l) => l.id === permit.locationId);
          const isRisk = permit.status === 'vencido' || permit.status === 'no_registrado';

          return (
            <Card
              key={permit.id}
              padding="none"
              className={isRisk ? '!border-red-200' : ''}
            >
              <button
                onClick={() => navigate(`/permisos/${permit.id}`)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors group"
              >
                <StatusDot status={permit.status} pulse={permit.status === 'vencido'} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[14px] font-semibold text-gray-900">
                      {PERMIT_TYPE_LABELS[permit.type]}
                    </span>
                    <Badge variant="status" status={permit.status}>
                      {PERMIT_STATUS_LABELS[permit.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[12px] text-gray-400">{loc?.name}</span>
                    <span className="text-gray-200">·</span>
                    <span className="text-[12px] text-gray-400">{permit.issuer}</span>
                    <span className="text-gray-200">·</span>
                    <LegalPill permitType={permit.type} variant="inline" />
                  </div>
                </div>

                {permit.expiryDate && (
                  <span className={`text-[13px] font-semibold shrink-0 ${
                    daysUntil(permit.expiryDate) < 0 ? 'text-red-500' :
                    daysUntil(permit.expiryDate) <= 30 ? 'text-amber-600' :
                    'text-gray-400'
                  }`}>
                    {formatDateRelative(permit.expiryDate)}
                  </span>
                )}

                <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors" />
              </button>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <EmptyState message="Sin permisos que coincidan con los filtros seleccionados." />
        )}
      </div>
    </div>
  );
}
