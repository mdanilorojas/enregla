import { MoreHorizontal, ExternalLink, RefreshCw } from 'lucide-react';
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
import type { Permit } from '@/types/database';

interface PermitsTableProps {
  permits: Permit[];
  onRenewPermit: (permit: Permit) => void;
  onViewDetails: (permitId: string) => void;
}

export function PermitsTable({ permits, onRenewPermit, onViewDetails }: PermitsTableProps) {
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
            <TableRow key={permit.id}>
              <TableCell className="font-medium">{permit.type}</TableCell>
              <TableCell>{permit.permit_number || '-'}</TableCell>
              <TableCell>
                <StatusBadge status={permit.status} />
              </TableCell>
              <TableCell>{formatDate(permit.issue_date)}</TableCell>
              <TableCell>{formatDate(permit.expiry_date)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(permit.id)}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ver detalles
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRenewPermit(permit)}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Renovar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
