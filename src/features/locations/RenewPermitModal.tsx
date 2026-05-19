import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { renewPermit } from '@/lib/api/permits';
import type { Permit } from '@/types/database';

interface RenewPermitModalProps {
  permit: Permit | null;
  open: boolean;
  onClose: () => void;
  // Si onConfirm no se pasa, el modal usa renewPermit() (RPC atómica con versionado).
  // Se mantiene el callback opcional para casos legacy.
  onConfirm?: (permitId: string, newExpiryDate: string) => Promise<void>;
  // Callback al terminar renovación exitosa (ej. refetch permits)
  onRenewed?: (newPermitId: string) => void;
}

export function RenewPermitModal({ permit, open, onClose, onConfirm, onRenewed }: RenewPermitModalProps) {
  const [permitNumber, setPermitNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setPermitNumber(permit?.permit_number ?? '');
      setIssueDate('');
      setExpiryDate('');
    }
  }, [open, permit?.permit_number]);

  const handleConfirm = async () => {
    if (!permit || !expiryDate) return;

    setLoading(true);
    setError(null);
    try {
      if (onConfirm) {
        // Modo legacy (solo actualiza expiry_date del mismo permit)
        await onConfirm(permit.id, expiryDate);
      } else {
        // RPC atómica con versionado
        const renewed = await renewPermit(permit.id, {
          permit_number: permitNumber.trim(),
          issue_date: issueDate || new Date().toISOString().split('T')[0],
          expiry_date: expiryDate,
          issuer: permit.issuer ?? '',
          notes: null,
        });
        onRenewed?.(renewed.id);
      }
      toast.success('Permiso renovado');
      onClose();
      setExpiryDate('');
      setIssueDate('');
      setPermitNumber('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al renovar permiso';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renovar Permiso</DialogTitle>
          <DialogDescription>
            Actualiza la fecha de vencimiento del permiso: {permit?.type}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!onConfirm && (
            <>
              <div className="space-y-2">
                <label htmlFor="permit-number" className="text-sm font-medium">
                  Número del nuevo permiso
                </label>
                <Input
                  id="permit-number"
                  type="text"
                  value={permitNumber}
                  onChange={(e) => setPermitNumber(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="issue-date" className="text-sm font-medium">
                  Fecha de emisión del nuevo permiso
                </label>
                <Input
                  id="issue-date"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <label htmlFor="expiry-date" className="text-sm font-medium">
              Nueva fecha de vencimiento
            </label>
            <Input
              id="expiry-date"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {permit && (
            <div className="rounded-lg bg-[var(--ds-neutral-50)] border border-[var(--ds-border)] p-3 text-sm">
              <p className="text-[var(--ds-text-subtle)]">
                <span className="font-medium text-[var(--ds-text)]">Vencimiento actual:</span>{' '}
                {permit.expiry_date
                  ? new Date(permit.expiry_date).toLocaleDateString('es-EC')
                  : 'No registrado'
                }
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-600 text-sm mb-2" role="alert">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!expiryDate || loading}
            className="bg-[var(--ds-background-brand)] hover:bg-[var(--ds-background-brand-hovered)]"
          >
            {loading ? 'Renovando...' : 'Confirmar renovación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
