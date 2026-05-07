import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { LegalReference } from '@/types';
import { LegalSourceCard } from './LegalSourceCard';

type TabId = 'resumen' | 'legal' | 'proceso' | 'riesgos';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'legal', label: 'Legal' },
  { id: 'proceso', label: 'Proceso' },
  { id: 'riesgos', label: 'Riesgos' },
];

interface PermitDetailTabsProps {
  reference: LegalReference;
}

export function PermitDetailTabs({ reference }: PermitDetailTabsProps) {
  const [active, setActive] = useState<TabId>('resumen');

  return (
    <div>
      <TabsNav active={active} onChange={setActive} />
      <div
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
        className="bg-white border border-[var(--ds-border)] border-t-0 md:border-t-0 rounded-b-[var(--ds-radius-200)] md:rounded-b-[var(--ds-radius-200)] p-[var(--ds-space-300)] md:p-[var(--ds-space-400)]"
      >
        {active === 'resumen' && <ResumenPanel reference={reference} />}
        {active === 'legal' && <LegalPanel reference={reference} />}
        {active === 'proceso' && <ProcesoPanel reference={reference} />}
        {active === 'riesgos' && <RiesgosPanel reference={reference} />}
      </div>
    </div>
  );
}

function TabsNav({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (next: TabId) => void;
}) {
  return (
    <>
      {/* Desktop: tabs clásicos */}
      <div
        role="tablist"
        aria-label="Secciones del permiso"
        className="hidden md:flex bg-white border border-[var(--ds-border)] rounded-t-[var(--ds-radius-200)] border-b-0"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => handleKeyNav(e, active, onChange)}
              className={cn(
                'px-[var(--ds-space-250)] py-[var(--ds-space-200)] text-[var(--ds-font-size-100)] font-medium transition-colors relative',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ds-background-brand)]',
                isActive
                  ? 'text-[var(--ds-text-brand)]'
                  : 'text-[var(--ds-text-subtle)] hover:text-[var(--ds-text)]'
              )}
            >
              {tab.label}
              {isActive && (
                <span
                  aria-hidden
                  className="absolute left-0 right-0 bottom-0 h-0.5 bg-[var(--ds-background-brand)]"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile: segmented control */}
      <div
        role="tablist"
        aria-label="Secciones del permiso"
        className="md:hidden grid grid-cols-4 gap-[var(--ds-space-050)] bg-[var(--ds-neutral-100)] border border-[var(--ds-border)] rounded-[var(--ds-radius-100)] p-[var(--ds-space-050)] mb-[var(--ds-space-150)]"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}-mobile`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${active}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => handleKeyNav(e, active, onChange)}
              className={cn(
                'py-[var(--ds-space-100)] px-[var(--ds-space-075)] rounded-[var(--ds-radius-050)]',
                'text-[var(--ds-font-size-075)] font-semibold transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-background-brand)]',
                isActive
                  ? 'bg-white text-[var(--ds-text-brand)] shadow-sm'
                  : 'text-[var(--ds-text-subtle)]'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </>
  );
}

function handleKeyNav(
  e: React.KeyboardEvent,
  active: TabId,
  onChange: (next: TabId) => void
) {
  const idx = TABS.findIndex((t) => t.id === active);
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    onChange(TABS[(idx + 1) % TABS.length].id);
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    onChange(TABS[(idx - 1 + TABS.length) % TABS.length].id);
  }
}

// ------- Paneles -------

function ResumenPanel({ reference }: { reference: LegalReference }) {
  return (
    <div className="space-y-[var(--ds-space-300)]">
      <section>
        <h2 className="sr-only">Descripción</h2>
        <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text)] leading-relaxed">
          {reference.description}
        </p>
      </section>

      <section>
        <h3 className="text-[var(--ds-font-size-075)] uppercase tracking-wider text-[var(--ds-text-muted)] font-semibold mb-[var(--ds-space-150)]">
          Frecuencia y vigencia
        </h3>
        <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text)] leading-relaxed">
          {reference.frequencyBasis}
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--ds-space-200)] pt-[var(--ds-space-100)]">
        <FactCard label="Emitido por" value={reference.sources[0]?.entity ?? '—'} />
        <FactCard
          label="Costo"
          value={reference.estimatedCost ?? 'No especificado'}
        />
      </div>
    </div>
  );
}

function LegalPanel({ reference }: { reference: LegalReference }) {
  if (reference.sources.length === 0) {
    return <EmptyPanel label="No hay fuentes legales registradas para este permiso." />;
  }
  return (
    <div className="space-y-[var(--ds-space-200)]">
      <h2 className="sr-only">Fuentes legales</h2>
      <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
        {reference.sources.length} fuente{reference.sources.length === 1 ? '' : 's'} aplicable{reference.sources.length === 1 ? '' : 's'} a este permiso.
      </p>
      {reference.sources.map((source, i) => (
        <LegalSourceCard key={i} source={source} />
      ))}

      {reference.disclaimer && (
        <div className="mt-[var(--ds-space-300)] p-[var(--ds-space-250)] bg-[var(--ds-orange-50)] border border-[var(--ds-orange-100)] rounded-[var(--ds-radius-100)]">
          <p className="text-[var(--ds-font-size-075)] text-[var(--ds-orange-700)] leading-relaxed">
            <strong>Alcance: </strong>
            {reference.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}

function ProcesoPanel({ reference }: { reference: LegalReference }) {
  const hasDocs = reference.requiredDocuments.length > 0;
  const hasSteps = reference.typicalProcess.length > 0;
  if (!hasDocs && !hasSteps) {
    return <EmptyPanel label="No hay información de proceso registrada." />;
  }
  return (
    <div className="space-y-[var(--ds-space-400)]">
      {hasDocs && (
        <section>
          <h3 className="text-[var(--ds-font-size-075)] uppercase tracking-wider text-[var(--ds-text-muted)] font-semibold mb-[var(--ds-space-200)]">
            Documentos requeridos
          </h3>
          <ul className="space-y-[var(--ds-space-150)]">
            {reference.requiredDocuments.map((doc, i) => (
              <li
                key={i}
                className="flex gap-[var(--ds-space-150)] text-[var(--ds-font-size-100)] text-[var(--ds-text)]"
              >
                <span className="shrink-0 w-5 h-5 rounded-full bg-[var(--ds-blue-50)] text-[var(--ds-blue-700)] flex items-center justify-center text-[var(--ds-font-size-050)] font-bold mt-0.5">
                  ✓
                </span>
                <span className="leading-relaxed">{doc}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasSteps && (
        <section>
          <h3 className="text-[var(--ds-font-size-075)] uppercase tracking-wider text-[var(--ds-text-muted)] font-semibold mb-[var(--ds-space-200)]">
            Proceso típico
          </h3>
          <ol className="space-y-[var(--ds-space-200)]">
            {reference.typicalProcess.map((step, i) => (
              <li
                key={i}
                className="flex gap-[var(--ds-space-200)] text-[var(--ds-font-size-100)] text-[var(--ds-text)]"
              >
                <span className="shrink-0 w-7 h-7 rounded-full bg-[var(--ds-background-brand)] text-white flex items-center justify-center text-[var(--ds-font-size-075)] font-bold">
                  {i + 1}
                </span>
                <span className="leading-relaxed pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function RiesgosPanel({ reference }: { reference: LegalReference }) {
  if (reference.consequences.length === 0) {
    return <EmptyPanel label="No hay consecuencias registradas." />;
  }
  return (
    <div>
      <h2 className="sr-only">Riesgos de incumplimiento</h2>
      <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text)] mb-[var(--ds-space-300)] leading-relaxed">
        Si este permiso no está vigente o no está registrado correctamente, las
        consecuencias pueden incluir:
      </p>
      <ul className="space-y-[var(--ds-space-150)]">
        {reference.consequences.map((c, i) => (
          <li
            key={i}
            className="flex gap-[var(--ds-space-200)] p-[var(--ds-space-200)] bg-[var(--ds-red-50)] border border-[var(--ds-red-100)] rounded-[var(--ds-radius-100)]"
          >
            <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--ds-red-100)] text-[var(--ds-red-700)] flex items-center justify-center text-[var(--ds-font-size-075)] font-bold">
              !
            </span>
            <span className="text-[var(--ds-font-size-100)] text-[var(--ds-red-700)] leading-relaxed">
              {c}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FactCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--ds-neutral-50)] border border-[var(--ds-border)] rounded-[var(--ds-radius-100)] p-[var(--ds-space-200)]">
      <div className="text-[var(--ds-font-size-050)] uppercase tracking-wider text-[var(--ds-text-muted)] font-semibold mb-[var(--ds-space-050)]">
        {label}
      </div>
      <div className="text-[var(--ds-font-size-100)] text-[var(--ds-text)] font-medium">
        {value}
      </div>
    </div>
  );
}

function EmptyPanel({ label }: { label: string }) {
  return (
    <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] text-center py-[var(--ds-space-400)]">
      {label}
    </p>
  );
}
