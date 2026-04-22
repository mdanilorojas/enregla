import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PERMIT_TYPE_LABELS } from '@/types';
import { formatDateRelative, daysUntil, getMonthName } from '@/lib/dates';
import { parseISO } from 'date-fns';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Building2,
  User,
  ChevronRight,
} from 'lucide-react';

export function RenewalTimelineView() {
  const { renewals, permits, locations } = useAppStore();
  const navigate = useNavigate();
  const [selectedRenewals, setSelectedRenewals] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const sorted = [...renewals].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    const groups: Record<string, typeof sorted> = {};
    sorted.forEach((r) => {
      const month = getMonthName(r.dueDate);
      if (!groups[month]) groups[month] = [];
      groups[month].push(r);
    });

    return Object.entries(groups);
  }, [renewals]);

  const stats = useMemo(() => {
    const expired = renewals.filter((r) => daysUntil(r.dueDate) < 0).length;
    const urgent = renewals.filter((r) => {
      const d = daysUntil(r.dueDate);
      return d >= 0 && d <= 30;
    }).length;
    const upcoming = renewals.filter((r) => {
      const d = daysUntil(r.dueDate);
      return d > 30 && d <= 90;
    }).length;

    return { expired, urgent, upcoming };
  }, [renewals]);

  const toggleSelection = (id: string) => {
    setSelectedRenewals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getBadgeVariant = (days: number): 'risk-critico' | 'risk-alto' | 'risk-medio' | 'success' => {
    if (days < 0) return 'risk-critico';
    if (days <= 15) return 'risk-alto';
    if (days <= 30) return 'risk-medio';
    return 'success';
  };

  const getBadgeLabel = (days: number): string => {
    if (days < 0) return 'Vencido';
    if (days <= 15) return 'Urgente';
    if (days <= 30) return 'Por vencer';
    return 'Próximo';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Renovaciones
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {renewals.length} renovaciones rastreadas
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-600 uppercase tracking-wider mb-1">
                  Vencidas
                </p>
                <p className="text-3xl font-bold text-red-700">
                  {stats.expired}
                </p>
              </div>
              <AlertTriangle size={32} className="text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-1">
                  Urgentes (≤30d)
                </p>
                <p className="text-3xl font-bold text-amber-700">
                  {stats.urgent}
                </p>
              </div>
              <Clock size={32} className="text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">
                  Próximas (31-90d)
                </p>
                <p className="text-3xl font-bold text-blue-700">
                  {stats.upcoming}
                </p>
              </div>
              <CheckCircle2 size={32} className="text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch Actions */}
      {selectedRenewals.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {selectedRenewals.size} renovacion{selectedRenewals.size !== 1 ? 'es' : ''} seleccionada{selectedRenewals.size !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRenewals(new Set())}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Marcar como Renovadas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline by Month */}
      <div className="space-y-8">
        {grouped.map(([month, items]) => {
          const monthExpired = items.filter((r) => daysUntil(r.dueDate) < 0).length;
          const monthUrgent = items.filter((r) => {
            const d = daysUntil(r.dueDate);
            return d >= 0 && d <= 30;
          }).length;

          return (
            <div key={month}>
              {/* Month Header */}
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-lg font-semibold text-gray-900 capitalize">
                  {month}
                </h2>
                <div className="flex-1 h-px bg-gray-200" />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {items.length} renovacion{items.length !== 1 ? 'es' : ''}
                  </span>
                  {monthExpired > 0 && (
                    <Badge variant="risk-critico">
                      {monthExpired} vencida{monthExpired !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {monthUrgent > 0 && (
                    <Badge variant="risk-medio">
                      {monthUrgent} urgente{monthUrgent !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="flex gap-0.5 mb-4 h-2 rounded-full overflow-hidden bg-gray-100">
                {items.map((r) => {
                  const days = daysUntil(r.dueDate);
                  const color =
                    days < 0
                      ? 'bg-red-500'
                      : days <= 15
                      ? 'bg-orange-500'
                      : days <= 30
                      ? 'bg-amber-400'
                      : 'bg-emerald-400';
                  return (
                    <div
                      key={r.id}
                      className={`flex-1 ${color} first:rounded-l-full last:rounded-r-full`}
                      title={`${PERMIT_TYPE_LABELS[permits.find((p) => p.id === r.permitId)?.type || 'ruc']} - ${days} días`}
                    />
                  );
                })}
              </div>

              {/* Renewals List */}
              <div className="space-y-3">
                {items.map((r) => {
                  const permit = permits.find((p) => p.id === r.permitId);
                  const location = locations.find((l) => l.id === r.locationId);
                  const days = daysUntil(r.dueDate);
                  const isSelected = selectedRenewals.has(r.id);

                  return (
                    <Card
                      key={r.id}
                      className={`transition-all cursor-pointer hover:shadow-md ${
                        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => toggleSelection(r.id)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          {/* Date Badge */}
                          <div className="flex flex-col items-center w-16 shrink-0">
                            <span
                              className={`text-2xl font-bold tabular-nums ${
                                days < 0
                                  ? 'text-red-600'
                                  : days <= 30
                                  ? 'text-amber-600'
                                  : 'text-gray-900'
                              }`}
                            >
                              {parseISO(r.dueDate).getDate()}
                            </span>
                            <span className="text-xs text-gray-500 uppercase">
                              {parseISO(r.dueDate).toLocaleString('es', {
                                month: 'short',
                              })}
                            </span>
                          </div>

                          <div className="w-px h-12 bg-gray-200" />

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-gray-900">
                                {permit
                                  ? PERMIT_TYPE_LABELS[permit.type]
                                  : 'Renovación'}
                              </h3>
                              <Badge variant={getBadgeVariant(days)}>
                                {getBadgeLabel(days)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
                              <div className="flex items-center gap-1.5">
                                <Building2 size={12} />
                                {location?.name || 'Sin sede'}
                              </div>
                              {r.owner && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <div className="flex items-center gap-1.5">
                                    <User size={12} />
                                    {r.owner}
                                  </div>
                                </>
                              )}
                              <span className="text-gray-300">•</span>
                              <span
                                className={`font-medium ${
                                  days < 0
                                    ? 'text-red-600'
                                    : days <= 30
                                    ? 'text-amber-600'
                                    : 'text-gray-600'
                                }`}
                              >
                                {formatDateRelative(r.dueDate)}
                              </span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/permisos/${r.permitId}`);
                            }}
                          >
                            Ver permiso
                            <ChevronRight size={16} className="ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {renewals.length === 0 && (
        <div className="text-center py-12">
          <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No hay renovaciones pendientes</p>
          <p className="text-sm text-gray-400">
            Los permisos próximos a vencer aparecerán aquí
          </p>
        </div>
      )}
    </div>
  );
}
