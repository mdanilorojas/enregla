import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui-v2/input';
import { Label } from '@/components/ui-v2/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui-v2/select';
import { Button } from '@/components/ui-v2/button';
import { Card } from '@/components/ui-v2/card';

interface LocationInput {
  name: string;
  address: string;
  status: 'operando' | 'en_preparacion' | 'cerrado';
}

interface Props {
  locations: LocationInput[];
  onUpdate: (locations: LocationInput[]) => void;
}

const STATUS_OPTIONS = [
  { value: 'operando' as const, label: 'Operando' },
  { value: 'en_preparacion' as const, label: 'En preparación' },
  { value: 'cerrado' as const, label: 'Cerrado' },
];

export function Step3Locations({ locations, onUpdate }: Props) {
  const addLocation = () => {
    onUpdate([
      ...locations,
      { name: '', address: '', status: 'operando' },
    ]);
  };

  const removeLocation = (index: number) => {
    if (locations.length > 1) {
      onUpdate(locations.filter((_, i) => i !== index));
    }
  };

  const updateLocation = (index: number, partial: Partial<LocationInput>) => {
    const newLocations = [...locations];
    newLocations[index] = { ...newLocations[index], ...partial };
    onUpdate(newLocations);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-text mb-2">
          Locales / Sedes
        </h2>
        <p className="text-sm text-text-secondary">
          Agrega todos los locales de tu empresa. Paso 3 de 4
        </p>
      </div>

      <div className="space-y-4">
        {locations.map((location, index) => (
          <Card key={index} className="p-5">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-sm font-semibold text-text">
                Local {index + 1}
              </h3>
              {locations.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLocation(index)}
                  className="h-8 w-8 p-0 text-text-secondary hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Eliminar local</span>
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`location-name-${index}`}>Nombre del local</Label>
                <Input
                  id={`location-name-${index}`}
                  type="text"
                  value={location.name}
                  onChange={(e) => updateLocation(index, { name: e.target.value })}
                  placeholder="Ej: Sucursal La Mariscal"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`location-address-${index}`}>Dirección</Label>
                <Input
                  id={`location-address-${index}`}
                  type="text"
                  value={location.address}
                  onChange={(e) =>
                    updateLocation(index, { address: e.target.value })
                  }
                  placeholder="Dirección completa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`location-status-${index}`}>Estado</Label>
                <Select
                  value={location.status}
                  onValueChange={(value: LocationInput['status']) =>
                    updateLocation(index, { status: value })
                  }
                >
                  <SelectTrigger id={`location-status-${index}`}>
                    <SelectValue placeholder="Selecciona estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button
        onClick={addLocation}
        variant="outline"
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Agregar otra sede
      </Button>

      {locations.length === 0 && (
        <p className="text-sm text-danger">
          Debes agregar al menos un local
        </p>
      )}
    </div>
  );
}
