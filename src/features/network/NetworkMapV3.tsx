// src/features/network/NetworkMapV3.tsx
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useAuth } from '@/hooks/useAuth';
import { useLocations } from '@/hooks/useLocations';
import { usePermits } from '@/hooks/usePermits';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useStaticLayout } from './useStaticLayout';
import { CompanyNode } from './nodes/CompanyNode';
import { LocationNode } from './nodes/LocationNode';
import { supabase } from '@/lib/supabase';

const nodeTypes: NodeTypes = {
  company: CompanyNode,
  location: LocationNode,
};

export function NetworkMapV3() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  const { locations, loading: locationsLoading, error: locationsError } = useLocations(companyId);
  const { permits, loading: permitsLoading, error: permitsError } = usePermits({ companyId });
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // Fetch company name
  const [companyName, setCompanyName] = useState('Empresa Matriz');
  useEffect(() => {
    if (!companyId) return;
    (supabase.from('companies') as any)
      .select('name')
      .eq('id', companyId)
      .single()
      .then(({ data }: { data: { name: string } | null }) => {
        if (data?.name) setCompanyName(data.name);
      });
  }, [companyId]);

  // Static layout
  const { nodes: layoutNodes, edges: layoutEdges } = useStaticLayout({
    locations,
    permits,
    isDesktop,
    companyName,
  });

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Sync nodes and edges when layout changes
  useEffect(() => {
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [layoutNodes, layoutEdges, setNodes, setEdges]);

  // Node click handler
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'location') {
        navigate(`/locations/${node.id}`);
      }
    },
    [navigate]
  );

  // Loading state
  if (locationsLoading || permitsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1E3A8A] border-t-transparent" />
          <p className="text-sm text-gray-600">Cargando mapa de red...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (locationsError || permitsError) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <svg
              className="h-6 w-6 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Error al cargar datos
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {locationsError || permitsError}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 rounded-lg bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white hover:bg-[#1E3A8A]/90"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (locations.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              No hay sedes registradas
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Agrega tu primera sede para comenzar a visualizar tu red de compliance
            </p>
          </div>
          <button
            onClick={() => navigate('/locations/new')}
            className="mt-2 rounded-lg bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white hover:bg-[#1E3A8A]/90"
          >
            Agregar sede
          </button>
        </div>
      </div>
    );
  }

  // Mobile view (list instead of network map)
  if (!isDesktop) {
    return (
      <div className="flex h-screen flex-col bg-gray-50">
        <div className="border-b bg-white px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Red de Sedes</h1>
          <p className="mt-1 text-sm text-gray-600">
            {locations.length} {locations.length === 1 ? 'sede' : 'sedes'} registradas
          </p>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-3">
            {locations.map(location => {
              const locPermits = permits.filter(
                p => p.location_id === location.id && p.is_active
              );
              const expired = locPermits.filter(
                p => p.status === 'vencido' || p.status === 'no_registrado'
              ).length;
              const expiringSoon = locPermits.filter(
                p => p.status === 'por_vencer'
              ).length;

              return (
                <button
                  key={location.id}
                  onClick={() => navigate(`/locations/${location.id}`)}
                  className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {location.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {location.address}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        location.risk_level === 'critico'
                          ? 'bg-red-50 text-red-700'
                          : location.risk_level === 'alto'
                            ? 'bg-orange-50 text-orange-700'
                            : location.risk_level === 'medio'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {location.risk_level}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      {locPermits.length} permisos
                    </span>
                    {expiringSoon > 0 && (
                      <span className="text-amber-600 font-medium">
                        {expiringSoon} por vencer
                      </span>
                    )}
                    {expired > 0 && (
                      <span className="text-red-600 font-medium">
                        {expired} vencidos
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Desktop: Network map with light theme
  return (
    <div className="h-screen w-full bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.3,
          maxZoom: 1,
          minZoom: 0.4,
        }}
        minZoom={0.3}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          color="#CBD5E1"
          gap={24}
          size={1}
          className="opacity-40"
        />
        <Controls
          showInteractive={false}
          className="!bg-white !border-gray-200 !shadow-md [&_button]:!bg-white [&_button]:!border-gray-200 [&_button]:!text-gray-600 [&_button:hover]:!bg-gray-50"
        />
      </ReactFlow>
    </div>
  );
}
