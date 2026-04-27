import type { Node, Edge } from '@xyflow/react';
import type { Location, Permit } from '@/types/database';

interface LayoutOptions {
  locations: Location[];
  permits: Permit[];
  companyName: string;
}

const riskEdgeColor: Record<string, string> = {
  critico: '#EF4444',
  alto: '#F97316',
  medio: '#F59E0B',
  bajo: '#10B981',
};

/**
 * RADIAL LAYOUT
 * Empresa en centro, sedes orbitando en círculo.
 * Radio adaptativo: crece con más sedes.
 */
export function radialLayout({ locations, permits, companyName }: LayoutOptions) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const CENTER_X = 0;
  const CENTER_Y = 0;
  const BASE_RADIUS = 420;
  const radius = BASE_RADIUS + Math.max(0, locations.length - 6) * 30;

  // Company node (center)
  const criticalCount = locations.filter((loc) => {
    const locPermits = permits.filter((p) => p.location_id === loc.id && p.is_active);
    const expired = locPermits.filter(
      (p) => p.status === 'vencido' || p.status === 'no_registrado'
    ).length;
    return expired > 0 || loc.risk_level === 'critico' || loc.risk_level === 'alto';
  }).length;

  nodes.push({
    id: 'company',
    type: 'company',
    position: { x: CENTER_X - 160, y: CENTER_Y - 60 },
    data: {
      name: companyName,
      locationCount: locations.length,
      criticalCount,
    },
  });

  // Location nodes in circle
  const angleStep = (2 * Math.PI) / Math.max(locations.length, 1);
  const startAngle = -Math.PI / 2; // start at top

  locations.forEach((loc, i) => {
    const angle = startAngle + i * angleStep;
    const x = CENTER_X + Math.cos(angle) * radius - 140;
    const y = CENTER_Y + Math.sin(angle) * radius - 100;

    const locPermits = permits.filter((p) => p.location_id === loc.id && p.is_active);
    const expiringSoon = locPermits.filter((p) => p.status === 'por_vencer').length;
    const expired = locPermits.filter(
      (p) => p.status === 'vencido' || p.status === 'no_registrado'
    ).length;

    nodes.push({
      id: loc.id,
      type: 'location',
      position: { x, y },
      data: {
        name: loc.name,
        isMain: i === 0,
        riskLevel: loc.risk_level,
        totalPermits: locPermits.length,
        expiringSoon,
        expired,
        permits: locPermits.map((p) => ({
          id: p.id,
          type: p.type,
          status: p.status,
        })),
      },
    });

    edges.push({
      id: `company-${loc.id}`,
      source: 'company',
      target: loc.id,
      type: 'smoothstep',
      animated: loc.risk_level === 'critico' || loc.risk_level === 'alto',
      style: {
        stroke: riskEdgeColor[loc.risk_level] || '#94A3B8',
        strokeWidth: 2,
      },
    });
  });

  return { nodes, edges };
}
