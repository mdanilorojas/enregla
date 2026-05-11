import { usePermitRequirements, type PermitRequirement } from '@/lib/domain/permit-requirements';
import { useIssuers } from '@/lib/domain/issuers';
import { BUSINESS_TYPES, businessTypeLabel } from '@/lib/domain/business-types';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { CostRangeLabel } from '@/components/ui/CostRangeLabel';

const PERMIT_ORDER = ['ruc', 'patente_municipal', 'uso_suelo', 'luae', 'bomberos', 'arcsa', 'rotulacion', 'msp'];
const PERMIT_LABELS: Record<string, string> = {
  ruc: 'RUC',
  patente_municipal: 'Patente municipal',
  uso_suelo: 'Uso de suelo',
  luae: 'LUAE',
  bomberos: 'Bomberos',
  arcsa: 'ARCSA',
  rotulacion: 'Rotulación',
  msp: 'Permiso MSP',
};

export function LegalMatrixView() {
  const { data: requirements } = usePermitRequirements();
  const { data: issuers } = useIssuers();

  const byKey = new Map<string, PermitRequirement>();
  (requirements ?? []).forEach((r) => byKey.set(`${r.business_type}|${r.permit_type}`, r));
  const issuerById = new Map((issuers ?? []).map((i) => [i.id, i]));

  const visibleGiros = BUSINESS_TYPES.filter((t) => t !== 'otro');

  function renderCell(bt: string, pt: string) {
    const r = byKey.get(`${bt}|${pt}`);
    if (!r) {
      return (
        <td key={`${bt}|${pt}`} className="text-center text-[var(--ds-text-subtlest)]">
          —
        </td>
      );
    }
    const cls = r.is_mandatory
      ? 'bg-green-600 text-white'
      : r.applies_when
      ? 'bg-blue-400 text-white'
      : 'bg-amber-500 text-white';
    const label = r.is_mandatory ? 'R' : r.applies_when ? 'T' : 'O';
    return (
      <td key={`${bt}|${pt}`} className="text-center p-2">
        <span className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${cls}`}>{label}</span>
      </td>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-[var(--ds-font-size-500)] font-bold mb-2">Matriz de permisos por giro</h1>
        <p className="text-[var(--ds-text-subtle)] mb-6 max-w-3xl">
          Esta matriz muestra qué permisos aplican a cada tipo de negocio en Quito, con su emisor,
          costo estimado y rol responsable. <strong>R</strong> = obligatorio ·{' '}
          <strong>O</strong> = opcional · <strong>T</strong> = condicional.
        </p>

        <div className="overflow-x-auto border rounded-lg bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[var(--ds-neutral-100)]">
              <tr>
                <th className="text-left p-2 min-w-[180px]">Permiso</th>
                <th className="text-left p-2">Emisor</th>
                <th className="text-left p-2">Rol</th>
                <th className="text-left p-2">Costo</th>
                {visibleGiros.map((t) => (
                  <th key={t} className="p-2 text-xs">
                    {businessTypeLabel(t)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMIT_ORDER.map((pt) => {
                const sample = (requirements ?? []).find((r) => r.permit_type === pt);
                const issuer = sample?.issuer_id ? issuerById.get(sample.issuer_id) : null;
                return (
                  <tr key={pt} className="border-t">
                    <td className="p-2 font-semibold">{PERMIT_LABELS[pt] ?? pt}</td>
                    <td className="p-2">{issuer?.short_name ?? '—'}</td>
                    <td className="p-2">{sample ? <RoleBadge role={sample.required_role} /> : null}</td>
                    <td className="p-2">
                      <CostRangeLabel min={sample?.cost_min} max={sample?.cost_max} />
                    </td>
                    {visibleGiros.map((bt) => renderCell(bt, pt))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
