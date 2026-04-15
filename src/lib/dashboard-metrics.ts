import type { Permit, Location } from '@/types/database';
import type { RiskLevel } from '@/types';
import { daysUntil } from './dates';

export interface DashboardMetrics {
  vigentes: number;
  porVencer: number;
  faltantes: number;
  vencidos: number;
  enTramite: number;
  compliance: number;
  criticalCount: number;
  companyRiskLevel: RiskLevel;
}

/**
 * Calculate metrics for dashboard from permits
 */
export function calculateDashboardMetrics(
  permits: Permit[],
  locations: Location[]
): DashboardMetrics {
  const activePermits = permits.filter((p) => p.is_active);

  const vigentes = activePermits.filter((p) => p.status === 'vigente').length;
  const porVencer = activePermits.filter((p) => p.status === 'por_vencer').length;
  const faltantes = activePermits.filter((p) => p.status === 'no_registrado').length;
  const vencidos = activePermits.filter((p) => p.status === 'vencido').length;
  const enTramite = activePermits.filter((p) => (p.status as string) === 'en_tramite').length;

  // Calculate compliance percentage
  const totalActive = activePermits.length;
  const compliant = vigentes;
  const compliance = totalActive > 0 ? Math.round((compliant / totalActive) * 100) : 0;

  // Count critical issues
  const criticalCount = vencidos + faltantes;

  // Calculate company-wide risk level
  const companyRiskLevel = calculateCompanyRiskLevel(locations);

  return {
    vigentes,
    porVencer,
    faltantes,
    vencidos,
    enTramite,
    compliance,
    criticalCount,
    companyRiskLevel,
  };
}

/**
 * Calculate risk level for a location based on its permits
 */
export function calculateLocationRiskLevel(permits: Permit[]): RiskLevel {
  const activePermits = permits.filter((p) => p.is_active);

  if (activePermits.length === 0) return 'medio';

  const hasVencidos = activePermits.some((p) => p.status === 'vencido');
  const hasFaltantes = activePermits.some((p) => p.status === 'no_registrado');
  const hasPorVencer = activePermits.some((p) => p.status === 'por_vencer');

  if (hasVencidos || hasFaltantes) return 'alto';
  if (hasPorVencer) return 'medio';
  return 'bajo';
}

/**
 * Calculate company-wide risk level from all locations
 */
export function calculateCompanyRiskLevel(locations: Location[]): RiskLevel {
  if (locations.length === 0) return 'bajo';

  const riskLevels = locations.map((l) => l.risk_level);

  if (riskLevels.includes('critico')) return 'critico';
  if (riskLevels.includes('alto')) return 'alto';
  if (riskLevels.includes('medio')) return 'medio';
  return 'bajo';
}

/**
 * Get upcoming permit renewals (sorted by expiry date)
 */
export interface UpcomingRenewal {
  permitId: string;
  permitType: string;
  locationId: string;
  locationName?: string;
  expiryDate: string;
  daysUntilExpiry: number;
  status: Permit['status'];
}

export function getUpcomingRenewals(
  permits: Permit[],
  locations: Location[],
  limit: number = 5
): UpcomingRenewal[] {
  const activePermits = permits.filter((p) => p.is_active && p.expiry_date);

  const renewals: UpcomingRenewal[] = activePermits
    .map((permit) => {
      const location = locations.find((l) => l.id === permit.location_id);
      const daysUntilExpiry = permit.expiry_date ? daysUntil(permit.expiry_date) : Infinity;

      return {
        permitId: permit.id,
        permitType: permit.type,
        locationId: permit.location_id,
        locationName: location?.name,
        expiryDate: permit.expiry_date!,
        daysUntilExpiry,
        status: permit.status,
      };
    })
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
    .slice(0, limit);

  return renewals;
}

/**
 * Get permit count by status for a location
 */
export function getLocationPermitStats(permits: Permit[]) {
  const activePermits = permits.filter((p) => p.is_active);
  const total = activePermits.length;
  const vigentes = activePermits.filter((p) => p.status === 'vigente').length;
  const porVencer = activePermits.filter((p) => p.status === 'por_vencer').length;
  const vencidos = activePermits.filter((p) => p.status === 'vencido').length;
  const faltantes = activePermits.filter((p) => p.status === 'no_registrado').length;

  return {
    total,
    vigentes,
    porVencer,
    vencidos,
    faltantes,
    criticalCount: vencidos + faltantes,
  };
}
