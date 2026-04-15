import { useMemo, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type OnNodeDrag,
  type NodeMouseHandler,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocations } from '@/hooks/useLocations';
import { usePermits } from '@/hooks/usePermits';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useForceLayout } from '@/features/network/useForceLayout';
import { SedeNode } from '@/features/network/nodes/SedeNode';
import { PermitNode } from '@/features/network/nodes/PermitNode';
import { CompanyNode } from '@/features/network/nodes/CompanyNode';
import type { RiskLevel, PermitStatus } from '@/types';
import type { Permit } from '@/types/database';

// Node types for ReactFlow
const nodeTypes = {
  sede: SedeNode,
  permit: PermitNode,
  company: CompanyNode,
};

// Color mapping for risk levels
const riskColor: Record<RiskLevel, string> = {
  critico: '#ef4444',  // Red
  alto: '#f97316',     // Orange
  medio: '#eab308',    // Yellow
  bajo: '#22c55e',     // Green
};

// Color mapping for permit status
const statusEdgeColor: Record<PermitStatus, string> = {
  vigente: '#22c55e',       // Green
  por_vencer: '#eab308',    // Yellow
  vencido: '#ef4444',       // Red
  no_registrado: '#d1d5db', // Gray
};

/**
 * Calculate which handles to use based on node positions (for proper edge routing)
 */
function getHandlePair(sx: number, sy: number, tx: number, ty: number) {
  const angle = Math.atan2(ty - sy, tx - sx);
  if (angle >= -Math.PI / 4 && angle < Math.PI / 4) {
    return { sourceHandle: 'right', targetHandle: 'left' };
  } else if (angle >= Math.PI / 4 && angle < (3 * Math.PI) / 4) {
    return { sourceHandle: 'bottom', targetHandle: 'top' };
  } else if (angle >= -(3 * Math.PI) / 4 && angle < -Math.PI / 4) {
    return { sourceHandle: 'top', targetHandle: 'bottom' };
  }
  return { sourceHandle: 'left', targetHandle: 'right' };
}

/**
 * Calculate compliance percentage for a location's permits
 * @param permits - Array of permits for a location
 * @returns Compliance percentage (0-100)
 */
function calculateCompliance(permits: Permit[]): number {
  const active = permits.filter(p => p.is_active);
  if (active.length === 0) return 0;
  const vigentes = active.filter(p => p.status === 'vigente').length;
  return Math.round((vigentes / active.length) * 100);
}

/**
 * Count critical issues (expired or not registered permits)
 * @param permits - Array of permits for a location
 * @returns Count of critical permits
 */
function countCritical(permits: Permit[]): number {
  return permits.filter(p =>
    p.is_active && (p.status === 'vencido' || p.status === 'no_registrado')
  ).length;
}

interface NetworkMapViewV2Props {
  embedded?: boolean;
}

