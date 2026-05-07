import React, { useState } from 'react';
import { FileText } from '@/lib/lucide-icons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge, type PermitStatus } from '@/components/ui/StatusBadge';
import { PermitUploadForm } from '@/features/permits/PermitUploadForm';
import type { Permit } from '@/types/database';

interface PermitsTableProps {
  permits: Permit[];
  onRenewPermit: (permit: Permit) => void;
  onViewDetails: (permitId: string) => void;
  updatePermit: (
    permitId: string,
    updates: {
      issue_date?: string;
      expiry_date?: string | null;
      status?: 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite' | 'no_registrado';
      permit_number?: string | null;
      notes?: string | null;
    }
  ) => Promise<void>;
  refetch: () => Promise<void> | undefined;
}

export function PermitsTable({
  permits,
  onRenewPermit: _onRenewPermit,
  onViewDetails: _onViewDetails,
  updatePermit,
  refetch
}: PermitsTableProps) {
  const [expandedPermitId, setExpandedPermitId] = useState<string | null>(null);

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
              <TableRow className="hover:bg-[var(--ds-neutral-50)] transition-colors">
                <TableCell className="font-medium">{permit.type}</TableCell>
                <TableCell>{permit.permit_number || '-'}</TableCell>
                <TableCell>
                  <StatusBadge status={permit.status as PermitStatus} />
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
                      className="text-[var(--ds-text-brand)] hover:text-[var(--ds-blue-600)] font-medium transition-colors"
                    >
                      {expandedPermitId === permit.id ? 'Cancelar' : 'Subir documento'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-[var(--ds-text-subtle)]">
                        <FileText className="h-4 w-4" />
                        <span className="text-xs">Documento</span>
                      </div>
                      <button
                        onClick={() => setExpandedPermitId(expandedPermitId === permit.id ? null : permit.id)}
                        className="text-[var(--ds-text-subtle)] hover:text-[var(--ds-text)] text-sm transition-colors"
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
