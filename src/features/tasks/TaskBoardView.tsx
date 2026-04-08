import { useMemo } from 'react';
import { useAppStore } from '@/store';
import { Card, Badge, StatusDot, Button, LegalPill } from '@/components/ui';
import { PERMIT_TYPE_LABELS } from '@/types';
import type { Task, TaskPriority } from '@/types';
import { formatDateRelative, daysUntil } from '@/lib/dates';
import { ListChecks, Bell, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

const PRIORITY_ORDER: TaskPriority[] = ['critica', 'alta', 'media', 'baja'];

const PRIORITY_SECTION_LABELS: Record<TaskPriority, string> = {
  critica: 'Acciones críticas',
  alta: 'Prioridad alta',
  media: 'Prioridad media',
  baja: 'Prioridad baja',
};

const PRIORITY_SECTION_ICONS: Record<TaskPriority, typeof AlertTriangle> = {
  critica: AlertTriangle,
  alta: Clock,
  media: ListChecks,
  baja: ListChecks,
};

export function TaskBoardView() {
  const { tasks, locations, permits, updateTaskStatus } = useAppStore();

  const activeTasks = tasks.filter((t) => t.status !== 'completada');
  const nextAction = activeTasks
    .sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority))[0];

  const grouped = useMemo(() => {
    const groups: Record<TaskPriority, Task[]> = {
      critica: [],
      alta: [],
      media: [],
      baja: [],
    };
    activeTasks.forEach((t) => groups[t.priority].push(t));
    return PRIORITY_ORDER
      .map((p) => ({ priority: p, tasks: groups[p] }))
      .filter((g) => g.tasks.length > 0);
  }, [activeTasks]);

  const alerts = useMemo(() => {
    const items: { id: string; message: string; type: 'critico' | 'alto' | 'medio'; time: string }[] = [];

    permits.forEach((p) => {
      if (p.status === 'vencido') {
        const loc = locations.find((l) => l.id === p.locationId);
        items.push({
          id: `alert-${p.id}`,
          message: `${PERMIT_TYPE_LABELS[p.type]} vencido — ${loc?.name}`,
          type: 'critico',
          time: p.expiryDate ? formatDateRelative(p.expiryDate) : '',
        });
      }
      if (p.status === 'no_registrado') {
        const loc = locations.find((l) => l.id === p.locationId);
        items.push({
          id: `alert-nr-${p.id}`,
          message: `${PERMIT_TYPE_LABELS[p.type]} no registrado — ${loc?.name}`,
          type: 'alto',
          time: '',
        });
      }
      if (p.status === 'por_vencer' && p.expiryDate) {
        const loc = locations.find((l) => l.id === p.locationId);
        items.push({
          id: `alert-pv-${p.id}`,
          message: `${PERMIT_TYPE_LABELS[p.type]} próximo a vencer — ${loc?.name}`,
          type: 'medio',
          time: formatDateRelative(p.expiryDate),
        });
      }
    });

    return items;
  }, [permits, locations]);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Tareas y alertas</h2>
        <p className="text-[13px] text-gray-500 mt-1">{activeTasks.length} tareas pendientes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {nextAction && (
            <Card className="!bg-gray-50 !border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Siguiente acción</span>
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[16px] font-semibold text-gray-900">{nextAction.title}</p>
                  <p className="text-[13px] text-gray-500 mt-1">{nextAction.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[12px] text-gray-400">
                      {locations.find((l) => l.id === nextAction.locationId)?.name}
                    </span>
                    {nextAction.assignee && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="text-[12px] text-gray-400">{nextAction.assignee}</span>
                      </>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<CheckCircle2 size={14} />}
                  onClick={() => updateTaskStatus(nextAction.id, 'completada')}
                >
                  Completar
                </Button>
              </div>
            </Card>
          )}

          {grouped.map(({ priority, tasks: groupTasks }) => {
            const SectionIcon = PRIORITY_SECTION_ICONS[priority];
            return (
              <div key={priority}>
                <div className="flex items-center gap-2.5 mb-3">
                  <SectionIcon size={16} className={
                    priority === 'critica' ? 'text-red-400' :
                    priority === 'alta' ? 'text-orange-400' :
                    'text-gray-400'
                  } />
                  <span className="text-[14px] font-semibold text-gray-700">
                    {PRIORITY_SECTION_LABELS[priority]}
                  </span>
                  <span className="text-[12px] text-gray-400 px-1.5 py-0.5 rounded-full bg-gray-100">{groupTasks.length}</span>
                </div>

                <div className="space-y-2">
                  {groupTasks.map((task) => {
                    const loc = locations.find((l) => l.id === task.locationId);
                    const taskPermit = task.permitId ? permits.find((p) => p.id === task.permitId) : null;
                    return (
                      <Card key={task.id} padding="sm">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => updateTaskStatus(task.id, 'completada')}
                            className="mt-0.5 shrink-0 group"
                          >
                            <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300 group-hover:border-gray-400 transition-colors" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-gray-900">{task.title}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[12px] text-gray-400">{loc?.name}</span>
                              {task.assignee && (
                                <>
                                  <span className="text-gray-200">·</span>
                                  <span className="text-[12px] text-gray-400">{task.assignee}</span>
                                </>
                              )}
                              {taskPermit && (
                                <>
                                  <span className="text-gray-200">·</span>
                                  <LegalPill permitType={taskPermit.type} variant="inline" />
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <Badge
                              variant="status"
                              status={
                                task.status === 'en_progreso' ? 'en_tramite' :
                                task.status === 'bloqueada' ? 'vencido' :
                                'no_registrado'
                              }
                            >
                              {task.status === 'en_progreso' ? 'En progreso' :
                               task.status === 'bloqueada' ? 'Bloqueada' : 'Pendiente'}
                            </Badge>
                            {task.dueDate && (
                              <span className={`text-[12px] ${
                                daysUntil(task.dueDate) < 0 ? 'text-red-500' :
                                daysUntil(task.dueDate) <= 7 ? 'text-yellow-600' :
                                'text-gray-400'
                              }`}>
                                {formatDateRelative(task.dueDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <Card padding="none">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
              <Bell size={16} className="text-gray-400" />
              <span className="text-[14px] font-semibold text-gray-900">Alertas del sistema</span>
            </div>
            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
              {alerts.map((alert) => (
                <div key={alert.id} className="px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start gap-2.5">
                    <StatusDot
                      status={
                        alert.type === 'critico' ? 'vencido' :
                        alert.type === 'alto' ? 'no_registrado' :
                        'por_vencer'
                      }
                      pulse={alert.type === 'critico'}
                    />
                    <div>
                      <p className="text-[13px] text-gray-700">{alert.message}</p>
                      {alert.time && (
                        <p className={`text-[12px] mt-0.5 ${
                          alert.type === 'critico' ? 'text-red-500' : 'text-gray-400'
                        }`}>
                          {alert.time}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="px-5 py-10 text-center text-[13px] text-emerald-500">
                  Sin alertas activas
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
