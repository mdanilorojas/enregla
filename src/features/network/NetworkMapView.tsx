import { useMemo, useCallback } from 'react';
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

const riskMiniMapColor: Record<RiskLevel, string> = {
  critico: '#ef4444',
  alto: '#f97316',
  medio: '#eab308',
  bajo: '#22c55e',
};

export function NetworkMapView() {
  const navigate = useNavigate();
  const { company, locations, permits } = useAppStore();

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const centerX = 0;
    const centerY = 0;
    const sedeRadius = 340;
    const permitRadius = 200;

    nodes.push({
      id: 'company',
      type: 'company',
      position: { x: centerX - 90, y: centerY - 40 },
      data: { name: company?.name || 'Empresa', locationCount: locations.length },
      draggable: true,
    });

    locations.forEach((loc, i) => {
      const locPermits = permits.filter((p) => p.locationId === loc.id);
      const compliance = calculateCompliancePercentage(locPermits);
      const critical = countCriticalIssues(locPermits);

      const angle = (2 * Math.PI * i) / locations.length - Math.PI / 2;
      const sx = centerX + Math.cos(angle) * sedeRadius;
      const sy = centerY + Math.sin(angle) * sedeRadius;

      nodes.push({
        id: loc.id,
        type: 'sede',
        position: { x: sx - 80, y: sy - 45 },
        data: {
          name: loc.name,
          address: loc.address,
          riskLevel: loc.riskLevel,
          compliance,
          critical,
          permitCount: locPermits.length,
        },
        draggable: true,
      });

      edges.push({
        id: `company-${loc.id}`,
        source: 'company',
        target: loc.id,
        type: 'default',
        style: { stroke: riskMiniMapColor[loc.riskLevel], strokeWidth: 2, opacity: 0.4 },
        animated: loc.riskLevel === 'critico',
      });

      locPermits.forEach((permit, j) => {
        const pAngle = angle + ((j - (locPermits.length - 1) / 2) * 0.35);
        const px = sx + Math.cos(pAngle) * permitRadius;
        const py = sy + Math.sin(pAngle) * permitRadius;

        nodes.push({
          id: permit.id,
          type: 'permit',
          position: { x: px - 55, y: py - 22 },
          data: {
            label: PERMIT_TYPE_LABELS[permit.type],
            status: permit.status,
            issuer: permit.issuer,
          },
          draggable: true,
        });

        edges.push({
          id: `${loc.id}-${permit.id}`,
          source: loc.id,
          target: permit.id,
          type: 'default',
          style: {
            stroke: statusEdgeColor[permit.status],
            strokeWidth: permit.status === 'vencido' || permit.status === 'no_registrado' ? 2.5 : 1.5,
            opacity: permit.status === 'no_registrado' ? 0.4 : 0.7,
          },
          animated: permit.status === 'vencido',
        });
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [company, locations, permits]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (node.type === 'sede') {
        navigate(`/sedes/${node.id}`);
      }
    },
    [navigate],
  );

  return (
    <div className="h-[calc(100vh-64px)] -m-6 lg:-m-8">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={2}
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
            if (n.type === 'sede') return riskMiniMapColor[(n.data as { riskLevel: RiskLevel }).riskLevel] || '#9ca3af';
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
