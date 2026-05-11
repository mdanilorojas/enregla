import { usePermitEvents, type PermitEvent } from '@/hooks/usePermitEvents';
import { formatDate } from '@/lib/dates';
import { FileText, Calendar, UserCheck, UserMinus, CheckCircle, Trash2 } from '@/lib/lucide-icons';

interface Props {
  permitId: string;
}

const ICON_BY_TYPE = {
  created: FileText,
  status_changed: CheckCircle,
  document_uploaded: FileText,
  document_deleted: Trash2,
  assigned: UserCheck,
  unassigned: UserMinus,
  renewed: CheckCircle,
  dates_updated: Calendar,
} as const;

function describe(e: PermitEvent): string {
  switch (e.event_type) {
    case 'created': return `Permiso creado (estado ${e.to_value})`;
    case 'status_changed': return `Estado: ${e.from_value} → ${e.to_value}`;
    case 'document_uploaded': return `Documento subido: ${e.to_value}`;
    case 'document_deleted': return `Documento eliminado: ${e.from_value}`;
    case 'assigned': return `Asignado a nuevo responsable`;
    case 'unassigned': return `Sin asignar`;
    case 'renewed': return `Renovado`;
    case 'dates_updated': return `Fechas actualizadas`;
  }
}

export function PermitEventsTimeline({ permitId }: Props) {
  const { data, isLoading } = usePermitEvents(permitId);
  if (isLoading) return <div className="text-sm text-[var(--ds-text-subtle)]">Cargando timeline...</div>;
  if (!data || data.length === 0) return <div className="text-sm text-[var(--ds-text-subtlest)] italic">Sin eventos registrados</div>;
  return (
    <ol className="flex flex-col gap-2">
      {data.map(ev => {
        const Icon = ICON_BY_TYPE[ev.event_type] ?? FileText;
        return (
          <li key={ev.id} className="flex items-start gap-2 text-sm">
            <Icon className="w-4 h-4 text-[var(--ds-text-subtle)] shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-[var(--ds-text)]">{describe(ev)}</div>
              <div className="text-xs text-[var(--ds-text-subtle)]">{formatDate(ev.created_at)}</div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
