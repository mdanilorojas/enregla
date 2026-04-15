import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui-v2/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui-v2/select';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createLocation } from '@/lib/api/locations';
import type { Location } from '@/types/database';

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
  const [riskLevel, setRiskLevel] = useState<'bajo' | 'medio' | 'alto' | 'critico' | ''>('');

  // State for errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // State for loading
  const [loading, setLoading] = useState(false);

  // Check if form has data (for confirmation on close)
  const hasData = name || address || status || riskLevel;

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

    // Validate risk level
    if (!riskLevel) {
      newErrors.riskLevel = 'Debes seleccionar un nivel de riesgo';
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

    setLoading(true);
    try {
      const newLocation = await createLocation({
        company_id: companyId,
        name: name.trim(),
        address: address.trim(),
        status: status as 'operando' | 'en_preparacion' | 'cerrado',
        risk_level: riskLevel as 'bajo' | 'medio' | 'alto' | 'critico',
      });

      toast.success('Sede creada exitosamente', {
        duration: 3000,
      });

      onSuccess(newLocation.id);
      onClose();
    } catch (error: any) {
      console.error('Error creating location:', error);
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
        setRiskLevel('');
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
  // TODO: Add JSX (Task 5)

  return null; // Placeholder
}
