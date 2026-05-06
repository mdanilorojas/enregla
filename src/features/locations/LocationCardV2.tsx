import { Link } from 'react-router-dom';
import { Building2 } from '@/lib/lucide-icons';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Location, Permit } from '@/types/database';

export interface LocationCardV2Props {
  location: Location;
  permits: Permit[];
}

/**
 * Generates a formatted location code from a UUID.
 * Format: SEDE-{first 8 chars}
 */
function getLocationCode(id: string): string {
  return `SEDE-${id.substring(0, Math.min(8, id.length)).toUpperCase()}`;
}

/**
 * Map location status to human-readable label
 */
function getStatusLabel(status: Location['status']): string {
  const labelMap: Record<Location['status'], string> = {
    operando: 'Operativa',
    en_preparacion: 'En preparación',
    cerrado: 'Inactiva',
  };
  return labelMap[status] || status;
}

export function LocationCardV2({ location, permits }: LocationCardV2Props) {
  const activePermits = permits.filter(p => p.is_active);
  const vigentes = activePermits.filter(p => p.status === 'vigente').length;
  const total = activePermits.length;
  const percentage = total > 0 ? (vigentes / total) * 100 : 0;

  const riskLevel: 'Bajo' | 'Medio' | 'Alto' | 'Crítico' =
    percentage >= 90 ? 'Bajo'
    : percentage >= 70 ? 'Medio'
    : percentage >= 40 ? 'Alto'
    : 'Crítico';

  const riskVariant = {
    Bajo: 'risk-bajo' as const,
    Medio: 'risk-medio' as const,
    Alto: 'risk-alto' as const,
    'Crítico': 'risk-critico' as const,
  }[riskLevel];

  const locationCode = getLocationCode(location.id);
  const statusLabel = getStatusLabel(location.status);

  return (
    <Link to={`/sedes/${location.id}`} className="block">
      <Card interactive className="p-[var(--ds-space-300)]">
        {/* Header: icon + name + code */}
        <div className="flex items-start gap-[var(--ds-space-200)] mb-[var(--ds-space-200)]">
          <div className="w-10 h-10 bg-[var(--ds-neutral-100)] rounded-[var(--ds-radius-200)] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-[var(--ds-text-subtle)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[var(--ds-font-size-200)] text-[var(--ds-text)] truncate">
              {location.name}
            </h3>
            <p className="text-[var(--ds-font-size-075)] font-mono text-[var(--ds-text-subtlest)]">
              {locationCode}
            </p>
          </div>
        </div>

        {/* Meta row: Estado | Riesgo */}
        <div className="flex items-center gap-[var(--ds-space-150)] mb-[var(--ds-space-200)] text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)]">
          <span>{statusLabel}</span>
          <span className="text-[var(--ds-border-bold)]">|</span>
          <Badge variant={riskVariant} dot>{riskLevel}</Badge>
        </div>

        {/* Permits progress */}
        <div>
          <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-075)]">
            {vigentes}/{total || 0} permisos vigentes
          </p>
          <Progress value={percentage} variant="auto" />
        </div>
      </Card>
    </Link>
  );
}
