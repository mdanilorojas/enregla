import { useMemo, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeMouseHandler,
  type OnNodeDrag,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { PERMIT_TYPE_LABELS } from '@/types';
import type { RiskLevel, PermitStatus } from '@/types';
import { calculateCompliancePercentage, countCriticalIssues } from '@/lib/risk';
import { SedeNode } from './nodes/SedeNode';
import { PermitNode } from './nodes/PermitNode';
import { CompanyNode } from './nodes/CompanyNode';
import { useForceLayout } from './useForceLayout';

const nodeTypes = {
  sede: SedeNode,
  permit: PermitNode,
  company: CompanyNode,
};

const statusEdgeColor: Record<PermitStatus, string> = {
  vigente: '#22c55e',
  por_vencer: '#eab308',
  vencido: '#ef4444',
  no_registrado: '#d1d5db',
  en_tramite: '#3b82f6',
};

const riskColor: Record<RiskLevel, string> = {
  critico: '#ef4444',
  alto: '#f97316',
  medio: '#eab308',
  bajo: '#22c55e',
};

export function NetworkMapView() {
  const navigate = useNavigate();
  const { company, locations, permits } = useAppStore();
  const draggingRef = useRef<string | null>(null);

  const { seedNodes, seedEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    nodes.push({
      id: 'company',
      type: 'company',
      position: { x: 0, y: 0 },
      data: { name: company?.name || 'Empresa', locationCount: locations.length },
    });

    locations.forEach((loc, i) => {
      const locPermits = permits.filter((p) => p.locationId === loc.id);
      const compliance = calculateCompliancePercentage(locPermits);
      const critical = countCriticalIssues(locPermits);
      const angle = (2 * Math.PI * i) / locations.length - Math.PI / 2;

      nodes.push({
        id: loc.id,
        type: 'sede',
        position: { x: Math.cos(angle) * 300, y: Math.sin(angle) * 300 },
        data: {
          name: loc.name,
          address: loc.address,
          riskLevel: loc.riskLevel,
          compliance,
          critical,
          permitCount: locPermits.length,
        },
      });

      edges.push({
        id: `company-${loc.id}`,
        source: 'company',
        target: loc.id,
        style: { stroke: riskColor[loc.riskLevel], strokeWidth: 2, opacity: 0.35 },
        animated: loc.riskLevel === 'critico',
      });

      locPermits.forEach((permit, j) => {
        const pAngle = angle + ((j - (locPermits.length - 1) / 2) * 0.4);
        nodes.push({
          id: permit.id,
          type: 'permit',
          position: {
            x: Math.cos(angle) * 300 + Math.cos(pAngle) * 180,
            y: Math.sin(angle) * 300 + Math.sin(pAngle) * 180,
          },
          data: {
            label: PERMIT_TYPE_LABELS[permit.type],
            status: permit.status,
            issuer: permit.issuer,
          },
        });

        edges.push({
          id: `${loc.id}-${permit.id}`,
          source: loc.id,
          target: permit.id,
          style: {
            stroke: statusEdgeColor[permit.status],
            strokeWidth: permit.status === 'vencido' || permit.status === 'no_registrado' ? 2.5 : 1.5,
            opacity: permit.status === 'no_registrado' ? 0.35 : 0.6,
          },
          animated: permit.status === 'vencido',
        });
      });
    });

    return { seedNodes: nodes, seedEdges: edges };
  }, [company, locations, permits]);

  const [nodes, setNodes, onNodesChange] = useNodesState(seedNodes);
  const [edges, , onEdgesChange] = useEdgesState(seedEdges);

  const onForceTick = useCallback(
    (positions: Map<string, { x: number; y: number }>) => {
      setNodes((prev) =>
        prev.map((n) => {
          if (n.id === draggingRef.current) return n;
          const pos = positions.get(n.id);
          if (!pos) return n;
          return { ...n, position: { x: pos.x, y: pos.y } };
        }),
      );
    },
    [setNodes],
  );

  const { fixNode, releaseNode } = useForceLayout({
    nodes: seedNodes,
    edges: seedEdges,
    onTick: onForceTick,
  });

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

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (node.type === 'sede') {
        navigate(`/sedes/${node.id}`);
      }
    },
    [navigate],
  );

  return (
    <div className="h-[calc(100vh-64px)] -m-6 lg:-m-8 relative">
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
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#e2e5ea" />
        <Controls
          showInteractive={false}
          className="!bg-white !border-gray-200 !rounded-xl !shadow-lg !shadow-black/5 [&>button]:!border-gray-100 [&>button]:!rounded-lg [&>button:hover]:!bg-gray-50"
        />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'company') return '#3b82f6';
            if (n.type === 'sede') return riskColor[(n.data as { riskLevel: RiskLevel }).riskLevel] || '#9ca3af';
            return statusEdgeColor[(n.data as { status: PermitStatus }).status] || '#d1d5db';
          }}
          maskColor="rgba(248,250,252,0.7)"
          className="!bg-white !border-gray-200 !rounded-xl !shadow-lg !shadow-black/5"
          pannable
          zoomable
        />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/80 shadow-lg px-4 py-3 z-10">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Estado de permisos</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {([
            ['#22c55e', 'Vigente'],
            ['#eab308', 'Por vencer'],
            ['#ef4444', 'Vencido'],
            ['#3b82f6', 'En trámite'],
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
