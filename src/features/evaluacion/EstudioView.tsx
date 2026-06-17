import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Download, ArrowLeft, FileX, ShieldCheck } from '@/lib/lucide-icons';
import { getEvaluation } from './storage';
import { getBusinessType } from './catalog';
import { evaluateRequirements, countRequirements } from './engine';
import { RENEWAL_LABELS, type InputFieldDef, type InputValues } from './types';
import './estudio-print.css';

export function EstudioView() {
  const { id } = useParams<{ id: string }>();
  const evaluation = useMemo(() => (id ? getEvaluation(id) ?? null : null), [id]);

  const bt = useMemo(
    () => (evaluation ? getBusinessType(evaluation.businessTypeSlug) : undefined),
    [evaluation]
  );

  const results = useMemo(
    () => (bt && evaluation ? evaluateRequirements(bt, evaluation.inputs) : []),
    [bt, evaluation]
  );

  if (!evaluation || !bt) {
    return (
      <EmptyState
        icon={FileX}
        title="Estudio no encontrado"
        description="Es posible que se haya eliminado."
        action={
          <Button asChild>
            <Link to="/evaluacion">Volver a la lista</Link>
          </Button>
        }
      />
    );
  }

  const total = countRequirements(results);
  const fecha = new Date(evaluation.createdAt).toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-[var(--ds-space-300)]">
      {/* Barra de acciones (no se imprime) */}
      <div className="flex items-center justify-between gap-[var(--ds-space-200)] print:hidden">
        <Link
          to="/evaluacion"
          className="flex items-center gap-[var(--ds-space-050)] text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] hover:text-[var(--ds-text)]"
        >
          <ArrowLeft size={14} aria-hidden="true" /> Volver
        </Link>
        <Button onClick={() => window.print()}>
          <Download aria-hidden="true" />
          Generar PDF
        </Button>
      </div>

      {/* Documento */}
      <div className="estudio-doc bg-white rounded-[var(--ds-radius-200)] shadow-[var(--ds-shadow-raised)] print:shadow-none print:rounded-none p-[var(--ds-space-400)] print:p-0 space-y-[var(--ds-space-400)]">
        {/* Portada */}
        <header className="estudio-portada border-b border-[var(--ds-border)] pb-[var(--ds-space-300)]">
          <div className="flex items-center gap-[var(--ds-space-150)] mb-[var(--ds-space-300)]">
            <div className="w-10 h-10 rounded-[var(--ds-radius-200)] bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center">
              <ShieldCheck size={20} className="text-white" aria-hidden="true" />
            </div>
            <span className="text-[var(--ds-font-size-200)] font-bold text-[var(--ds-text)]">EnRegla</span>
          </div>

          <p className="text-[var(--ds-font-size-075)] font-semibold uppercase tracking-wide text-[var(--ds-text-brand)]">
            Estudio de Cumplimiento Normativo
          </p>
          <h1 className="text-[var(--ds-font-size-500)] font-bold text-[var(--ds-text)] mt-1">
            {evaluation.prospect.name}
          </h1>
          <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-2">
            {bt.name}
            {evaluation.prospect.city ? ` · ${evaluation.prospect.city}` : ''}
            {evaluation.prospect.ruc ? ` · RUC ${evaluation.prospect.ruc}` : ''}
          </p>
          <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtlest)] mt-1">
            Preparado por EnRegla · {fecha}
          </p>

          <div className="mt-[var(--ds-space-300)] inline-flex items-center gap-[var(--ds-space-100)] rounded-[var(--ds-radius-200)] bg-[var(--ds-blue-50)] px-[var(--ds-space-200)] py-[var(--ds-space-150)]">
            <span className="text-[var(--ds-font-size-400)] font-bold text-[var(--ds-text-brand)]">{total}</span>
            <span className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] max-w-[200px]">
              requisitos de cumplimiento aplican a este negocio
            </span>
          </div>
        </header>

        {/* Resumen de datos */}
        <section>
          <h2 className="text-[var(--ds-font-size-300)] font-semibold text-[var(--ds-text)] mb-[var(--ds-space-200)]">
            Resumen del negocio
          </h2>
          <dl className="grid gap-[var(--ds-space-150)] sm:grid-cols-2">
            {bt.inputFields.map((f) => (
              <div key={f.key} className="flex justify-between gap-[var(--ds-space-200)] border-b border-[var(--ds-border)] pb-[var(--ds-space-075)]">
                <dt className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">{f.label}</dt>
                <dd className="text-[var(--ds-font-size-075)] font-medium text-[var(--ds-text)] text-right">
                  {formatValue(f, evaluation.inputs)}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Requisitos por área */}
        {results.map((group) => (
          <section key={group.area} className="estudio-area">
            <h2 className="text-[var(--ds-font-size-300)] font-semibold text-[var(--ds-text)] mb-[var(--ds-space-150)]">
              {group.label}
            </h2>
            <div className="overflow-hidden rounded-[var(--ds-radius-200)] border border-[var(--ds-border)]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--ds-neutral-50)]">
                    <th className="text-[var(--ds-font-size-050)] font-semibold uppercase tracking-wide text-[var(--ds-text-subtle)] px-[var(--ds-space-200)] py-[var(--ds-space-100)]">Requisito</th>
                    <th className="text-[var(--ds-font-size-050)] font-semibold uppercase tracking-wide text-[var(--ds-text-subtle)] px-[var(--ds-space-200)] py-[var(--ds-space-100)]">Autoridad</th>
                    <th className="text-[var(--ds-font-size-050)] font-semibold uppercase tracking-wide text-[var(--ds-text-subtle)] px-[var(--ds-space-200)] py-[var(--ds-space-100)] whitespace-nowrap">Vigencia</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((req) => (
                    <tr key={req.code} className="border-t border-[var(--ds-border)] align-top">
                      <td className="px-[var(--ds-space-200)] py-[var(--ds-space-150)]">
                        <div className="flex items-center gap-[var(--ds-space-100)] flex-wrap">
                          <span className="text-[var(--ds-font-size-100)] font-medium text-[var(--ds-text)]">{req.name}</span>
                          <Badge variant={req.mandatory ? 'danger' : 'secondary'} size="sm">
                            {req.mandatory ? 'Obligatorio' : 'Recomendado'}
                          </Badge>
                        </div>
                        <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mt-1">{req.description}</p>
                        {req.legalReference && (
                          <p className="text-[var(--ds-font-size-050)] text-[var(--ds-text-subtlest)] mt-1 italic">{req.legalReference}</p>
                        )}
                      </td>
                      <td className="px-[var(--ds-space-200)] py-[var(--ds-space-150)] text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">{req.authority}</td>
                      <td className="px-[var(--ds-space-200)] py-[var(--ds-space-150)] text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] whitespace-nowrap">{RENEWAL_LABELS[req.renewal]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        {/* Cierre / pitch */}
        <section className="estudio-area rounded-[var(--ds-radius-200)] bg-[var(--ds-neutral-50)] p-[var(--ds-space-300)]">
          <h2 className="text-[var(--ds-font-size-300)] font-semibold text-[var(--ds-text)]">
            EnRegla lo gestiona por ti
          </h2>
          <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-100)] max-w-[60ch]">
            Tramitamos y renovamos cada uno de estos requisitos, y los mantenemos
            organizados y verificables en un solo lugar. Tú supervisas; nosotros nos
            encargamos de que tu operación esté siempre en regla.
          </p>
          <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtlest)] mt-[var(--ds-space-200)]">
            Este estudio es referencial; los requisitos finales dependen de la autoridad competente. · enregla.ec
          </p>
        </section>
      </div>
    </div>
  );
}

function formatValue(field: InputFieldDef, inputs: InputValues): string {
  const v = inputs[field.key];
  if (field.type === 'boolean') return v ? 'Sí' : 'No';
  if (field.type === 'multiselect') {
    const arr = Array.isArray(v) ? v : [];
    if (arr.length === 0) return '—';
    return arr
      .map((val) => field.options?.find((o) => o.value === val)?.label ?? val)
      .join(', ');
  }
  if (field.type === 'number') {
    const n = typeof v === 'number' ? v : 0;
    return field.unit ? `${n} ${field.unit}` : String(n);
  }
  return v ? String(v) : '—';
}
