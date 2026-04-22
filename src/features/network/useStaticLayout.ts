// src/features/network/useStaticLayout.ts
import { useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { Location, Permit } from '@/types/database';

interface UseStaticLayoutOptions {
  locations: Location[];
  permits: Permit[];
  isDesktop: boolean;
  companyName: string;
}

export function useStaticLayout({
  locations,
  permits,
  isDesktop,
  companyName,
}: UseStaticLayoutOptions) {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Edge color based on risk level
    const riskEdgeColor: Record<string, string> = {
      critico: '#EF4444',
      alto: '#F97316',
      medio: '#F59E0B',
      bajo: '#10B981',
    };

    // Layout constants
    const SEDE_SPACING = 320;
    const COMPANY_Y = 0;
    const SEDE_Y = 280;

    // Calculate how many locations have critical/alert status
    const criticalLocationCount = locations.filter(loc => {
      const locPermits = permits.filter(p => p.location_id === loc.id && p.is_active);
      const expired = locPermits.filter(p => p.status === 'vencido' || p.status === 'no_registrado').length;
      return expired > 0 || loc.risk_level === 'critico' || loc.risk_level === 'alto';
    }).length;

    // Company node centered above locations
    const totalWidth = Math.max((locations.length - 1) * SEDE_SPACING, 0);
    nodes.push({
      id: 'company',
      type: 'company',
      position: { x: totalWidth / 2, y: COMPANY_Y },
      data: {
        name: companyName,
        locationCount: locations.length,
        criticalCount: criticalLocationCount,
      },
    });

    // Location nodes in horizontal row
    locations.forEach((loc, i) => {
      const locPermits = permits.filter(p => p.location_id === loc.id && p.is_active);
      const expiringSoon = locPermits.filter(p => p.status === 'por_vencer').length;
      const expired = locPermits.filter(p => p.status === 'vencido' || p.status === 'no_registrado').length;

      // Build permit info for the card
      const permitInfos = locPermits.map(p => ({
        id: p.id,
        type: p.type,
        status: p.status,
      }));

      const sedeX = i * SEDE_SPACING;

      nodes.push({
        id: loc.id,
        type: 'location',
        position: { x: sedeX, y: SEDE_Y },
        data: {
          name: loc.name,
          isMain: i === 0, // first location treated as main (or use a flag if available)
          riskLevel: loc.risk_level,
          totalPermits: locPermits.length,
          expiringSoon,
          expired,
          permits: permitInfos,
        },
      });

      // Edge from company to location
      edges.push({
        id: `company-${loc.id}`,
        source: 'company',
        target: loc.id,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'straight',
        style: {
          stroke: riskEdgeColor[loc.risk_level] || '#94A3B8',
          strokeWidth: 2,
        },
      });
    });

    return { nodes, edges };
  }, [locations, permits, isDesktop, companyName]);

  return { nodes, edges };
}
