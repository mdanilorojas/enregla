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
import type { Permit } from '@/types/database';

interface RenewPermitModalProps {
  permit: Permit | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (permitId: string, newExpiryDate: string) => Promise<void>;
}

export function RenewPermitModal({ permit, open, onClose, onConfirm }: RenewPermitModalProps) {
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    setError(null);
  }, [expiryDate]);

  const handleConfirm = async () => {
    if (!permit || !expiryDate) return;

    setLoading(true);
    setError(null);
    try {
      await onConfirm(permit.id, expiryDate);
      onClose();
      setExpiryDate('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al renovar permiso';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renovar Permiso</DialogTitle>
          <DialogDescription>
            Actualiza la fecha de vencimiento del permiso: {permit?.type}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
