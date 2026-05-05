import React, { useState, useCallback, useRef } from 'react';
import {
  Shield, Database, HardDrive, Key,
  Plus, X, ServerCrash, CheckCircle2, ChevronRight,
  ZoomIn, ZoomOut, Maximize, GitCommit, ArrowRight,
  Minus, MoreHorizontal, Waves, MapPin,
  FileText, Building2, AlertTriangle, Zap
} from 'lucide-react';

// --- ENREGLA LIGHT MODE STYLES ---
const enreglaLightStyles = `
  :root {
    --bg-base: #f8f9fb;
    --bg-surface: #ffffff;
    --bg-surface-raised: #f1f2f5;
    --primary-500: #1e3a8a;
    --primary-400: #2563eb;
    --primary-600: #1e40af;
    --accent-500: #0ea5e9;
    --border-base: #e5e7eb;
    --border-hover: #d1d5db;
    --text-primary: #111827;
    --text-secondary: #6b7280;
    --text-tertiary: #9ca3af;

    /* Risk colors from EnRegla */
    --risk-critico: #dc2626;
    --risk-alto: #f97316;
    --risk-medio: #eab308;
    --risk-bajo: #22c55e;

    /* Success/Status */
    --success: #22c55e;
    --success-bg: #f0fdf4;
  }

  body {
    background-color: var(--bg-base);
    color: var(--text-primary);
    font-family: 'Manrope', -apple-system, system-ui, sans-serif;
  }

  .enregla-glass {
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(229, 231, 235, 0.8);
    box-shadow: 0 4px 24px -2px rgba(0, 0, 0, 0.08),
                0 2px 8px -2px rgba(0, 0, 0, 0.04);
  }

  .bg-grid {
    background-image: radial-gradient(circle, #e5e7eb 1px, transparent 1px);
  }

  .enregla-handle {
    width: 12px;
    height: 12px;
    background-color: var(--bg-surface);
    border: 2px solid var(--primary-500);
    border-radius: 50%;
    position: absolute;
    left: 50%;
    transform: translate(-50%, -50%);
    cursor: crosshair;
    z-index: 10;
    transition: transform 0.2s, background-color 0.2s, box-shadow 0.2s;
    box-shadow: 0 0 0 0 rgba(30, 58, 138, 0);
  }

  .enregla-handle:hover {
    transform: translate(-50%, -50%) scale(1.5);
    background-color: var(--primary-500);
    box-shadow: 0 0 0 4px rgba(30, 58, 138, 0.1);
  }

  .enregla-handle-top { top: 0; }
  .enregla-handle-bottom { top: 100%; }

  /* ─── ANIMATIONS ─── */
  @keyframes pathPulse {
    0% { stroke-dashoffset: 100; }
    100% { stroke-dashoffset: 0; }
  }

  .pulse-special {
    stroke-dasharray: 25 75;
    animation: pathPulse 1.5s linear infinite;
  }

  @keyframes flowDotted {
    from { stroke-dashoffset: 24; }
    to { stroke-dashoffset: 0; }
  }

  .anim-dotted {
    animation: flowDotted 0.8s linear infinite;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-in {
    animation: fadeIn 0.2s ease-out;
  }
`;

