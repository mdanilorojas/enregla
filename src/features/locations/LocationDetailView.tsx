import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocations } from '@/hooks/useLocations';
import { usePermits } from '@/hooks/usePermits';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RenewPermitModal } from './RenewPermitModal';
import { ShareLocationModal } from '@/features/public-links/ShareLocationModal';
import { LocationPermitsTab, type LocationPermitSummary } from './LocationPermitsTab';
import { LocationDocumentsTab } from './LocationDocumentsTab';
import { LocationHistoryTab } from './LocationHistoryTab';
import { DeleteLocationDialog } from './DeleteLocationDialog';
import { EditLocationModal } from './EditLocationModal';
import { CheckCircle2, AlertTriangle, XCircle, Share2, Trash2, Edit } from '@/lib/lucide-icons';
import { ErrorState } from '@/components/ui/error-state';
import type { Permit } from '@/types/database';

export function LocationDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { companyId } = useAuth();
  const { locations, loading: loadingLocations, error: locationsError, refetch: refetchLocations } = useLocations(companyId);
  const { permits, loading: loadingPermits, error: permitsError, refetch: refetchPermits, updatePermit } = usePermits({ companyId, locationId: id });

  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const location = useMemo(() => {
    return locations.find(loc => loc.id === id);
  }, [locations, id]);

  const locationPermits = useMemo(() => {
    return permits.filter(p => p.location_id === id && p.is_active);
  }, [permits, id]);

  const permitSummaries: LocationPermitSummary[] = useMemo(() => {
    return locationPermits.map(p => ({
      id: p.id,
      type: p.type,
      status: p.status,
      expires_at: p.expiry_date,
      is_active: p.is_active ?? true,
    }));
  }, [locationPermits]);

  const loading = loadingLocations || loadingPermits;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 w-64 bg-[var(--ds-neutral-200)] rounded animate-pulse mb-8" />
          <div className="h-48 bg-[var(--ds-neutral-200)] rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (permitsError || locationsError) {
    return (
      <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
        <div className="max-w-7xl mx-auto">
          <ErrorState
            title="No pudimos cargar la sede"
            error={permitsError ?? locationsError}
            onRetry={() => {
              void refetchPermits();
              refetchLocations();
            }}
          />
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
        <div className="max-w-7xl mx-auto text-center py-12">
          <h2 className="text-[var(--ds-font-size-400)] font-semibold text-[var(--ds-text)] mb-2">Sede no encontrada</h2>
          <Button onClick={() => navigate('/sedes')}>
            Volver a sedes
          </Button>
        </div>
      </div>
    );
  }

  const vigentes = locationPermits.filter(p => p.status === 'vigente').length;
  const porVencer = locationPermits.filter(p => p.status === 'por_vencer').length;
  const vencidos = locationPermits.filter(p => p.status === 'vencido').length;

  // Legacy handler (no longer used — RenewPermitModal ahora usa RPC renew_permit
  // por default y crea nueva versión archivando la anterior)
  void updatePermit;

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-200)] sm:p-[var(--ds-space-300)] lg:p-[var(--ds-space-400)]">
      <div className="max-w-7xl mx-auto space-y-[var(--ds-space-300)]">
        <Breadcrumb items={[
          { label: 'Inicio', href: '/' },
          { label: 'Sedes', href: '/sedes' },
          { label: location.name },
        ]} />

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-[var(--ds-space-200)]">
          <div className="min-w-0">
            <h1 className="text-[var(--ds-font-size-500)] font-bold text-[var(--ds-text)]">{location.name}</h1>
            {location.address && (
              <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-075)]">
                {location.address}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-[var(--ds-space-100)] w-full lg:w-auto">
            <Button variant="outline" onClick={() => setEditOpen(true)} className="w-full sm:w-auto">
              <Edit className="w-4 h-4" />
              Editar sede
            </Button>
            <Button variant="outline" onClick={() => setShareModalOpen(true)} className="w-full sm:w-auto">
              <Share2 className="w-4 h-4" />
              Generar QR
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(true)}
              className="w-full sm:w-auto text-[var(--ds-red-600)]"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar sede
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[var(--ds-space-300)]">
          <Card className="p-[var(--ds-space-300)]">
            <div className="flex items-center gap-[var(--ds-space-100)] text-[var(--ds-green-600)]">
              <CheckCircle2 className="w-5 h-5" />
              <span className="uppercase text-[var(--ds-font-size-075)] font-semibold">Vigentes</span>
            </div>
            <div className="text-[var(--ds-font-size-500)] font-bold mt-[var(--ds-space-100)]">{vigentes}</div>
          </Card>
          <Card className="p-[var(--ds-space-300)]">
            <div className="flex items-center gap-[var(--ds-space-100)] text-[var(--ds-orange-600)]">
              <AlertTriangle className="w-5 h-5" />
              <span className="uppercase text-[var(--ds-font-size-075)] font-semibold">Por Vencer</span>
            </div>
            <div className="text-[var(--ds-font-size-500)] font-bold mt-[var(--ds-space-100)]">{porVencer}</div>
          </Card>
          <Card className="p-[var(--ds-space-300)]">
            <div className="flex items-center gap-[var(--ds-space-100)] text-[var(--ds-red-600)]">
              <XCircle className="w-5 h-5" />
              <span className="uppercase text-[var(--ds-font-size-075)] font-semibold">Vencidos</span>
            </div>
            <div className="text-[var(--ds-font-size-500)] font-bold mt-[var(--ds-space-100)]">{vencidos}</div>
          </Card>
        </div>

        <Card className="p-[var(--ds-space-300)]">
          <Tabs defaultValue="permisos">
            <TabsList>
              <TabsTrigger value="permisos">Permisos</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>
            <TabsContent value="permisos">
              <LocationPermitsTab
                locationId={location.id}
                permits={permitSummaries}
                onRenew={(permitId) => {
                  const p = locationPermits.find((lp) => lp.id === permitId);
                  if (!p) return;
                  setSelectedPermit(p);
                  setRenewModalOpen(true);
                }}
              />
            </TabsContent>
            <TabsContent value="documentos">
              <LocationDocumentsTab locationId={location.id} />
            </TabsContent>
            <TabsContent value="historial">
              <LocationHistoryTab locationId={location.id} />
            </TabsContent>
          </Tabs>
        </Card>

        <RenewPermitModal
          permit={selectedPermit}
          open={renewModalOpen}
          onClose={() => {
            setRenewModalOpen(false);
            setSelectedPermit(null);
          }}
          onRenewed={(newPermitId) => {
            navigate(`/permisos/${newPermitId}`);
          }}
        />

        <EditLocationModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSuccess={() => {
            void refetchLocations();
          }}
          location={{
            id: location.id,
            name: location.name,
            address: location.address,
            status: location.status,
          }}
        />

        <ShareLocationModal
          locationId={location.id}
          locationName={location.name}
          locationAddress={location.address}
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
        />

        <DeleteLocationDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          locationId={location.id}
          locationName={location.name}
          permitCount={locationPermits.length}
          onDeleted={() => {
            void refetchLocations();
            navigate('/sedes');
          }}
        />
      </div>
    </div>
  );
}
