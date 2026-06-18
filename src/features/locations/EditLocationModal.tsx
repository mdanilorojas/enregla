import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from '@/lib/lucide-icons';
import toast from 'react-hot-toast';
import { updateLocation } from '@/lib/api/locations';

type LocationStatus = 'operando' | 'en_preparacion' | 'cerrado';

interface EditLocationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  location: {
    id: string;
    name: string;
    address: string | null;
    status: string | null;
  };
}

export function EditLocationModal({ open, onClose, onSuccess, location }: EditLocationModalProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<LocationStatus | ''>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Precargar con los datos actuales cada vez que se abre
  useEffect(() => {
    if (open) {
      setName(location.name ?? '');
      setAddress(location.address ?? '');
      setStatus((location.status as LocationStatus) ?? '');
      setErrors({});
      setLoading(false);
    }
  }, [open, location]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }
    if (!address.trim()) {
      newErrors.address = 'La dirección es requerida';
    } else if (address.trim().length < 5) {
      newErrors.address = 'La dirección debe tener al menos 5 caracteres';
    }
    if (!status) {
      newErrors.status = 'Debes seleccionar un estado';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await updateLocation(location.id, {
        name: name.trim(),
        address: address.trim(),
        status: status as LocationStatus,
      });
      toast.success('Sede actualizada', { duration: 3000 });
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('[EditLocationModal] Error updating location:', error);
      const errorMessage = error instanceof Error ? error.message : 'Intenta nuevamente';
      toast.error(`Error al actualizar sede: ${errorMessage}`, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar sede</DialogTitle>
          <DialogDescription>Actualiza la información de la sede</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="edit-name" className="text-sm font-medium">
              Nombre de la sede
            </label>
            <Input
              id="edit-name"
              placeholder="Ej: Supermaxi Norte, Oficina Centro, etc."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError('name');
              }}
              disabled={loading}
            />
            {errors.name && <p className="text-xs text-[var(--ds-red-500)] mt-1">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-address" className="text-sm font-medium">
              Dirección
            </label>
            <Textarea
              id="edit-address"
              placeholder="Av. Principal 123, Quito"
              rows={3}
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                clearError('address');
              }}
              disabled={loading}
            />
            {errors.address && (
              <p className="text-xs text-[var(--ds-red-500)] mt-1">{errors.address}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-status" className="text-sm font-medium">
              Estado de la sede
            </label>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as LocationStatus | '');
                clearError('status');
              }}
              disabled={loading}
            >
              <SelectTrigger id="edit-status">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operando">Operando</SelectItem>
                <SelectItem value="en_preparacion">En preparación</SelectItem>
                <SelectItem value="cerrado">Cerrado</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-xs text-[var(--ds-red-500)] mt-1">{errors.status}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar cambios'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
