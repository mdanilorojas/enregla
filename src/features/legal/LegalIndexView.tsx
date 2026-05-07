import { useMemo, useState } from 'react';
import { Search, Scale } from '@/lib/lucide-icons';
import { Button } from '@/components/ui/button';
import { PermitCard } from './PermitCard';
import { CategoryChips, type ChipValue } from './CategoryChips';
import { LegalDisclaimer } from './LegalDisclaimer';
import {
  getAllPermits,
  getPermitsByCategory,
  searchPermits,
} from './selectors';

export function LegalIndexView() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ChipValue>('all');

  const totalCount = useMemo(() => getAllPermits().length, []);

  const results = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed) return searchPermits(trimmed);
    return getPermitsByCategory(activeCategory);
  }, [query, activeCategory]);

  const searching = query.trim().length > 0;

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
