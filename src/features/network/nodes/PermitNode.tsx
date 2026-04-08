import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { PermitStatus } from '@/types';

type PermitData = {
  label: string;
  status: PermitStatus;
  issuer: string;
};

const statusStyle: Record<PermitStatus, { bg: string; border: string; text: string; dot: string }> = {
  vigente: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  por_vencer: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  vencido: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
  no_registrado: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-500', dot: 'bg-gray-300' },
  en_tramite: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
};

const statusLabels: Record<PermitStatus, string> = {
  vigente: 'Vigente',
  por_vencer: 'Por vencer',
  vencido: 'Vencido',
  no_registrado: 'Sin registrar',
  en_tramite: 'En trámite',
};

export function PermitNode({ data }: NodeProps) {
  const { label, status } = data as PermitData;
  const s = statusStyle[status];

  return (
    <>
      <Handle type="target" position={Position.Top} id="top" className="!opacity-0 !w-2 !h-2" />
      <Handle type="target" position={Position.Bottom} id="bottom" className="!opacity-0 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} id="left" className="!opacity-0 !w-2 !h-2" />
      <Handle type="target" position={Position.Right} id="right" className="!opacity-0 !w-2 !h-2" />

      <div className={`${s.bg} ${s.border} border rounded-xl px-3 py-2 min-w-[110px] max-w-[150px] shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow`}>
        <p className={`text-[11px] font-semibold ${s.text} truncate leading-tight`}>{label}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          <span className="text-[9px] text-gray-500 font-medium">{statusLabels[status]}</span>
        </div>
      </div>
    </>
  );
}
