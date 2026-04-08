import type { RiskLevel, Permit, Location, PermitStatus } from '@/types';

const statusRiskWeight: Record<PermitStatus, number> = {
  vencido: 4,
  no_registrado: 3,
  por_vencer: 2,
  en_tramite: 1,
  vigente: 0,
};

export function calculateLocationRisk(permits: Permit[]): RiskLevel {
  if (permits.length === 0) return 'medio';
  const maxWeight = Math.max(...permits.map(p => statusRiskWeight[p.status]));
  if (maxWeight >= 4) return 'critico';
  if (maxWeight >= 3) return 'alto';
  if (maxWeight >= 2) return 'medio';
  return 'bajo';
}

export function calculateCompanyRisk(locations: Location[]): RiskLevel {
  if (locations.length === 0) return 'bajo';
  const levels: RiskLevel[] = locations.map(l => l.riskLevel);
  if (levels.includes('critico')) return 'critico';
  if (levels.includes('alto')) return 'alto';
  if (levels.includes('medio')) return 'medio';
  return 'bajo';
}

export function calculateCompliancePercentage(permits: Permit[]): number {
  if (permits.length === 0) return 0;
  const compliant = permits.filter(p => p.status === 'vigente' || p.status === 'en_tramite').length;
  return Math.round((compliant / permits.length) * 100);
}

export function countCriticalIssues(permits: Permit[]): number {
  return permits.filter(p => p.status === 'vencido' || p.status === 'no_registrado').length;
}
