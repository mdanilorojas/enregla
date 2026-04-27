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
 * FORCE-DIRECTED-LIKE LAYOUT
 * Simula distribución física con "fuerzas" simples.
 * Sedes críticas cerca del centro, sedes saludables más afuera.
 */
export function forceLayout({ locations, permits, companyName }: LayoutOptions) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const CENTER_X = 0;
  const CENTER_Y = 0;

  nodes.push({
    id: 'company',
    type: 'company',
    position: { x: CENTER_X - 160, y: CENTER_Y - 60 },
    data: {
      name: companyName,
      locationCount: locations.length,
      criticalCount: locations.filter((l) => l.risk_level === 'critico' || l.risk_level === 'alto').length,
    },
  });

  const riskDistance: Record<string, number> = {
    critico: 380,
    alto: 480,
    medio: 600,
    bajo: 720,
  };

  // Group locations by risk
  const grouped: Record<string, Location[]> = { critico: [], alto: [], medio: [], bajo: [] };
  locations.forEach((l) => grouped[l.risk_level]?.push(l));

  let globalIndex = 0;

  Object.entries(grouped).forEach(([risk, items]) => {
    if (items.length === 0) return;
    const distance = riskDistance[risk] || 500;
    const angleSpread = (2 * Math.PI) / locations.length;
    const angleStart = globalIndex * angleSpread - Math.PI / 2;

    items.forEach((loc, i) => {
      const angle = angleStart + i * angleSpread;
      // Add subtle jitter for organic feel
      const jitterR = distance + ((i * 37) % 60) - 30;
      const x = CENTER_X + Math.cos(angle) * jitterR - 140;
      const y = CENTER_Y + Math.sin(angle) * jitterR - 100;

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
        type: 'default',
        animated: loc.risk_level === 'critico' || loc.risk_level === 'alto',
        style: {
          stroke: riskEdgeColor[loc.risk_level] || '#94A3B8',
          strokeWidth: 2,
        },
      });

      globalIndex++;
    });
  });

  return { nodes, edges };
}
