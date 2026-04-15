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
          // Position permits in arc around their sede
          // Arc spans 120° (π/1.5 radians) centered on direction away from HQ
          const arcSpan = Math.PI / 1.5; // 120 degrees
          const startAngle = angle + Math.PI - arcSpan / 2; // Center arc opposite to HQ
          const permitAngle = startAngle + (j / Math.max(locPermits.length - 1, 1)) * arcSpan;

          // Use adaptive radius based on number of permits (more permits = wider arc)
          const baseRadius = 200;
          const radiusVariation = Math.min(locPermits.length * 8, 60); // Up to 60px variation
          const permitRadius = baseRadius + (j % 2 === 0 ? 0 : radiusVariation);

          const permitPos = {
            x: sedePos.x + Math.cos(permitAngle) * permitRadius,
            y: sedePos.y + Math.sin(permitAngle) * permitRadius,
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

  // Loading state
  if (loading) {
    return (
      <div className={embedded ? 'h-full' : 'h-[calc(100vh-64px)]'}>
        <div className="h-full flex items-center justify-center bg-[#FAFBFD]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-600">Cargando mapa de red...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={embedded ? 'h-full' : 'h-[calc(100vh-64px)]'}>
        <div className="h-full flex items-center justify-center bg-[#FAFBFD]">
          <div className="text-center">
            <p className="text-red-500 mb-4">Error al cargar mapa de red</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state (no locations)
  if (locations.length === 0) {
    return (
      <div className={embedded ? 'h-full' : 'h-[calc(100vh-64px)]'}>
        <div className="h-full flex items-center justify-center bg-[#FAFBFD]">
          <div className="text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay sedes</h3>
            <p className="text-sm text-gray-500">
              Crea tu primera sede para visualizar la red
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state - render graph
  return (
    <div className={embedded ? 'h-full relative' : 'h-[calc(100vh-64px)] relative'}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3, duration: 800 }}
        minZoom={0.15}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        className="bg-[#FAFBFD]"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#e2e5ea"
        />
        <Controls
          showInteractive={false}
          className="!bg-white !border-gray-200 !rounded-xl !shadow-lg !shadow-black/5 [&>button]:!border-gray-100 [&>button]:!rounded-lg [&>button:hover]:!bg-gray-50"
        />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'company') return '#3b82f6';
            if (n.type === 'sede') {
              const riskLevel = (n.data as { riskLevel: RiskLevel }).riskLevel;
              return riskColor[riskLevel] || '#9ca3af';
            }
            const status = (n.data as { status: PermitStatus }).status;
            return statusEdgeColor[status] || '#d1d5db';
          }}
          maskColor="rgba(248,250,252,0.7)"
          className="!bg-white !border-gray-200 !rounded-xl !shadow-lg !shadow-black/5"
          pannable
          zoomable
        />
      </ReactFlow>

      {/* Legend */}
      <div className={`absolute ${embedded ? 'bottom-3 left-3' : 'bottom-6 left-6'} bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/80 shadow-lg ${embedded ? 'px-3 py-2' : 'px-4 py-3'} z-10`}>
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Estado de permisos
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {([
            ['#22c55e', 'Vigente'],
            ['#eab308', 'Por vencer'],
            ['#ef4444', 'Vencido'],
            ['#d1d5db', 'No registrado'],
          ] as const).map(([color, label]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[11px] text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
