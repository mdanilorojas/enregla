import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  PERMIT_TYPE_LABELS,
  PERMIT_STATUS_LABELS,
} from '@/types';
import { formatDateRelative, daysUntil } from '@/lib/dates';
import {
  Filter,
  ChevronRight,
  Shield,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';

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

  const stats = useMemo(() => {
    const vigentes = permits.filter((p) => p.status === 'vigente').length;
    const vencidos = permits.filter((p) => p.status === 'vencido').length;
    const porVencer = permits.filter((p) => {
      if (!p.expiryDate || p.status === 'vencido') return false;
      return daysUntil(p.expiryDate) <= 30;
    }).length;
    const noRegistrados = permits.filter((p) => p.status === 'no_registrado').length;

    return { vigentes, vencidos, porVencer, noRegistrados };
  }, [permits]);

  const uniqueTypes = [...new Set(permits.map((p) => p.type))];
  const uniqueStatuses = [...new Set(permits.map((p) => p.status))];

  const getStatusVariant = (status: string): 'success' | 'destructive' | 'warning' | 'secondary' => {
    if (status === 'vigente') return 'success';
    if (status === 'vencido') return 'destructive';
    if (status === 'no_registrado') return 'warning';
    return 'secondary';
  };

  const hasActiveFilters = filterSede !== 'all' || filterTipo !== 'all' || filterEstado !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Permisos
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {permits.length} permisos rastreados en {locations.length} sedes
            </p>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-1">
                  Vigentes
                </p>
                <p className="text-3xl font-bold text-emerald-700">
                  {stats.vigentes}
                </p>
              </div>
              <CheckCircle2 size={32} className="text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-1">
                  Por Vencer (≤30d)
                </p>
                <p className="text-3xl font-bold text-amber-700">
                  {stats.porVencer}
                </p>
              </div>
              <Clock size={32} className="text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-600 uppercase tracking-wider mb-1">
                  Vencidos
                </p>
                <p className="text-3xl font-bold text-red-700">
                  {stats.vencidos}
                </p>
              </div>
              <AlertTriangle size={32} className="text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100 bg-gray-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
                  No Registrados
                </p>
                <p className="text-3xl font-bold text-gray-700">
                  {stats.noRegistrados}
                </p>
              </div>
              <XCircle size={32} className="text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter size={16} className="text-gray-400" />
            <select
              value={filterSede}
              onChange={(e) => setFilterSede(e.target.value)}
              className="bg-white border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
            >
              <option value="all">Todas las sedes</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>

            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="bg-white border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
            >
              <option value="all">Todos los tipos</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>{PERMIT_TYPE_LABELS[t]}</option>
              ))}
            </select>

            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="bg-white border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
            >
              <option value="all">Todos los estados</option>
              {uniqueStatuses.map((s) => (
                <option key={s} value={s}>{PERMIT_STATUS_LABELS[s]}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterSede('all');
                  setFilterTipo('all');
                  setFilterEstado('all');
                }}
              >
                Limpiar filtros
              </Button>
            )}

            <div className="ml-auto text-sm text-gray-500">
              {filtered.length === permits.length
                ? `${permits.length} ${permits.length === 1 ? 'permiso' : 'permisos'}`
                : `${filtered.length} de ${permits.length}`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permits List */}
      <div className="space-y-3">
        {filtered.map((permit) => {
          const loc = locations.find((l) => l.id === permit.locationId);
          const isRisk = permit.status === 'vencido' || permit.status === 'no_registrado';
          const daysRemaining = permit.expiryDate ? daysUntil(permit.expiryDate) : null;

          return (
            <Card
              key={permit.id}
              className={`transition-all cursor-pointer hover:shadow-md ${
                isRisk ? 'border-red-300' : ''
              }`}
              onClick={() => navigate(`/permisos/${permit.id}`)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      permit.status === 'vigente'
                        ? 'bg-emerald-500'
                        : permit.status === 'vencido'
                        ? 'bg-red-500 animate-pulse'
                        : permit.status === 'no_registrado'
                        ? 'bg-amber-500'
                        : 'bg-gray-300'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {PERMIT_TYPE_LABELS[permit.type]}
                      </h3>
                      <Badge variant={getStatusVariant(permit.status)}>
                        {PERMIT_STATUS_LABELS[permit.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={12} />
                        {loc?.name || 'Sin sede'}
                      </div>
                      <span className="text-gray-300">•</span>
                      <span>{permit.issuer}</span>
                      {permit.expiryDate && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span
                            className={`font-medium ${
                              daysRemaining !== null && daysRemaining < 0
                                ? 'text-red-600'
                                : daysRemaining !== null && daysRemaining <= 30
                                ? 'text-amber-600'
                                : ''
                            }`}
                          >
                            {formatDateRelative(permit.expiryDate)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 shrink-0" />
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Shield size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">
              {hasActiveFilters
                ? 'No hay permisos que coincidan con los filtros'
                : 'No hay permisos registrados'}
            </p>
            <p className="text-sm text-gray-400">
              {hasActiveFilters
                ? 'Intenta cambiar los filtros'
                : 'Agrega permisos desde la vista de cada sede'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
