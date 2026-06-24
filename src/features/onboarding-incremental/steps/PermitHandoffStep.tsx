import { usePermits } from '@/hooks/usePermits';
import { Loader2 } from '@/lib/lucide-icons';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/ui/banner';
import { PermitHandoffCard } from '../components/PermitHandoffCard';

export interface PermitHandoffStepProps {
  companyId: string;
  locationId: string;
  locationName: string;
  businessType: string;
  leadInfo: { nombre: string; email: string; negocio: string; ciudad?: string };
  onGoToDashboard: () => void;
}

export function PermitHandoffStep({
  companyId, locationId, locationName, businessType, leadInfo, onGoToDashboard,
}: PermitHandoffStepProps) {
  const { permits, loading, updatePermit, refetch } = usePermits({ companyId, locationId });

  return (
    <div>
      <h2 className="text-[var(--ds-font-size-400)] font-semibold text-[var(--ds-text)] mb-[var(--ds-space-050)] tracking-tight">
        ¡Tu sede {locationName} está lista! 🎉
      </h2>
      <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-400)]">
        Estos son los permisos que necesitás. Si los tenés a la mano, subilos ahora. Si no, te
        decimos cómo sacarlos o los tramitamos por vos.
      </p>

      {loading && (
        <div className="flex items-center gap-[var(--ds-space-100)] text-[var(--ds-text-subtle)]">
          <Loader2 className="w-4 h-4 animate-spin" /> Generando tus permisos…
        </div>
      )}

      {!loading && permits.length === 0 && (
        <Banner variant="info">
          Tus permisos se están generando. Los vas a ver en el dashboard.
        </Banner>
      )}

      {!loading && permits.length > 0 && (
        <div className="space-y-[var(--ds-space-200)]">
          {permits.map((permit) => (
            <PermitHandoffCard
              key={permit.id}
              permit={permit}
              businessType={businessType}
              leadInfo={leadInfo}
              updatePermit={updatePermit}
              onUploaded={refetch}
            />
          ))}
        </div>
      )}

      <div className="mt-[var(--ds-space-500)] flex justify-end">
        <Button onClick={onGoToDashboard}>Ir al Dashboard</Button>
      </div>
    </div>
  );
}
