import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Scale } from '@/lib/lucide-icons';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PermitCard } from './PermitCard';
import { CategoryChips, type ChipValue } from './CategoryChips';
import { LegalDisclaimer } from './LegalDisclaimer';
import { useAuth } from '@/hooks/useAuth';
import { resolveCompanyId } from '@/lib/demo';
import { useCompany } from '@/hooks/useCompany';
import { useLegalReferences, type LegalReferenceRow } from '@/lib/domain/legal-references-db';
import { PERMIT_TO_CATEGORY } from '@/data/legal-references';
import { PERMIT_TYPE_LABELS } from '@/types';
import type { LegalReference, PermitType } from '@/types';

function isKnownPermitType(pt: string): pt is PermitType {
  return pt in PERMIT_TYPE_LABELS;
}

/**
 * Adapts a DB legal_references row to the legacy LegalReference shape
 * consumed by PermitCard/LegalPermitDetailView. Fields that don't exist
 * in the DB (sources[], consequences[], requiredDocuments[], typicalProcess[])
 * are populated minimally from DB columns so the existing UI keeps working.
 */
function toLegalReference(row: LegalReferenceRow): LegalReference | null {
  if (!isKnownPermitType(row.permit_type)) return null;
  const portalName = row.government_portal_name ?? '';
  const portalUrl = row.government_portal_url ?? undefined;
  return {
    permitType: row.permit_type,
    description: row.description,
    sources: [
      {
        name: portalName || 'Portal oficial',
        shortName: portalName || 'Portal',
        type: 'normativa',
        url: portalUrl,
        entity: portalName || '—',
        scope: 'nacional',
      },
    ],
    frequencyBasis: row.frequency_basis,
    consequences: [],
    requiredDocuments: [],
    typicalProcess: [],
    estimatedCost: row.estimated_cost ?? undefined,
    disclaimer: row.disclaimer ?? undefined,
  };
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function normalize(s: string): string {
  return stripAccents(s).toLowerCase().trim();
}

export function LegalIndexView() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ChipValue>('all');
  const [showAll, setShowAll] = useState(false);

  const { companyId: authCompanyId } = useAuth();
  const companyId = resolveCompanyId(authCompanyId) ?? undefined;
  const { data: company } = useCompany(companyId);

  const filter = showAll ? null : company?.business_type ?? null;
  const { data: rows } = useLegalReferences(filter);

  const allRefs = useMemo<LegalReference[]>(() => {
    return (rows ?? [])
      .map(toLegalReference)
      .filter((r): r is LegalReference => r !== null);
  }, [rows]);

  const totalCount = allRefs.length;

  const results = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed) {
      const q = normalize(trimmed);
      return allRefs.filter((ref) => {
        const haystack = [
          PERMIT_TYPE_LABELS[ref.permitType],
          ref.description,
          ref.sources.map((s) => `${s.name} ${s.shortName} ${s.entity}`).join(' '),
        ]
          .map(normalize)
          .join(' ');
        return haystack.includes(q);
      });
    }
    if (activeCategory === 'all') return allRefs;
    return allRefs.filter((ref) => PERMIT_TO_CATEGORY[ref.permitType] === activeCategory);
  }, [query, activeCategory, allRefs]);

  const searching = query.trim().length > 0;
  const hasBusinessType = !!company?.business_type;

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
      <div className="max-w-6xl mx-auto space-y-[var(--ds-space-300)]">
        <header>
          <div className="flex items-center gap-[var(--ds-space-200)]">
            <div className="w-10 h-10 rounded-[var(--ds-radius-100)] bg-[var(--ds-background-brand)] text-white flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-[var(--ds-font-size-500)] font-bold text-[var(--ds-text)] tracking-tight">
                Marco Legal
              </h1>
              <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)]">
                {totalCount} permisos registrados · Referencia de normativa ecuatoriana
              </p>
            </div>
          </div>
        </header>

        <LegalDisclaimer />

        <div className="flex flex-wrap items-center justify-between gap-[var(--ds-space-200)]">
          {hasBusinessType ? (
            <label className="flex items-center gap-[var(--ds-space-100)] text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] cursor-pointer">
              <Checkbox
                checked={showAll}
                onCheckedChange={(v) => setShowAll(v === true)}
                aria-label="Ver todos los permisos (no solo los de mi giro)"
              />
              <span>Ver todos los permisos (no solo los de mi giro)</span>
            </label>
          ) : (
            <span className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
              Mostrando todos los permisos
            </span>
          )}
          <Link
            to="/marco-legal/matriz"
            className="text-[var(--ds-font-size-075)] font-medium text-[var(--ds-background-brand)] hover:underline"
          >
            Ver matriz completa
          </Link>
        </div>

        <div className="relative">
          <Search className="absolute left-[var(--ds-space-200)] top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ds-text-muted)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar normativa, permiso o entidad (ej: RUC, bomberos, patente)"
            aria-label="Buscar en el marco legal"
            className="w-full bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] pl-[var(--ds-space-500)] pr-[var(--ds-space-300)] py-[var(--ds-space-200)] text-[var(--ds-font-size-100)] text-[var(--ds-text)] placeholder:text-[var(--ds-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-background-brand)]/20 focus:border-[var(--ds-border-bold)] transition-all"
          />
        </div>

        {!searching && (
          <CategoryChips
            active={activeCategory}
            totalCount={totalCount}
            onChange={setActiveCategory}
          />
        )}

        {results.length === 0 ? (
          <EmptyState
            searching={searching}
            onClear={() => {
              setQuery('');
              setActiveCategory('all');
            }}
          />
        ) : (
          <>
            <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
              {searching
                ? `${results.length} resultado${results.length === 1 ? '' : 's'} para "${query.trim()}"`
                : activeCategory === 'all'
                ? `Mostrando todos los permisos (${results.length})`
                : `${results.length} permiso${results.length === 1 ? '' : 's'} en esta categoría`}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--ds-space-200)]">
              {results.map((ref) => (
                <PermitCard key={ref.permitType} reference={ref} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  searching,
  onClear,
}: {
  searching: boolean;
  onClear: () => void;
}) {
  return (
    <div className="bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] p-[var(--ds-space-500)] text-center">
      <div className="w-12 h-12 mx-auto rounded-full bg-[var(--ds-neutral-50)] flex items-center justify-center mb-[var(--ds-space-200)]">
        <Search className="w-5 h-5 text-[var(--ds-text-muted)]" />
      </div>
      <h3 className="text-[var(--ds-font-size-200)] font-semibold text-[var(--ds-text)] mb-[var(--ds-space-075)]">
        {searching ? 'Sin resultados' : 'No hay permisos en esta categoría'}
      </h3>
      <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-250)]">
        {searching
          ? 'Probá con otras palabras o ajustá tu búsqueda.'
          : 'Esta categoría aún no tiene contenido. Próximamente.'}
      </p>
      <Button variant="secondary" onClick={onClear}>
        {searching ? 'Limpiar búsqueda' : 'Ver todos los permisos'}
      </Button>
    </div>
  );
}
