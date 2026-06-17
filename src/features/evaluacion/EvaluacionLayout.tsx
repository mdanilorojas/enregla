import { Outlet, Link } from 'react-router-dom';
import { ClipboardCheck, ArrowLeft } from '@/lib/lucide-icons';
import { Badge } from '@/components/ui/badge';

/** Layout aislado del de cliente. Solo visible para staff (vía StaffRoute).
 *  Sin sidebar de cliente: es la herramienta interna de venta. */
export function EvaluacionLayout() {
  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] print:bg-white">
      <header className="h-16 bg-[var(--ds-neutral-0)] border-b border-[var(--ds-border)] sticky top-0 z-20 print:hidden">
        <div className="max-w-[1100px] mx-auto h-full px-[var(--ds-space-200)] lg:px-[var(--ds-space-300)] flex items-center justify-between gap-[var(--ds-space-200)]">
          <Link
            to="/evaluacion"
            className="flex items-center gap-[var(--ds-space-150)] min-w-0"
          >
            <div className="w-9 h-9 rounded-[var(--ds-radius-200)] bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center shrink-0">
              <ClipboardCheck size={18} className="text-white" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[var(--ds-font-size-100)] font-semibold text-[var(--ds-text)] leading-none">
                Evaluación
              </p>
              <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] leading-tight">
                Estudio de cumplimiento
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-[var(--ds-space-150)]">
            <Badge variant="warning" size="sm">Herramienta interna</Badge>
            <Link
              to="/"
              className="flex items-center gap-[var(--ds-space-050)] text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] hover:text-[var(--ds-text)]"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Volver a la app
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-[var(--ds-space-200)] lg:px-[var(--ds-space-300)] py-[var(--ds-space-300)] print:p-0 print:max-w-none">
        <Outlet />
      </main>
    </div>
  );
}
