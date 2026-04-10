import type { Task, Location } from '@/types';
import { Card, Badge } from '@/components/ui';
import { formatDateRelative, daysUntil } from '@/lib/dates';
import { ListChecks, ArrowRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  tasks: Task[];
  locations: Location[];
}

export function ActionQueue({ tasks, locations }: Props) {
  const navigate = useNavigate();
  const urgentTasks = tasks
    .filter((t) => t.status !== 'completada')
    .sort((a, b) => {
      const priorityOrder = { critica: 0, alta: 1, media: 2, baja: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-sm shadow-rose-500/10">
            <Zap size={18} strokeWidth={2} />
          </div>
          <div>
            <span className="text-base font-bold text-gray-900 block leading-tight">Acciones inmediatas</span>
            <span className="text-sm text-gray-500 font-medium">{urgentTasks.length} tareas pendientes</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/tareas')}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
        >
          Ver todas
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="space-y-3">
        {urgentTasks.map((task) => {
          const loc = locations.find((l) => l.id === task.locationId);
          return (
            <Card
              key={task.id}
              padding="md"
              hover
              accent={
                task.priority === 'critica' ? 'red' :
                task.priority === 'alta' ? 'amber' :
                'none'
              }
            >
              <div className="flex items-start gap-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  task.priority === 'critica' ? 'bg-red-100 text-red-500' :
                  task.priority === 'alta' ? 'bg-amber-100 text-amber-600' :
                  task.priority === 'media' ? 'bg-blue-100 text-blue-500' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  <ListChecks size={16} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-sm text-gray-500 font-medium">{loc?.name}</span>
                    {task.assignee && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="text-sm text-gray-500">{task.assignee}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge variant="priority" priority={task.priority}>{task.priority}</Badge>
                  {task.dueDate && (
                    <span className={`text-xs font-semibold ${
                      daysUntil(task.dueDate) < 0 ? 'text-red-500' :
                      daysUntil(task.dueDate) <= 7 ? 'text-amber-600' :
                      'text-gray-500'
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
}