// --- ENREGLA COMPONENTS CATALOG ---
const ENREGLA_CATALOG = [
  {
    id: 'company',
    label: 'Empresa',
    sublabel: 'Organization Root',
    icon: <Building2 size={20} />,
    desc: 'Nodo raíz que representa la empresa matriz con todas sus sedes.',
    metrics: { sedes: '8', permisos: '45', riesgo: 'Bajo' }
  },
  {
    id: 'sede',
    label: 'Sede / Sucursal',
    sublabel: 'Location Node',
    icon: <MapPin size={20} />,
    desc: 'Representa una ubicación física de la empresa con sus permisos asociados.',
    metrics: { permisos: '12', vigentes: '10', vencidos: '2' }
  },
  {
    id: 'permit',
    label: 'Permiso / Licencia',
    sublabel: 'Compliance Document',
    icon: <FileText size={20} />,
    desc: 'Documento de cumplimiento normativo vinculado a una sede específica.',
    metrics: { estado: 'Vigente', vencimiento: '180 días', tipo: 'Municipal' }
  },
  {
    id: 'inspector',
    label: 'Inspector / Auditor',
    sublabel: 'External Reviewer',
    icon: <Shield size={20} />,
    desc: 'Entidad externa que verifica el cumplimiento mediante enlaces públicos.',
    metrics: { accesos: '3', última: '2 días', qr: 'Activo' }
  },
  {
    id: 'alert',
    label: 'Sistema de Alertas',
    sublabel: 'Notification Hub',
    icon: <AlertTriangle size={20} />,
    desc: 'Monitoreo de vencimientos y envío de notificaciones automáticas.',
    metrics: { alertas: '5', próximas: '3', críticas: '1' }
  },
  {
    id: 'db',
    label: 'Base de Datos',
    sublabel: 'Supabase PostgreSQL',
    icon: <Database size={20} />,
    desc: 'Storage central con Row-Level Security para aislamiento de datos.',
    metrics: { registros: '2.4K', tamaño: '128MB', backup: 'Diario' }
  },
  {
    id: 'storage',
    label: 'Document Storage',
    sublabel: 'File Uploads',
    icon: <HardDrive size={20} />,
    desc: 'Almacenamiento seguro de PDFs y documentos adjuntos.',
    metrics: { archivos: '234', espacio: '1.2GB', tipo: 'PDF' }
  },
  {
    id: 'auth',
    label: 'Autenticación',
    sublabel: 'Google OAuth + Email',
    icon: <Key size={20} />,
    desc: 'Sistema de login con OAuth 2.0 y gestión de sesiones.',
    metrics: { usuarios: '12', sesiones: '8', mfa: 'Opcional' }
  }
];

const NODE_WIDTH = 280;
const NODE_HEIGHT = 160;

function createFuturisticCurve(sx: number, sy: number, tx: number, ty: number): string {
  const dy = Math.abs(ty - sy);
  const controlOffset = Math.max(dy / 2, 80);
  return `M ${sx},${sy} C ${sx},${sy + controlOffset} ${tx},${ty - controlOffset} ${tx},${ty}`;
}

interface Position {
  x: number;
  y: number;
}

interface Node {
  id: string;
  position: Position;
  data: typeof ENREGLA_CATALOG[0];
}

