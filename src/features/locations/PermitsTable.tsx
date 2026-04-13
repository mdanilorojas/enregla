import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePermissions } from '@/hooks/usePermissions';
import type { Permit } from '@/types/database';
import { Badge } from '@/components/ui';
import { PERMIT_TYPE_LABELS, PERMIT_STATUS_LABELS } from '@/types';
import { formatDate } from '@/lib/dates';
import { Eye, RefreshCw } from 'lucide-react';

interface PermitsTableProps {
  permits: Permit[];
  onRenew?: (permitId: string) => void;
}

export function PermitsTable({ permits, onRenew }: PermitsTableProps) {
  const navigate = useNavigate();
  const { canRenew } = usePermissions();

  const handleViewDetails = (permitId: string) => {
    navigate(`/permisos/${permitId}`);
  };

  if (permits.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-md p-8">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">No hay permisos registrados.</p>
          {canRenew && (
            <p className="text-sm text-gray-400">Agrega el primer permiso →</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Número
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Fecha Vencimiento
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Emisor
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {permits.map((permit) => (
              <motion.tr
                key={permit.id}
                className="hover:bg-gray-50 transition-colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.005 }}
              >
                <td className="px-5 py-4 text-sm font-medium text-gray-900">
                  {PERMIT_TYPE_LABELS[permit.type as keyof typeof PERMIT_TYPE_LABELS] || permit.type}
                </td>
                <td className="px-5 py-4">
                  <Badge
                    variant="status"
                    status={permit.status}
                    pulse={permit.status === 'vencido'}
                  >
                    {PERMIT_STATUS_LABELS[permit.status]}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">
                  {permit.permit_number || (
                    <span className="text-gray-400 italic">Sin asignar</span>
                  )}
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">
                  {permit.expiry_date ? (
                    <span className={
                      permit.status === 'vencido' ? 'text-red-600 font-semibold' :
                      permit.status === 'por_vencer' ? 'text-amber-600 font-semibold' :
                      ''
                    }>
                      {formatDate(permit.expiry_date)}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">N/A</span>
                  )}
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">
                  {permit.issuer || (
                    <span className="text-gray-400 italic">N/A</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {canRenew && permit.status === 'por_vencer' && onRenew && (
                      <button
                        onClick={() => onRenew(permit.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold transition-colors border border-amber-200"
                      >
                        <RefreshCw size={12} />
                        Renovar
                      </button>
                    )}
                    <button
                      onClick={() => handleViewDetails(permit.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors border border-blue-200"
                    >
                      <Eye size={12} />
                      Ver Detalles
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
