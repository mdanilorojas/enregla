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
 * CLUSTERED LAYOUT
 * Agrupa sedes por nivel de riesgo en "cuadrantes".
 * Crítico/Alto a la izquierda, Medio/Bajo a la derecha.
 */
export function clusteredLayout({ locations, permits, companyName }: LayoutOptions) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const clusters: Record<string, Location[]> = {
    critico: [],
    alto: [],
    medio: [],
    bajo: [],
  };

  locations.forEach((loc) => {
    clusters[loc.risk_level]?.push(loc);
  });

  const clusterConfig = [
    { key: 'critico', label: 'CRÍTICO', x: -700, y: 350, color: '#EF4444' },
    { key: 'alto', label: 'ALTO', x: -200, y: 350, color: '#F97316' },
    { key: 'medio', label: 'MEDIO', x: 300, y: 350, color: '#F59E0B' },
    { key: 'bajo', label: 'BAJO', x: 800, y: 350, color: '#10B981' },
  ];

  // Company on top center
  nodes.push({
    id: 'company',
    type: 'company',
    position: { x: 0 - 160, y: 0 },
    data: {
      name: companyName,
      locationCount: locations.length,
      criticalCount: clusters.critico.length + clusters.alto.length,
    },
  });

  clusterConfig.forEach((cluster) => {
    const items = clusters[cluster.key] || [];
    if (items.length === 0) return;

    items.forEach((loc, i) => {
      const locPermits = permits.filter((p) => p.location_id === loc.id && p.is_active);
      const expiringSoon = locPermits.filter((p) => p.status === 'por_vencer').length;
      const expired = locPermits.filter(
        (p) => p.status === 'vencido' || p.status === 'no_registrado'
      ).length;

      const row = Math.floor(i / 2);
      const col = i % 2;

      nodes.push({
        id: loc.id,
        type: 'location',
        position: {
          x: cluster.x + col * 320,
          y: cluster.y + row * 340,
        },
        data: {
          name: loc.name,
          isMain: false,
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
  });

  return { nodes, edges };
}
