import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui-v2/dialog';
import { Button } from '@/components/ui-v2/button';
import { Input } from '@/components/ui-v2/input';
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

  const handleConfirm = async () => {
    if (!permit || !expiryDate) return;

    setLoading(true);
    try {
      await onConfirm(permit.id, expiryDate);
      onClose();
      setExpiryDate('');
    } catch (error) {
      console.error('Error renovando permiso:', error);
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
            <div className="rounded-lg bg-surface p-3 text-sm">
              <p className="text-text-secondary">
                <span className="font-medium">Vencimiento actual:</span>{' '}
                {permit.expiry_date
                  ? new Date(permit.expiry_date).toLocaleDateString('es-EC')
                  : 'No registrado'
                }
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!expiryDate || loading}>
            {loading ? 'Renovando...' : 'Confirmar renovación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
