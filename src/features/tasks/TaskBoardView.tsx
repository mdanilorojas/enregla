import { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDateRelative, daysUntil } from '@/lib/dates';
import type { TaskStatus } from '@/types';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  User,
  Building2,
  Calendar,
  ChevronRight,
} from 'lucide-react';

const STATUS_LABELS: Record<TaskStatus, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En Progreso',
  completada: 'Completada',
  bloqueada: 'Bloqueada',
};

const PRIORITY_LABELS: Record<string, string> = {
  critica: 'Crítica',
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

export function TaskBoardView() {
  const { tasks, locations, permits, updateTaskStatus } = useAppStore();
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, typeof tasks> = {
      pendiente: [],
      en_progreso: [],
      completada: [],
      bloqueada: [],
    };

    tasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    return grouped;
  }, [tasks]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completada').length;
    const inProgress = tasks.filter((t) => t.status === 'en_progreso').length;
    const pending = tasks.filter((t) => t.status === 'pendiente').length;
    const overdue = tasks.filter((t) => t.dueDate && daysUntil(t.dueDate) < 0 && t.status !== 'completada').length;

    return { total, completed, inProgress, pending, overdue };
  }, [tasks]);

  // Get next action (highest priority pending task)
  const nextAction = useMemo(() => {
    const priorityOrder: Record<string, number> = {
      critica: 0,
      alta: 1,
      media: 2,
      baja: 3,
    };

    return tasks
      .filter((t) => t.status === 'pendiente')
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])[0];
  }, [tasks]);

  // Get permit-related alerts
  const alerts = useMemo(() => {
    const expiredPermits = permits.filter((p) => {
      if (!p.expiryDate) return false;
      const days = daysUntil(p.expiryDate);
      return days < 0;
    });

    const expiringPermits = permits.filter((p) => {
      if (!p.expiryDate) return false;
      const days = daysUntil(p.expiryDate);
      return days >= 0 && days <= 30;
    });

    return [
      ...expiredPermits.map((p) => ({
        id: p.id,
        type: 'expired' as const,
        permitId: p.id,
        locationId: p.locationId,
        message: 'Permiso vencido',
        days: daysUntil(p.expiryDate!),
      })),
      ...expiringPermits.map((p) => ({
        id: p.id,
        type: 'expiring' as const,
        permitId: p.id,
        locationId: p.locationId,
        message: 'Próximo a vencer',
        days: daysUntil(p.expiryDate!),
      })),
    ];
  }, [permits]);

  const getPriorityVariant = (priority: string): 'risk-critico' | 'risk-alto' | 'risk-medio' | 'risk-bajo' => {
    const map: Record<string, 'risk-critico' | 'risk-alto' | 'risk-medio' | 'risk-bajo'> = {
      critica: 'risk-critico',
      alta: 'risk-alto',
      media: 'risk-medio',
      baja: 'risk-bajo',
    };
    return map[priority] || 'risk-bajo';
  };

  const handleToggleTask = (taskId: string, currentStatus: TaskStatus) => {
    const newStatus: TaskStatus = currentStatus === 'completada' ? 'pendiente' : 'completada';
    updateTaskStatus(taskId, newStatus);
  };

  const filteredTasks = selectedStatus === 'all' ? tasks : tasksByStatus[selectedStatus];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <ListTodo size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Tareas
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {stats.total} tareas · {stats.completed} completadas
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
                <p className="text-3xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <ListTodo size={32} className="text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">
                  En Progreso
                </p>
                <p className="text-3xl font-bold text-blue-700">
                  {stats.inProgress}
                </p>
              </div>
              <Clock size={32} className="text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-1">
                  Completadas
                </p>
                <p className="text-3xl font-bold text-emerald-700">
                  {stats.completed}
                </p>
              </div>
              <CheckCircle2 size={32} className="text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-600 uppercase tracking-wider mb-1">
                  Vencidas
                </p>
                <p className="text-3xl font-bold text-red-700">
                  {stats.overdue}
                </p>
              </div>
              <AlertTriangle size={32} className="text-red-400" />
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
                    Siguiente Acción
                  </h3>
                  <Badge variant={getPriorityVariant(nextAction.priority)}>
                    {PRIORITY_LABELS[nextAction.priority]}
                  </Badge>
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  {nextAction.title}
                </p>
                <div className="flex items-center gap-3 flex-wrap text-xs text-gray-600">
                  {nextAction.locationId && (
                    <div className="flex items-center gap-1.5">
                      <Building2 size={12} />
                      {locations.find((l) => l.id === nextAction.locationId)?.name || 'Sin sede'}
                    </div>
                  )}
                  {nextAction.assignee && (
                    <>
                      <span className="text-gray-300">•</span>
                      <div className="flex items-center gap-1.5">
                        <User size={12} />
                        {nextAction.assignee}
                      </div>
                    </>
                  )}
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
                onClick={() => handleToggleTask(nextAction.id, nextAction.status)}
              >
                Marcar como Completada
                <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Main Board */}
        <div className="col-span-2 space-y-6">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Button
              variant={selectedStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('all')}
            >
              Todas ({stats.total})
            </Button>
            <Button
              variant={selectedStatus === 'pendiente' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('pendiente')}
            >
              Pendiente ({stats.pending})
            </Button>
            <Button
              variant={selectedStatus === 'en_progreso' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('en_progreso')}
            >
              En Progreso ({stats.inProgress})
            </Button>
            <Button
              variant={selectedStatus === 'completada' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('completada')}
            >
              Completada ({stats.completed})
            </Button>
          </div>

          {/* Task List */}
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const location = locations.find((l) => l.id === task.locationId);
              const isOverdue = task.dueDate && daysUntil(task.dueDate) < 0 && task.status !== 'completada';

              return (
                <Card
                  key={task.id}
                  className={`transition-all ${
                    task.status === 'completada' ? 'opacity-60' : ''
                  } ${isOverdue ? 'border-red-300' : ''}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={task.status === 'completada'}
                        onCheckedChange={() => handleToggleTask(task.id, task.status)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3
                            className={`text-sm font-semibold ${
                              task.status === 'completada'
                                ? 'line-through text-gray-500'
                                : 'text-gray-900'
                            }`}
                          >
                            {task.title}
                          </h3>
                          <Badge variant={getPriorityVariant(task.priority)}>
                            {PRIORITY_LABELS[task.priority]}
                          </Badge>
                          {task.status === 'en_progreso' && (
                            <Badge variant="info">En Progreso</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
                          {location && (
                            <div className="flex items-center gap-1.5">
                              <Building2 size={12} />
                              {location.name}
                            </div>
                          )}
                          {task.assignee && (
                            <>
                              <span className="text-gray-300">•</span>
                              <div className="flex items-center gap-1.5">
                                <User size={12} />
                                {task.assignee}
                              </div>
                            </>
                          )}
                          {task.dueDate && (
                            <>
                              <span className="text-gray-300">•</span>
                              <div
                                className={`flex items-center gap-1.5 ${
                                  isOverdue ? 'text-red-600 font-medium' : ''
                                }`}
                              >
                                <Calendar size={12} />
                                {formatDateRelative(task.dueDate)}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <ListTodo size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                No hay tareas{selectedStatus !== 'all' ? ` en estado "${STATUS_LABELS[selectedStatus]}"` : ''}
              </p>
              <p className="text-sm text-gray-400">
                Las tareas aparecerán aquí a medida que se agreguen
              </p>
            </div>
          )}
        </div>

        {/* Alerts Sidebar */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
            Alertas de Permisos
          </h3>

          {alerts.length === 0 && (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                  <p className="text-sm text-emerald-900">
                    Todos los permisos están vigentes
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {alerts.map((alert) => {
            const location = locations.find((l) => l.id === alert.locationId);

            return (
              <Card
                key={alert.id}
                className={
                  alert.type === 'expired'
                    ? 'border-red-200 bg-red-50'
                    : 'border-amber-200 bg-amber-50'
                }
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    {alert.type === 'expired' ? (
                      <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                    ) : (
                      <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold mb-1 ${
                          alert.type === 'expired' ? 'text-red-900' : 'text-amber-900'
                        }`}
                      >
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-600 mb-2">
                        {location?.name || 'Sin sede'}
                      </p>
                      <p
                        className={`text-xs font-medium ${
                          alert.type === 'expired' ? 'text-red-600' : 'text-amber-600'
                        }`}
                      >
                        {alert.type === 'expired'
                          ? `Vencido hace ${Math.abs(alert.days)} días`
                          : `Vence en ${alert.days} días`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
