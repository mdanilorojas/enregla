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
import { createLocation } from '@/lib/api/locations';

interface CreateLocationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (locationId: string) => void;
  companyId: string;
}

export function CreateLocationModal({
  open,
  onClose,
  onSuccess,
  companyId,
}: CreateLocationModalProps) {
  // State for form fields
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'operando' | 'en_preparacion' | 'cerrado' | ''>('');

  // State for errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // State for loading
  const [loading, setLoading] = useState(false);

  // Check if form has data (for confirmation on close)
  const hasData = name || address || status;

  // Validation function
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate name
    if (!name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    // Validate address
    if (!address.trim()) {
      newErrors.address = 'La dirección es requerida';
    } else if (address.trim().length < 5) {
      newErrors.address = 'La dirección debe tener al menos 5 caracteres';
    }

    // Validate status
    if (!status) {
      newErrors.status = 'Debes seleccionar un estado';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async () => {
    // Validate form
    if (!validate()) {
      return;
    }

    // console.log('[CreateLocationModal] Submitting with companyId:', companyId);
    setLoading(true);
    try {
      const newLocation = await createLocation({
        company_id: companyId,
        name: name.trim(),
        address: address.trim(),
        status: status as 'operando' | 'en_preparacion' | 'cerrado',
      });

      // console.log('[CreateLocationModal] Location created:', newLocation);
      toast.success('Sede creada exitosamente', {
        duration: 3000,
      });

      onSuccess(newLocation.id);
      onClose();
    } catch (error: any) {
      console.error('[CreateLocationModal] Error creating location:', error);
      const errorMessage = error.message || 'Intenta nuevamente';
      toast.error(`Error al crear sede: ${errorMessage}`, {
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      // Small delay to avoid visible reset before close animation
      setTimeout(() => {
        setName('');
        setAddress('');
        setStatus('');
        setErrors({});
        setLoading(false);
      }, 200);
    }
  }, [open]);

  // Clear error for a field when user starts typing
  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };
  // Handle close with confirmation if form has data
  const handleClose = () => {
    if (loading) return; // Prevent close during loading

    if (hasData) {
      const confirm = window.confirm('¿Descartar cambios?');
      if (!confirm) return;
    }

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nueva Sede</DialogTitle>
          <DialogDescription>
            Completa la información básica de la sede
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name field */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Nombre de la sede
            </label>
            <Input
              id="name"
              placeholder="Ej: Supermaxi Norte, Oficina Centro, etc."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError('name');
              }}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-xs text-[var(--ds-red-500)] mt-1">{errors.name}</p>
            )}
          </div>

          {/* Address field */}
          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium">
              Dirección
            </label>
            <Textarea
              id="address"
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

          {/* Status field */}
          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium">
              Estado de la sede
            </label>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as any);
                clearError('status');
              }}
              disabled={loading}
            >
              <SelectTrigger id="status">
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
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              'Crear'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
