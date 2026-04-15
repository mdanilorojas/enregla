import React, { useState } from 'react';
import { MoreHorizontal, ExternalLink, RefreshCw, FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui-v2/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui-v2/dropdown-menu';
import { Button } from '@/components/ui-v2/button';
import { StatusBadge } from '@/components/ui-v2/StatusBadge';
import { PermitUploadForm } from '@/features-v2/permits/PermitUploadForm';
import { usePermits } from '@/hooks/usePermits';
import { useAuth } from '@/hooks/useAuth';
import type { Permit } from '@/types/database';

interface PermitsTableProps {
  permits: Permit[];
  onRenewPermit: (permit: Permit) => void;
  onViewDetails: (permitId: string) => void;
}

export function PermitsTable({ permits, onRenewPermit, onViewDetails }: PermitsTableProps) {
  const [expandedPermitId, setExpandedPermitId] = useState<string | null>(null);
  const { companyId } = useAuth();
  const { updatePermit, refetch } = usePermits({ companyId });

  if (permits.length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary">
        <p>No hay permisos registrados para esta sede</p>
      </div>
    );
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo de Permiso</TableHead>
            <TableHead>Número</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha Emisión</TableHead>
            <TableHead>Fecha Vencimiento</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {permits.map((permit) => (
            <React.Fragment key={permit.id}>
              {/* Main row */}
              <TableRow className="hover:bg-gray-50 transition-colors">
                <TableCell className="font-medium">{permit.type}</TableCell>
                <TableCell>{permit.permit_number || '-'}</TableCell>
                <TableCell>
                  <StatusBadge status={permit.status} />
                </TableCell>
                <TableCell>{formatDate(permit.issue_date)}</TableCell>
                <TableCell>
                  {permit.expiry_date
                    ? formatDate(permit.expiry_date)
                    : permit.status === 'no_registrado'
                    ? '-'
                    : 'Indefinido'}
                </TableCell>
                <TableCell>
                  {permit.status === 'no_registrado' ? (
                    <button
                      onClick={() => setExpandedPermitId(expandedPermitId === permit.id ? null : permit.id)}
                      className="text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      {expandedPermitId === permit.id ? 'Cancelar' : 'Subir documento'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <FileText className="h-4 w-4" />
                        <span className="text-xs">Documento</span>
                      </div>
                      <button
                        onClick={() => setExpandedPermitId(expandedPermitId === permit.id ? null : permit.id)}
                        className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
                      >
                        {expandedPermitId === permit.id ? 'Cancelar' : 'Reemplazar'}
                      </button>
                    </div>
                  )}
                </TableCell>
              </TableRow>

              {/* Expanded row with upload form */}
              {expandedPermitId === permit.id && (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <PermitUploadForm
                      permit={permit}
                      updatePermit={updatePermit}
                      onSuccess={() => {
                        setExpandedPermitId(null);
                        refetch();
                      }}
                      onCancel={() => setExpandedPermitId(null)}
                    />
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
