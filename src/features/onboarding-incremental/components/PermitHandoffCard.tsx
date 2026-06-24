import { useState } from 'react';
import { Upload, FileText, ExternalLink, CheckCircle2 } from '@/lib/lucide-icons';
import { Button } from '@/components/ui/button';
import { PermitUploadForm } from '@/features/permits/PermitUploadForm';
import { useLegalReferences } from '@/lib/domain/legal-references-db';
import { permitTypeLabel } from '@/lib/domain/permit-types';
import type { BusinessType } from '@/lib/domain/business-types';
import type { Permit } from '@/types/database';
import { GetItForYouForm } from './GetItForYouForm';

export interface PermitHandoffCardProps {
  permit: Permit;
  businessType: string;
  leadInfo: { nombre: string; email: string; negocio: string; ciudad?: string };
  updatePermit: (
    permitId: string,
    updates: {
      issue_date?: string;
      expiry_date?: string | null;
      status?: 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite' | 'no_registrado';
      permit_number?: string | null;
      notes?: string | null;
    }
  ) => Promise<void>;
  onUploaded: () => void;
}

type Panel = 'none' | 'upload' | 'help';

export function PermitHandoffCard({
  permit, businessType, leadInfo, updatePermit, onUploaded,
}: PermitHandoffCardProps) {
  const [panel, setPanel] = useState<Panel>('none');
  const { data: legalRefs } = useLegalReferences(businessType as BusinessType);

  const label = permitTypeLabel(permit.type);
  const isDone = permit.status === 'vigente' || permit.status === 'por_vencer';
  const legal = legalRefs?.find((r) => r.permit_type === permit.type) ?? null;

  return (
    <div className="border border-[var(--ds-border)] rounded-[var(--ds-radius-300)] bg-white p-[var(--ds-space-250)]">
      <div className="flex items-center justify-between gap-[var(--ds-space-150)]">
        <div className="flex items-center gap-[var(--ds-space-150)] min-w-0">
          <FileText className="w-5 h-5 text-[var(--ds-text-subtle)] shrink-0" />
          <span className="text-[var(--ds-font-size-100)] font-semibold text-[var(--ds-text)] truncate">
            {label}
          </span>
          {isDone ? (
            <span className="text-[var(--ds-font-size-075)] font-semibold px-[var(--ds-space-100)] py-0.5 rounded-full bg-[var(--ds-status-vigente-bg,#f0fdf4)] text-[var(--ds-status-vigente-text,#15803d)] inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Vigente
            </span>
          ) : (
            <span className="text-[var(--ds-font-size-075)] font-semibold px-[var(--ds-space-100)] py-0.5 rounded-full bg-[var(--ds-neutral-100)] text-[var(--ds-text-subtle)]">
              Sin registrar
            </span>
          )}
        </div>
        {!isDone && (
          <div className="flex gap-[var(--ds-space-100)] shrink-0">
            <Button size="sm" onClick={() => setPanel(panel === 'upload' ? 'none' : 'upload')}>
              <Upload className="w-4 h-4" /> Subir
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPanel(panel === 'help' ? 'none' : 'help')}>
              No lo tengo
            </Button>
          </div>
        )}
      </div>

      {panel === 'upload' && !isDone && (
        <div className="mt-[var(--ds-space-200)] pt-[var(--ds-space-200)] border-t border-[var(--ds-border)]">
          <PermitUploadForm
            permit={permit}
            updatePermit={updatePermit}
            onSuccess={() => { setPanel('none'); onUploaded(); }}
            onCancel={() => setPanel('none')}
          />
        </div>
      )}

      {panel === 'help' && !isDone && (
        <div className="mt-[var(--ds-space-200)] pt-[var(--ds-space-200)] border-t border-[var(--ds-border)] space-y-[var(--ds-space-200)]">
          {legal ? (
            <div className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] space-y-1">
              <p>{legal.description}</p>
              {legal.frequency_basis && <p>Se renueva: {legal.frequency_basis}</p>}
              {legal.estimated_cost && <p>Costo estimado: {legal.estimated_cost}</p>}
              {legal.disclaimer && <p className="italic">{legal.disclaimer}</p>}
              {legal.government_portal_url && (
                <a
                  href={legal.government_portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[var(--ds-text-brand)] font-semibold"
                >
                  {legal.government_portal_name ?? 'Ir al portal del gobierno'}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ) : (
            <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
              Te ayudamos a tramitar este permiso.
            </p>
          )}

          <div className="pt-[var(--ds-space-150)] border-t border-[var(--ds-border)]">
            <h4 className="text-[var(--ds-font-size-100)] font-semibold text-[var(--ds-text)] mb-[var(--ds-space-100)]">
              ¿Lo sacamos por ti?
            </h4>
            <GetItForYouForm
              permitType={permit.type}
              permitLabel={label}
              nombre={leadInfo.nombre}
              email={leadInfo.email}
              negocio={leadInfo.negocio}
              ciudad={leadInfo.ciudad}
            />
          </div>
        </div>
      )}
    </div>
  );
}