export function NetworkMapViewV2({ embedded = false }: NetworkMapViewV2Props) {
  const navigate = useNavigate();
  const draggingRef = useRef<string | null>(null);

  // Load data from Supabase
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  const { locations, loading: locationsLoading, error: locationsError } = useLocations(companyId);
  const { permits, loading: permitsLoading, error: permitsError } = usePermits({ companyId });

  // Combined loading and error states
  const loading = locationsLoading || permitsLoading;
  const error = locationsError || permitsError;

  // Responsive detection: desktop shows permits, mobile shows only locations
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Generate nodes and edges based on data
  const { seedNodes, seedEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (!profile?.company_id || locations.length === 0) {
      return { seedNodes: [], seedEdges: [] };
    }

    // 1. Company (HQ) node at center
    const companyPos = { x: 0, y: 0 };
    nodes.push({
      id: 'company',
      type: 'company',
      position: companyPos,
      data: {
        name: 'Empresa', // TODO: Get company name from companies table
        locationCount: locations.length,
      },
    });

    // 2. Location nodes in circle around HQ
    locations.forEach((loc, i) => {
      const locPermits = permits.filter(p => p.location_id === loc.id && p.is_active);
      const compliance = calculateCompliance(locPermits);
      const critical = countCritical(locPermits);

      // Calculate position in circle (radius 300px)
      const angle = (2 * Math.PI * i) / locations.length - Math.PI / 2;
      const sedePos = {
        x: Math.cos(angle) * 300,
        y: Math.sin(angle) * 300,
      };

      nodes.push({
        id: loc.id,
        type: 'sede',
        position: sedePos,
        data: {
          name: loc.name,
          address: loc.address,
          riskLevel: loc.risk_level,
          compliance,
          critical,
          permitCount: locPermits.length,
        },
      });

      // Edge: Company → Sede
      const compHandles = getHandlePair(companyPos.x, companyPos.y, sedePos.x, sedePos.y);
      edges.push({
        id: `company-${loc.id}`,
        source: 'company',
        target: loc.id,
        sourceHandle: compHandles.sourceHandle,
        targetHandle: compHandles.targetHandle,
        style: {
          stroke: riskColor[loc.risk_level],
          strokeWidth: 2,
          opacity: 0.35,
        },
        animated: loc.risk_level === 'critico', // Animate red lines for critical
      });

      // 3. Permit nodes (only on desktop)
      if (isDesktop) {
        locPermits.forEach((permit, j) => {
          // Position permits in arc around their sede (radius 180px)
          const pAngle = angle + ((j - (locPermits.length - 1) / 2) * 0.4);
          const permitPos = {
            x: sedePos.x + Math.cos(pAngle) * 180,
            y: sedePos.y + Math.sin(pAngle) * 180,
          };

          nodes.push({
            id: permit.id,
            type: 'permit',
            position: permitPos,
            data: {
              label: permit.type,
              status: permit.status,
              issuer: permit.issuer || 'N/A',
            },
          });

          // Edge: Sede → Permit
          const permitHandles = getHandlePair(sedePos.x, sedePos.y, permitPos.x, permitPos.y);
          edges.push({
            id: `${loc.id}-${permit.id}`,
            source: loc.id,
            target: permit.id,
            sourceHandle: `s-${permitHandles.sourceHandle}`,
            targetHandle: permitHandles.targetHandle,
            style: {
              stroke: statusEdgeColor[permit.status],
              strokeWidth: (permit.status === 'vencido' || permit.status === 'no_registrado') ? 2.5 : 1.5,
              opacity: permit.status === 'no_registrado' ? 0.35 : 0.6,
            },
            animated: permit.status === 'vencido', // Animate red lines for expired
          });
        });
      }
    });

    return { seedNodes: nodes, seedEdges: edges };
  }, [profile, locations, permits, isDesktop]);

  // ReactFlow state management
  const [nodes, setNodes, onNodesChange] = useNodesState(seedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(seedEdges);

  // Sync ReactFlow state when seed data changes (responsive, data refresh)
  useEffect(() => {
    setNodes(seedNodes);
  }, [seedNodes, setNodes]);

  useEffect(() => {
    setEdges(seedEdges);
  }, [seedEdges, setEdges]);

  // Physics simulation callback
  const onForceTick = useCallback(
    (positions: Map<string, { x: number; y: number }>) => {
      setNodes((prev) =>
        prev.map((n) => {
          // Don't move node being dragged
          if (n.id === draggingRef.current) return n;
          const pos = positions.get(n.id);
          if (!pos) return n;
          return { ...n, position: { x: pos.x, y: pos.y } };
        }),
      );
    },
    [setNodes],
  );

  // Setup force layout physics
  const { fixNode, releaseNode } = useForceLayout({
    nodes: seedNodes,
    edges: seedEdges,
    onTick: onForceTick,
  });

  // Drag handlers for physics simulation
  const onNodeDragStart: OnNodeDrag = useCallback(
    (_event, node) => {
      draggingRef.current = node.id;
      fixNode(node.id, node.position.x, node.position.y);
    },
    [fixNode],
  );

  const onNodeDrag: OnNodeDrag = useCallback(
    (_event, node) => {
      fixNode(node.id, node.position.x, node.position.y);
    },
    [fixNode],
  );

  const onNodeDragStop: OnNodeDrag = useCallback(
    (_event, node) => {
      draggingRef.current = null;
      releaseNode(node.id);
    },
    [releaseNode],
  );

  // Click handler for sede navigation
  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (node.type === 'sede') {
        navigate(`/sedes/${node.id}`);
      }
    },
    [navigate],
  );

  // TODO: Add loading/error/empty states (Task 6)
  // TODO: Implement ReactFlow render (Task 7)

  // Placeholder for unused imports/variables (used in subsequent tasks)
  void ReactFlow;
  void Background;
  void Controls;
  void MiniMap;
  void BackgroundVariant;
  void Building2;
  void SedeNode;
  void PermitNode;
  void CompanyNode;
  void nodeTypes;
  void onNodesChange;
  void onEdgesChange;
  void onNodeClick;
  void onNodeDragStart;
  void onNodeDrag;
  void onNodeDragStop;
  void nodes;
  void edges;
  void embedded;
  void loading;
  void error;

  return (
    <div>NetworkMapViewV2 - nodes: {seedNodes.length}, edges: {seedEdges.length}</div>
  );
}
