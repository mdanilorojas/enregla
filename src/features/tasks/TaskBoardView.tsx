import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocations } from '@/hooks/useLocations';
import { usePermits } from '@/hooks/usePermits';
import { useCompanyDocuments } from '@/hooks/useCompanyDocuments';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateRelative, daysUntil } from '@/lib/dates';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  Building2,
  Calendar,
  ChevronRight,
  FileText,
  XCircle,
} from 'lucide-react';

type TaskKind = 'vencido' | 'por_vencer' | 'faltante';
type TaskFilter = 'all' | TaskKind;

interface DerivedTask {
  id: string;
  kind: TaskKind;
  title: string;
  permitId: string;
  permitType: string;
  locationId: string;
  dueDate: string | null;
  days: number | null;
  priority: 'critica' | 'alta' | 'media' | 'baja';
}

const KIND_LABELS: Record<TaskKind, string> = {
  vencido: 'Vencido',
  por_vencer: 'Por vencer',
  faltante: 'Documentación faltante',
};

const PRIORITY_LABELS: Record<DerivedTask['priority'], string> = {
  critica: 'Crítica',
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

export function TaskBoardView() {
  const navigate = useNavigate();
  const { companyId } = useAuth();
  const { locations, loading: loadingLocations } = useLocations(companyId);
  const { permits, loading: loadingPermits } = usePermits({ companyId });
  const { documents, loading: loadingDocs } = useCompanyDocuments(companyId);
  const [filter, setFilter] = useState<TaskFilter>('all');

  const loading = loadingLocations || loadingPermits || loadingDocs;

  // Derive tasks from real permit and document data
  const tasks = useMemo<DerivedTask[]>(() => {
    const permitIdsWithDocs = new Set(documents.map((d) => d.permit_id));
    const out: DerivedTask[] = [];

    permits
      .filter((p) => p.is_active)
      .forEach((permit) => {
        // Task type 1: Vencido
        if (permit.status === 'vencido') {
          const days = permit.expiry_date ? daysUntil(permit.expiry_date) : null;
          out.push({
            id: `vencido-${permit.id}`,
            kind: 'vencido',
            title: `Renovar ${permit.type}`,
            permitId: permit.id,
            permitType: permit.type,
            locationId: permit.location_id,
            dueDate: permit.expiry_date,
            days,
            priority: 'critica',
          });
          return;
        }

        // Task type 2: Por vencer (≤30 días)
        if (permit.expiry_date && permit.status !== 'no_registrado') {
          const days = daysUntil(permit.expiry_date);
          if (days >= 0 && days <= 30) {
            out.push({
              id: `por_vencer-${permit.id}`,
              kind: 'por_vencer',
              title: `Renovar ${permit.type}`,
              permitId: permit.id,
              permitType: permit.type,
              locationId: permit.location_id,
              dueDate: permit.expiry_date,
              days,
              priority: days <= 7 ? 'critica' : days <= 15 ? 'alta' : 'media',
            });
          }
        }

        // Task type 3: Faltante (permiso activo sin documento)
        if (!permitIdsWithDocs.has(permit.id) && permit.status === 'no_registrado') {
          out.push({
            id: `faltante-${permit.id}`,
            kind: 'faltante',
            title: `Subir documento de ${permit.type}`,
            permitId: permit.id,
            permitType: permit.type,
            locationId: permit.location_id,
            dueDate: null,
            days: null,
            priority: 'media',
          });
        }
      });

    // Sort: critico primero, luego por días restantes
    const priorityOrder: Record<DerivedTask['priority'], number> = {
      critica: 0,
      alta: 1,
      media: 2,
      baja: 3,
    };
    return out.sort((a, b) => {
      const pd = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pd !== 0) return pd;
      return (a.days ?? 999) - (b.days ?? 999);
    });
  }, [permits, documents]);

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      vencidos: tasks.filter((t) => t.kind === 'vencido').length,
      porVencer: tasks.filter((t) => t.kind === 'por_vencer').length,
      faltantes: tasks.filter((t) => t.kind === 'faltante').length,
    };
  }, [tasks]);

  const filteredTasks = filter === 'all' ? tasks : tasks.filter((t) => t.kind === filter);
  const nextAction = tasks[0];

  const getPriorityVariant = (
    priority: DerivedTask['priority']
  ): 'risk-critico' | 'risk-alto' | 'risk-medio' | 'risk-bajo' => {
    const map: Record<DerivedTask['priority'], 'risk-critico' | 'risk-alto' | 'risk-medio' | 'risk-bajo'> = {
      critica: 'risk-critico',
      alta: 'risk-alto',
      media: 'risk-medio',
      baja: 'risk-bajo',
    };
    return map[priority];
  };

  const getKindIcon = (kind: TaskKind) => {
    if (kind === 'vencido') return <XCircle size={14} className="text-red-600" />;
    if (kind === 'por_vencer') return <Clock size={14} className="text-amber-600" />;
    return <FileText size={14} className="text-gray-600" />;
  };

  const handleNavigateToPermit = (permitId: string) => {
    navigate(`/permisos/${permitId}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <ListTodo size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tareas</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {stats.total} acciones requeridas · derivadas de permisos y documentos
            </p>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-gray-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
                  Total
                </p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <ListTodo size={32} className="text-gray-400" />
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
                <p className="text-3xl font-bold text-red-700">{stats.vencidos}</p>
              </div>
              <XCircle size={32} className="text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-1">
                  Por vencer
                </p>
                <p className="text-3xl font-bold text-amber-700">{stats.porVencer}</p>
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
                  Faltantes
                </p>
                <p className="text-3xl font-bold text-blue-700">{stats.faltantes}</p>
              </div>
              <FileText size={32} className="text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Action Card */}
      {nextAction && (
        <Card className="border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                    Siguiente acción
                  </h3>
                  <Badge variant={getPriorityVariant(nextAction.priority)}>
                    {PRIORITY_LABELS[nextAction.priority]}
                  </Badge>
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">{nextAction.title}</p>
                <div className="flex items-center gap-3 flex-wrap text-xs text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Building2 size={12} />
                    {locations.find((l) => l.id === nextAction.locationId)?.name || 'Sin sede'}
                  </div>
                  {nextAction.dueDate && (
                    <>
                      <span className="text-gray-300">•</span>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {formatDateRelative(nextAction.dueDate)}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 shrink-0"
                onClick={() => handleNavigateToPermit(nextAction.permitId)}
              >
                Ir al permiso
                <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Todas ({stats.total})
        </Button>
        <Button
          variant={filter === 'vencido' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('vencido')}
        >
          Vencidos ({stats.vencidos})
        </Button>
        <Button
          variant={filter === 'por_vencer' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('por_vencer')}
        >
          Por vencer ({stats.porVencer})
        </Button>
        <Button
          variant={filter === 'faltante' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('faltante')}
        >
          Faltantes ({stats.faltantes})
        </Button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const location = locations.find((l) => l.id === task.locationId);
          const isOverdue = task.days !== null && task.days < 0;

          return (
            <Card
              key={task.id}
              className={`transition-all cursor-pointer hover:shadow-md ${
                isOverdue ? 'border-red-300' : ''
              }`}
              onClick={() => handleNavigateToPermit(task.permitId)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                    {getKindIcon(task.kind)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-semibold text-gray-900">{task.title}</h3>
                      <Badge variant={getPriorityVariant(task.priority)}>
                        {PRIORITY_LABELS[task.priority]}
                      </Badge>
                      <Badge variant="secondary">{KIND_LABELS[task.kind]}</Badge>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
                      {location && (
                        <div className="flex items-center gap-1.5">
                          <Building2 size={12} />
                          {location.name}
                        </div>
                      )}
                      {task.dueDate && (
                        <>
                          <span className="text-gray-300">•</span>
                          <div
                            className={`flex items-center gap-1.5 ${
                              isOverdue
                                ? 'text-red-600 font-medium'
                                : task.days !== null && task.days <= 15
                                ? 'text-amber-600 font-medium'
                                : ''
                            }`}
                          >
                            <Calendar size={12} />
                            {formatDateRelative(task.dueDate)}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          {stats.total === 0 ? (
            <>
              <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
              <p className="text-gray-700 font-medium mb-2">Todo al día</p>
              <p className="text-sm text-gray-400">
                No hay permisos vencidos, por vencer o sin documentación
              </p>
            </>
          ) : (
            <>
              <AlertTriangle size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No hay tareas en este filtro</p>
              <p className="text-sm text-gray-400">Cambia el filtro para ver otras tareas</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
