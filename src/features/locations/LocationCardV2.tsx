import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Location, Permit } from '@/types/database';

interface LocationCardV2Props {
  location: Location;
  permits: Permit[];
}

// Helper functions for data processing

/**
 * Generates a formatted location code from a UUID.
 * Format: SEDE-{first 8 chars}-{chars 24-27}
 * Falls back gracefully for non-UUID IDs.
 */
function getLocationCode(id: string): string {
  if (id.length < 27) {
    return `SEDE-${id.substring(0, Math.min(8, id.length)).toUpperCase()}`;
  }
  return `SEDE-${id.substring(0, 8).toUpperCase()}-${id.substring(24, 27).toUpperCase()}`;
}

/**
 * Extract city from address string
 * Assumes city is the last comma-separated segment
 */
function getCityFromAddress(address: string | null | undefined): string {
  if (!address) return 'Sin ciudad';
  return address.split(',').pop()?.trim() || 'Sin ciudad';
}

/**
 * Get badge variant based on location status
 * Maps location status to Badge component variant prop
 */
function getStatusVariant(status: string): 'success' | 'info' | 'secondary' {
  const statusMap: Record<string, 'success' | 'info' | 'secondary'> = {
    operando: 'success',      // Verde
    en_preparacion: 'info',   // Azul
    cerrado: 'secondary',     // Gris
  };
  return statusMap[status.toLowerCase()] || 'secondary';
}

/**
 * Get risk level configuration for badge display
 * Maps risk level to Badge component variant prop
 */
function getRiskLevelConfig(riskLevel: string): {
  variant: 'risk-critico' | 'risk-alto' | 'risk-medio' | 'risk-bajo' | 'secondary';
  label: string;
} {
  const riskMap: Record<string, {
    variant: 'risk-critico' | 'risk-alto' | 'risk-medio' | 'risk-bajo' | 'secondary';
    label: string;
  }> = {
    critico: { variant: 'risk-critico', label: 'Crítica' },
    alto: { variant: 'risk-alto', label: 'Alta' },
    medio: { variant: 'risk-medio', label: 'Media' },
    bajo: { variant: 'risk-bajo', label: 'Baja' },
  };
  return riskMap[riskLevel.toLowerCase()] || { variant: 'secondary', label: 'Desconocido' };
}

/**
 * Get background color class for permit status dot
 */
function getPermitColor(status: string): string {
  const colorMap: Record<string, string> = {
    vigente: 'bg-emerald-400',
    por_vencer: 'bg-amber-400',
    vencido: 'bg-red-400',
    no_registrado: 'bg-gray-300',
    en_tramite: 'bg-blue-400',
  };
  return colorMap[status] || 'bg-gray-300';
}

/**
 * Get label for location status
 */
function getStatusLabel(status: string): string {
  const labelMap: Record<string, string> = {
    operando: 'Operando',
    en_preparacion: 'En preparación',
    cerrado: 'Cerrado',
  };
  return labelMap[status.toLowerCase()] || status;
}

export function LocationCardV2({ location, permits }: LocationCardV2Props) {
  const navigate = useNavigate();
  const locationCode = getLocationCode(location.id);
  const city = getCityFromAddress(location.address);
  const activePermits = permits.filter(p => p.is_active);
  const vigentesCount = activePermits.filter(p => p.status === 'vigente').length;

  /**
   * Navigate to location detail view on click
   */
  const handleClick = () => {
    navigate(`/sedes/${location.id}`);
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/sedes/${location.id}`);
    }
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
    >
      {/* Card Header - Icon, Name, and Code */}
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Building2 size={20} className="text-gray-500 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {location.name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {locationCode}
            </p>
          </div>
        </div>
      </CardHeader>

      {/* Card Content - Address, Status, Badges, and Permits */}
      <CardContent className="pt-0">
        {/* Address and City - Two columns */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Dirección</p>
            <p className="text-sm text-gray-900">
              {location.address || 'Sin dirección'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Ciudad</p>
            <p className="text-sm text-gray-900">{city}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 my-4" />

        {/* Estado */}
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 mb-2">Estado</p>
          <Badge variant={getStatusVariant(location.status)}>
            {getStatusLabel(location.status)}
          </Badge>
        </div>

        {/* Nivel de Riesgo */}
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 mb-2 mt-3">Nivel de Riesgo</p>
          {(() => {
            const riskConfig = getRiskLevelConfig(location.risk_level || 'bajo');
            return (
              <Badge variant={riskConfig.variant}>
                {riskConfig.label}
              </Badge>
            );
          })()}
        </div>

        {/* Permisos */}
        <div className="mt-3">
          {/* Label and counter */}
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium text-gray-500">Permisos</span>
            <span className="font-mono text-gray-900">
              {vigentesCount}/{activePermits.length}
            </span>
          </div>

          {/* Colored dots */}
          <div className="flex items-center gap-1 flex-wrap">
            {(() => {
              // Group by status
              const vigente = activePermits.filter(p => p.status === 'vigente');
              const porVencer = activePermits.filter(p => p.status === 'por_vencer');
              const vencido = activePermits.filter(p => p.status === 'vencido');
              const noRegistrado = activePermits.filter(p => p.status === 'no_registrado');

              // Order: vigente, por_vencer, vencido, no_registrado
              const orderedPermits = [
                ...vigente,
                ...porVencer,
                ...vencido,
                ...noRegistrado,
              ];

              if (orderedPermits.length === 0) {
                return null;
              }

              return orderedPermits.map((permit) => (
                <div
                  key={permit.id}
                  className={`w-2 h-2 rounded-full ${getPermitColor(permit.status)}`}
                  title={`${permit.type} - ${permit.status}`}
                />
              ));
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