interface Edge {
  id: string;
  source: string;
  target: string;
  animStyle: 'static' | 'dotted' | 'gradient' | 'pulse';
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

export default function NetworkMapV4() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes] = useState<Node[]>([
    { id: 'node-company', position: { x: 500, y: 100 }, data: ENREGLA_CATALOG[0] },
    { id: 'node-sede1', position: { x: 250, y: 350 }, data: ENREGLA_CATALOG[1] },
    { id: 'node-sede2', position: { x: 750, y: 350 }, data: ENREGLA_CATALOG[1] },
    { id: 'node-db', position: { x: 500, y: 600 }, data: ENREGLA_CATALOG[5] },
  ]);

  const [edges, setEdges] = useState<Edge[]>([
    { id: 'e1', source: 'node-company', target: 'node-sede1', animStyle: 'pulse' },
    { id: 'e2', source: 'node-company', target: 'node-sede2', animStyle: 'pulse' },
    { id: 'e3', source: 'node-sede1', target: 'node-db', animStyle: 'dotted' },
    { id: 'e4', source: 'node-sede2', target: 'node-db', animStyle: 'dotted' },
  ]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [panState, setPanState] = useState<{ startX: number; startY: number; initialTx: number; initialTy: number } | null>(null);
  const [dragState, setDragState] = useState<{ id: string; startX: number; startY: number; nodeX: number; nodeY: number } | null>(null);
  const [connectState, setConnectState] = useState<{ id: string; type: 'source' | 'target' } | null>(null);
  const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });

  const getCanvasPos = useCallback((e: React.MouseEvent): Position => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - transform.x) / transform.scale,
      y: (e.clientY - rect.top - transform.y) / transform.scale
    };
  }, [transform]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;

    setTransform(prev => {
      const newScale = Math.min(Math.max(prev.scale + delta, 0.1), 3);
      if (newScale === prev.scale) return prev;

      if (!containerRef.current) return prev;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const xs = (mouseX - prev.x) / prev.scale;
      const ys = (mouseY - prev.y) / prev.scale;

      return {
        x: mouseX - xs * newScale,
        y: mouseY - ys * newScale,
        scale: newScale
      };
    });
  }, []);

  const handleContainerMouseDown = useCallback((e: React.MouseEvent) => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setPanState({
      startX: e.clientX,
      startY: e.clientY,
      initialTx: transform.x,
      initialTy: transform.y
    });
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (panState) {
      setTransform(prev => ({
        ...prev,
        x: panState.initialTx + (e.clientX - panState.startX),
        y: panState.initialTy + (e.clientY - panState.startY)
      }));
      return;
    }

    if (dragState) {
      const pos = getCanvasPos(e);
      const dx = pos.x - dragState.startX;
      const dy = pos.y - dragState.startY;
      setNodes(nds => nds.map(n =>
        n.id === dragState.id
          ? { ...n, position: { x: dragState.nodeX + dx, y: dragState.nodeY + dy } }
          : n
      ));
    }

    if (connectState) {
      setMousePos(getCanvasPos(e));
    }
  }, [dragState, connectState, panState, getCanvasPos]);

  const handleMouseUp = useCallback(() => {
    setDragState(null);
    setPanState(null);
    if (connectState) {
      setConnectState(null);
    }
  }, [connectState]);

  const handleAddComponent = (comp: typeof ENREGLA_CATALOG[0]) => {
    const newNode: Node = {
      id: `${comp.id}-${Math.random().toString(36).substring(2, 9)}`,
      position: {
        x: (-transform.x + window.innerWidth / 2) / transform.scale - NODE_WIDTH / 2,
        y: (-transform.y + window.innerHeight / 2) / transform.scale - NODE_HEIGHT / 2
      },
      data: { ...comp },
    };
    setNodes((nds) => [...nds, newNode]);
    setMenuOpen(false);
  };

  const startDrag = (e: React.MouseEvent, node: Node) => {
    e.stopPropagation();
    setSelectedNode(node);
    setSelectedEdge(null);
    const pos = getCanvasPos(e);
    setDragState({
      id: node.id,
      startX: pos.x,
      startY: pos.y,
      nodeX: node.position.x,
      nodeY: node.position.y
    });
  };

  const startConnect = (e: React.MouseEvent, nodeId: string, type: 'source' | 'target') => {
    e.stopPropagation();
    setConnectState({ id: nodeId, type });
    setMousePos(getCanvasPos(e));
  };

  const completeConnect = (e: React.MouseEvent, targetNodeId: string) => {
    e.stopPropagation();
    if (connectState && connectState.id !== targetNodeId) {
      const source = connectState.type === 'source' ? connectState.id : targetNodeId;
      const target = connectState.type === 'target' ? connectState.id : targetNodeId;

      if (!edges.find(edge => edge.source === source && edge.target === target)) {
        const newEdgeId = `e-${Math.random().toString(36).substr(2, 9)}`;
        setEdges(eds => [...eds, { id: newEdgeId, source, target, animStyle: 'pulse' }]);
      }
    }
    setConnectState(null);
  };

  const selectEdge = (e: React.MouseEvent, edgeId: string) => {
    e.stopPropagation();
    setSelectedEdge(edgeId);
    setSelectedNode(null);
  };

  const changeEdgeStyle = (style: Edge['animStyle']) => {
    if (!selectedEdge) return;
    setEdges(eds => eds.map(e => e.id === selectedEdge ? { ...e, animStyle: style } : e));
  };

  const zoomCentered = (deltaScale: number) => {
    setTransform(prev => {
      const newScale = Math.min(Math.max(prev.scale + deltaScale, 0.1), 3);
      if (newScale === prev.scale) return prev;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const xs = (centerX - prev.x) / prev.scale;
      const ys = (centerY - prev.y) / prev.scale;
      return { x: centerX - xs * newScale, y: centerY - ys * newScale, scale: newScale };
    });
  };

  const resetView = () => setTransform({ x: 0, y: 0, scale: 1 });

  const activeEdge = edges.find(e => e.id === selectedEdge);
  const activeEdgeSource = activeEdge ? nodes.find(n => n.id === activeEdge.source) : null;
  const activeEdgeTarget = activeEdge ? nodes.find(n => n.id === activeEdge.target) : null;

  return (
    <div
      className="w-full h-screen relative overflow-hidden bg-[#f8f9fb] font-sans selection:bg-primary-500/20 bg-grid"
      ref={containerRef}
      onMouseDown={handleContainerMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{
        backgroundPosition: `${transform.x}px ${transform.y}px`,
        backgroundSize: `${30 * transform.scale}px ${30 * transform.scale}px`,
        cursor: panState ? 'grabbing' : 'grab',
        fontFamily: 'Manrope, -apple-system, system-ui, sans-serif'
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: enreglaLightStyles }} />

      {/* TRANSFORMABLE WORKSPACE */}
      <div
        className="absolute top-0 left-0 w-full h-full transform-origin-top-left pointer-events-none"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0'
        }}
      >
        {/* CONNECTIONS LAYER (SVG) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
          <defs>
            <linearGradient id="enregla-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="50%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>

            <linearGradient id="enregla-flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e3a8a">
                <animate attributeName="stop-color" values="#1e3a8a;#0ea5e9;#1e3a8a" dur="2s" repeatCount="indefinite" />
              </stop>
              <stop offset="50%" stopColor="#0ea5e9">
                <animate attributeName="stop-color" values="#0ea5e9;#1e3a8a;#0ea5e9" dur="2s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#1e3a8a">
                <animate attributeName="stop-color" values="#1e3a8a;#0ea5e9;#1e3a8a" dur="2s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
          </defs>

          {edges.map(e => {
            const source = nodes.find(n => n.id === e.source);
            const target = nodes.find(n => n.id === e.target);
            if (!source || !target) return null;

            const sx = source.position.x + NODE_WIDTH / 2;
            const sy = source.position.y + NODE_HEIGHT;
            const tx = target.position.x + NODE_WIDTH / 2;
            const ty = target.position.y;

            const pathData = createFuturisticCurve(sx, sy, tx, ty);
            const isSelected = selectedEdge === e.id;
            const style = e.animStyle || 'static';

            return (
              <g key={e.id}>
                {/* Base static track */}
                <path
                  d={pathData}
                  stroke={isSelected ? "#1e3a8a" : "#d1d5db"}
                  strokeWidth={isSelected ? "3" : "2"}
                  fill="none"
                  opacity={style === 'gradient' ? "0.3" : "1"}
                  style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
                />

                {/* Dotted Animation */}
                {style === 'dotted' && (
                  <path
                    d={pathData}
                    stroke="#1e3a8a"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="6,6"
                    className="anim-dotted"
                    style={{ filter: 'drop-shadow(0 0 4px rgba(30, 58, 138, 0.4))' }}
                  />
                )}

                {/* Gradient Flow Animation */}
                {style === 'gradient' && (
                  <path
                    d={pathData}
                    stroke="url(#enregla-flow-gradient)"
                    strokeWidth="4"
                    fill="none"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(14, 165, 233, 0.4))' }}
                  />
                )}

                {/* Pulse Animation */}
                {style === 'pulse' && (
                  <path
                    d={pathData}
                    pathLength="100"
                    stroke="url(#enregla-gradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                    className="pulse-special"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(30, 58, 138, 0.5))' }}
                  />
                )}

                {/* Invisible Hit Area */}
                <path
                  d={pathData}
                  stroke="transparent"
                  strokeWidth="24"
                  fill="none"
                  style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                  onMouseDown={(evt) => selectEdge(evt, e.id)}
                />
              </g>
            );
          })}

          {/* Temporal connection line while dragging */}
          {connectState && (
            <path
              d={createFuturisticCurve(
                connectState.type === 'source' ? nodes.find(n=>n.id===connectState.id)!.position.x + NODE_WIDTH/2 : mousePos.x,
                connectState.type === 'source' ? nodes.find(n=>n.id===connectState.id)!.position.y + NODE_HEIGHT : mousePos.y,
                connectState.type === 'target' ? nodes.find(n=>n.id===connectState.id)!.position.x + NODE_WIDTH/2 : mousePos.x,
                connectState.type === 'target' ? nodes.find(n=>n.id===connectState.id)!.position.y : mousePos.y,
              )}
              stroke="#1e3a8a"
              strokeWidth="2"
              strokeDasharray="6,6"
              fill="none"
            />
          )}
        </svg>

        {/* NODES LAYER */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {nodes.map(node => {
            const isSelected = selectedNode?.id === node.id;
            const isDragging = dragState?.id === node.id;

            return (
              <div
                key={node.id}
                style={{
                  transform: `translate(${node.position.x}px, ${node.position.y}px)`,
                  width: `${NODE_WIDTH}px`,
                  height: `${NODE_HEIGHT}px`
                }}
                className={`absolute flex flex-col p-5 rounded-xl cursor-move pointer-events-auto bg-white transition-all ${
                  isDragging ? 'opacity-90 scale-[1.02]' : ''
                } ${
                  isSelected
                    ? 'border-2 border-primary-500 shadow-[0_0_24px_rgba(30,58,138,0.15)] z-20'
                    : 'border border-border-base shadow-md hover:border-border-hover hover:shadow-lg z-10'
                }`}
                onMouseDown={(e) => startDrag(e, node)}
              >
                <div
                  className="enregla-handle enregla-handle-top"
                  onMouseDown={(e) => startConnect(e, node.id, 'target')}
                  onMouseUp={(e) => completeConnect(e, node.id)}
                />
                <div
                  className="enregla-handle enregla-handle-bottom"
                  onMouseDown={(e) => startConnect(e, node.id, 'source')}
                  onMouseUp={(e) => completeConnect(e, node.id)}
                />

                <div className="flex items-center justify-between mb-3 pointer-events-none">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary-500/10 text-primary-500' : 'bg-gray-100 text-gray-600'}`}>
                      {node.data.icon}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 tracking-tight">{node.data.label}</div>
                      <div className="text-xs text-gray-500 font-medium mt-0.5">{node.data.sublabel}</div>
                    </div>
                  </div>
                  <CheckCircle2 size={16} className="text-success flex-shrink-0" />
                </div>

                <div className="mt-auto border-t border-gray-200 pt-3 pointer-events-none">
                  <div className="flex justify-between text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                    <span>Estado</span>
                    <span className="font-mono text-success">Activo</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-primary-500 h-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ZOOM CONTROLS */}
      <div
        className="absolute bottom-6 left-6 flex items-center gap-2 z-30"
        onMouseDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-2 p-1 bg-white border border-gray-200 rounded-xl enregla-glass shadow-md">
          <button onClick={() => zoomCentered(0.2)} className="p-2 text-gray-600 hover:text-primary-500 hover:bg-gray-50 rounded-lg transition-colors" title="Zoom In">
            <ZoomIn size={18} />
          </button>
          <div className="h-px bg-gray-200 w-full" />
          <button onClick={() => zoomCentered(-0.2)} className="p-2 text-gray-600 hover:text-primary-500 hover:bg-gray-50 rounded-lg transition-colors" title="Zoom Out">
            <ZoomOut size={18} />
          </button>
          <div className="h-px bg-gray-200 w-full" />
          <button onClick={resetView} className="p-2 text-gray-600 hover:text-primary-500 hover:bg-gray-50 rounded-lg transition-colors" title="Reset View">
            <Maximize size={18} />
          </button>
        </div>
        <div className="text-xs font-mono text-gray-500 ml-2 opacity-70 select-none font-semibold">
          {Math.round(transform.scale * 100)}%
        </div>
      </div>

      {/* ADD BUTTON */}
      <div
        className="absolute top-6 left-6 z-30"
        onMouseDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 px-5 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg shadow-lg transition-all transform hover:-translate-y-0.5 hover:shadow-xl"
        >
          <Plus size={20} />
          Agregar Componente
        </button>

        {menuOpen && (
          <div className="enregla-glass mt-4 w-80 max-h-[70vh] overflow-y-auto rounded-xl flex flex-col p-2 animate-in">
            <div className="px-3 py-2 text-xs font-semibold text-primary-500 uppercase tracking-wider border-b border-gray-200 mb-2">
              Componentes EnRegla
            </div>
            {ENREGLA_CATALOG.map((comp) => (
              <button
                key={comp.id}
                onClick={() => handleAddComponent(comp)}
                className="flex items-center gap-3 w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="text-gray-600 group-hover:text-primary-500 transition-colors">
                  {comp.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{comp.label}</div>
                  <div className="text-xs text-gray-500">{comp.sublabel}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT PANEL: NODE OR EDGE DETAILS */}
      <div
        className={`absolute top-0 right-0 h-full w-96 enregla-glass border-l border-y-0 border-r-0 rounded-none transition-transform duration-300 ease-out z-40 ${(selectedNode || selectedEdge) ? 'translate-x-0' : 'translate-x-full'}`}
        onMouseDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >

        {/* NODE DETAILS */}
        {selectedNode && (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-500/10 text-primary-500 rounded-lg">
                  {selectedNode.data.icon}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedNode.data.label}</h2>
                  <span className="text-xs font-mono text-gray-500">ID: {selectedNode.id.substring(0, 12)}</span>
                </div>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-gray-500 hover:text-gray-900 p-1 bg-gray-100 rounded-md border border-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-primary-500 uppercase tracking-wider mb-3">Estado del Sistema</h3>
                <div className="flex items-center gap-2 p-3 bg-success-bg border border-success/20 rounded-lg">
                  <CheckCircle2 className="text-success" size={18} />
                  <span className="text-sm font-semibold text-success">Operativo (Saludable)</span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-primary-500 uppercase tracking-wider mb-3">Descripción</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {selectedNode.data.desc}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-primary-500 uppercase tracking-wider mb-3">Métricas</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(selectedNode.data.metrics).map(([key, value]) => (
                    <div key={key} className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex flex-col gap-1">
                      <span className="text-xs uppercase text-gray-500 font-semibold">{key}</span>
                      <span className="text-lg font-mono text-gray-900 font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button className="w-full py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                Ver Detalles Completos <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* EDGE DETAILS */}
        {selectedEdge && activeEdge && (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-500/10 text-primary-500 rounded-lg">
                  <GitCommit size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Conexión</h2>
                  <span className="text-xs font-mono text-gray-500">ID: {activeEdge.id}</span>
                </div>
              </div>
              <button onClick={() => setSelectedEdge(null)} className="text-gray-500 hover:text-gray-900 p-1 bg-gray-100 rounded-md border border-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">

              {/* Connected Nodes */}
              <div>
                <h3 className="text-xs font-semibold text-primary-500 uppercase tracking-wider mb-3">Flujo de Datos</h3>
                <div className="flex flex-col gap-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                    <span className="text-sm text-gray-900 font-semibold">{activeEdgeSource?.data.label || 'Origen'}</span>
                  </div>
                  <div className="pl-1">
                    <ArrowRight size={14} className="text-gray-400 ml-[1px]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary-500" style={{ boxShadow: '0 0 8px rgba(30, 58, 138, 0.4)' }}/>
                    <span className="text-sm text-gray-900 font-semibold">{activeEdgeTarget?.data.label || 'Destino'}</span>
                  </div>
                </div>
              </div>

              {/* Animation Styles */}
              <div>
                <h3 className="text-xs font-semibold text-primary-500 uppercase tracking-wider mb-3">Estilo de Animación</h3>
                <p className="text-xs text-gray-600 mb-4">Selecciona cómo se visualiza el flujo de datos.</p>

                <div className="grid grid-cols-1 gap-3">

                  <button
                    onClick={() => changeEdgeStyle('static')}
                    className={`flex items-center gap-4 p-3 rounded-lg border text-left transition-all ${
                      activeEdge.animStyle === 'static'
                        ? 'bg-white border-primary-500 shadow-md'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`p-2 rounded-md ${activeEdge.animStyle === 'static' ? 'bg-primary-500/10 text-primary-500' : 'bg-gray-100 text-gray-600'}`}>
                      <Minus size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Estático</div>
                      <div className="text-xs text-gray-500">Línea sólida, sin movimiento</div>
                    </div>
                  </button>

                  <button
                    onClick={() => changeEdgeStyle('dotted')}
                    className={`flex items-center gap-4 p-3 rounded-lg border text-left transition-all ${
                      activeEdge.animStyle === 'dotted'
                        ? 'bg-white border-primary-500 shadow-md'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`p-2 rounded-md ${activeEdge.animStyle === 'dotted' ? 'bg-primary-500/10 text-primary-500' : 'bg-gray-100 text-gray-600'}`}>
                      <MoreHorizontal size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Punteado Móvil</div>
                      <div className="text-xs text-gray-500">Flujo de datos clásico</div>
                    </div>
                  </button>

                  <button
                    onClick={() => changeEdgeStyle('gradient')}
                    className={`flex items-center gap-4 p-3 rounded-lg border text-left transition-all ${
                      activeEdge.animStyle === 'gradient'
                        ? 'bg-white border-primary-500 shadow-md'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`p-2 rounded-md ${activeEdge.animStyle === 'gradient' ? 'bg-primary-500/10 text-primary-500' : 'bg-gray-100 text-gray-600'}`}>
                      <Waves size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Gradiente Fluido</div>
                      <div className="text-xs text-gray-500">Transición multicolor continua</div>
                    </div>
                  </button>

                  <button
                    onClick={() => changeEdgeStyle('pulse')}
                    className={`flex items-center gap-4 p-3 rounded-lg border text-left transition-all ${
                      activeEdge.animStyle === 'pulse'
                        ? 'bg-white border-primary-500 shadow-md'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`p-2 rounded-md ${activeEdge.animStyle === 'pulse' ? 'bg-primary-500/10 text-primary-500' : 'bg-gray-100 text-gray-600'}`}>
                      <Zap size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Pulso de Energía</div>
                      <div className="text-xs text-gray-500">Pulso brillante con efecto glow</div>
                    </div>
                  </button>

                </div>
              </div>

            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setEdges(eds => eds.filter(e => e.id !== selectedEdge));
                  setSelectedEdge(null);
                }}
                className="w-full py-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                Eliminar Conexión
              </button>
            </div>
          </div>
        )}

      </div>

      {/* EMPTY STATE */}
      {nodes.length === 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-0">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
            <ServerCrash size={64} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Lienzo Vacío</h2>
          <p className="text-gray-600 max-w-md">
            Haz clic en <strong>"Agregar Componente"</strong> arriba a la izquierda para comenzar a diseñar tu mapa de red.
          </p>
        </div>
      )}
    </div>
  );
}
