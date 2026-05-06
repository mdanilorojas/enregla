import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocations } from '@/hooks/useLocations';
import { usePermits } from '@/hooks/usePermits';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FileText, Plus, Download } from '@/lib/lucide-icons';
import { SkeletonList } from '@/components/ui/skeleton';
import { PermitTable, type PermitRow } from './PermitTable';
import { PermitTableFilters, type FilterState } from './PermitTableFilters';
import { exportPermitsCSV } from './exportPermitsCSV';

export function PermitListView() {
  const { profile } = useAuth();
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  const companyId = isDemoMode
    ? '50707999-f033-41c4-91c9-989966311972'
    : profile?.company_id;

  const { locations, loading: loadingLocations } = useLocations(companyId);
  const { permits, loading: loadingPermits } = usePermits({ companyId });

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    type: '',
    location: '',
  });

  const loading = loadingLocations || loadingPermits;

  const rows = useMemo<PermitRow[]>(() => {
    return permits
      .filter(p => p.is_active)
      .map(p => {
        const loc = locations.find(l => l.id === p.location_id);
        return {
          id: p.id,
          location: loc?.name ?? 'Sin sede',
          locationId: p.location_id,
          type: p.type ?? 'Sin tipo',
          status: (p.status as PermitRow['status']) ?? 'no_registrado',
          expires_at: p.expiry_date,
          authority: p.issuer ?? 'Sin autoridad',
          responsible: '-',
        };
      });
  }, [permits, locations]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (
        filters.search &&
        !`${r.location} ${r.type} ${r.authority} ${r.responsible}`
          .toLowerCase()
          .includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (filters.status && r.status !== filters.status) return false;
      if (filters.type && r.type !== filters.type) return false;
      if (filters.location && r.locationId !== filters.location) return false;
      return true;
    });
  }, [rows, filters]);

  const statuses = useMemo(() => Array.from(new Set(rows.map(r => r.status))), [rows]);
  const types = useMemo(() => Array.from(new Set(rows.map(r => r.type))), [rows]);

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
      <div className="max-w-7xl mx-auto space-y-[var(--ds-space-300)]">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-[var(--ds-font-size-500)] font-bold text-[var(--ds-text)]">
              Permisos
            </h1>
            <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-050)]">
              {rows.length} permisos registrados
            </p>
          </div>
          <div className="flex gap-[var(--ds-space-100)]">
            <Button variant="outline" onClick={() => exportPermitsCSV(filtered)}>
              <Download className="w-4 h-4" />Exportar CSV
            </Button>
            <Button variant="default">
              <Plus className="w-4 h-4" />Nuevo Permiso
            </Button>
          </div>
        </div>

        <Card className="p-[var(--ds-space-300)]">
          <PermitTableFilters
            filters={filters}
            onFiltersChange={setFilters}
            availableStatuses={statuses}
            availableTypes={types}
            availableLocations={locations.map(l => ({ id: l.id, name: l.name }))}
          />
        </Card>

        {loading ? (
          <Card className="p-[var(--ds-space-300)]" aria-busy="true" aria-label="Cargando permisos">
            <SkeletonList count={5} />
          </Card>
        ) : rows.length === 0 ? (
          <Card className="p-0">
            <EmptyState
              icon={FileText}
              title="No hay permisos registrados"
              description="Crea el primer permiso para comenzar"
              action={
                <Button variant="default">
                  <Plus className="w-4 h-4" />Nuevo Permiso
                </Button>
              }
            />
          </Card>
        ) : (
          <PermitTable data={filtered} />
        )}
      </div>
    </div>
  );
}
