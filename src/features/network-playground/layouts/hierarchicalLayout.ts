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
 * HIERARCHICAL LAYOUT
 * Empresa arriba, sedes abajo en fila/grid.
 * Auto-wrap cuando hay muchas sedes.
 */
export function hierarchicalLayout({ locations, permits, companyName }: LayoutOptions) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const SEDE_W = 300;
  const SEDE_H = 280;
  const SEDE_GAP_X = 60;
  const SEDE_GAP_Y = 80;
  const MAX_PER_ROW = 5;

  const perRow = Math.min(locations.length, MAX_PER_ROW);
  const rowWidth = perRow * SEDE_W + (perRow - 1) * SEDE_GAP_X;

  // Company centered above
  nodes.push({
    id: 'company',
    type: 'company',
    position: { x: rowWidth / 2 - 160, y: 0 },
    data: {
      name: companyName,
      locationCount: locations.length,
      criticalCount: locations.filter((l) => l.risk_level === 'critico' || l.risk_level === 'alto').length,
    },
  });

  locations.forEach((loc, i) => {
    const row = Math.floor(i / MAX_PER_ROW);
    const col = i % MAX_PER_ROW;
    const rowCount = Math.min(locations.length - row * MAX_PER_ROW, MAX_PER_ROW);
    const currentRowWidth = rowCount * SEDE_W + (rowCount - 1) * SEDE_GAP_X;
    const rowOffsetX = (rowWidth - currentRowWidth) / 2;

    const x = rowOffsetX + col * (SEDE_W + SEDE_GAP_X);
    const y = 220 + row * (SEDE_H + SEDE_GAP_Y);

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
        permits: locPermits.map((p) => ({ id: p.id, type: p.type, status: p.status })),
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
