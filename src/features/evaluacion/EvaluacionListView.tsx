import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, FileText, Trash2, ClipboardCheck } from '@/lib/lucide-icons';
import { useEvaluations, useDeleteEvaluation, useBusinessTypes } from './useEvaluacion';

export function EvaluacionListView() {
  const navigate = useNavigate();
  const { data: items, isLoading } = useEvaluations();
  const { data: types } = useBusinessTypes();
  const del = useDeleteEvaluation();

  const typeName = (slug: string) => types?.find((t) => t.slug === slug)?.name ?? slug;

  return (
    <div className="space-y-[var(--ds-space-300)]">
      <div className="flex items-start justify-between gap-[var(--ds-space-200)]">
        <div>
          <h1 className="text-[var(--ds-font-size-400)] font-semibold text-[var(--ds-text)]">
            Estudios de cumplimiento
          </h1>
          <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-1">
            Genera un estudio normativo para un prospecto y expórtalo a PDF.
          </p>
        </div>
        <Button asChild>
          <Link to="/evaluacion/nueva">
            <Plus aria-hidden="true" />
            Nueva evaluación
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-[var(--ds-space-150)]">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[72px] rounded-[var(--ds-radius-200)]" />
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Aún no hay estudios"
          description="Crea tu primera evaluación para generar un estudio de cumplimiento."
          action={
            <Button asChild>
              <Link to="/evaluacion/nueva">
                <Plus aria-hidden="true" />
                Nueva evaluación
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-[var(--ds-space-150)]">
          {items.map((ev) => (
            <Card
              key={ev.id}
              interactive
              onClick={() => navigate(`/evaluacion/${ev.id}`)}
              className="flex items-center gap-[var(--ds-space-200)] p-[var(--ds-space-200)]"
            >
              <div className="w-10 h-10 rounded-[var(--ds-radius-200)] bg-[var(--ds-blue-50)] flex items-center justify-center shrink-0">
                <FileText size={18} className="text-[var(--ds-text-brand)]" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--ds-font-size-200)] font-semibold text-[var(--ds-text)] truncate">
                  {ev.prospect.name}
                </p>
                <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] truncate">
                  {typeName(ev.businessTypeSlug)}
                  {ev.prospect.city ? ` · ${ev.prospect.city}` : ''}
                  {' · '}
                  {new Date(ev.createdAt).toLocaleDateString('es-EC')}
                </p>
              </div>
              <Button
                variant="subtle"
                size="icon"
                aria-label="Eliminar"
                onClick={(e) => {
                  e.stopPropagation();
                  del.mutate(ev.id);
                }}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
