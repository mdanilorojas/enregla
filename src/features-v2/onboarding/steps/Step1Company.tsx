import { Input } from '@/components/ui-v2/input';
import { Label } from '@/components/ui-v2/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui-v2/select';

interface CompanyData {
  name: string;
  ruc: string;
  city: string;
  business_type: string;
}

interface Props {
  data: CompanyData;
  onUpdate: (partial: Partial<CompanyData>) => void;
}

const CITIES = [
  { value: 'Quito', label: 'Quito' },
  { value: 'Guayaquil', label: 'Guayaquil' },
  { value: 'Cuenca', label: 'Cuenca' },
  { value: 'Manta', label: 'Manta' },
  { value: 'Santo Domingo', label: 'Santo Domingo' },
  { value: 'Machala', label: 'Machala' },
];

const BUSINESS_TYPES = [
  { value: 'Supermercado', label: 'Supermercado' },
  { value: 'Minimarket', label: 'Minimarket' },
  { value: 'Restaurante', label: 'Restaurante' },
  { value: 'Farmacia', label: 'Farmacia' },
  { value: 'Tienda de conveniencia', label: 'Tienda de conveniencia' },
  { value: 'Cafetería', label: 'Cafetería' },
  { value: 'Panadería', label: 'Panadería' },
  { value: 'Otro', label: 'Otro' },
];

export function Step1Company({ data, onUpdate }: Props) {
  // RUC validation (13 digits)
  const isRucValid = data.ruc.length === 13 && /^\d+$/.test(data.ruc);
  const showRucError = data.ruc.length > 0 && !isRucValid;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-text mb-2">
          Datos de la empresa
        </h2>
        <p className="text-sm text-text-secondary">
          Información básica de tu empresa. Paso 1 de 4
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="company-name">Nombre de la empresa</Label>
          <Input
            id="company-name"
            type="text"
            value={data.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Ej: Supermaxi S.A."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ruc">RUC</Label>
          <Input
            id="ruc"
            type="text"
            value={data.ruc}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 13);
              onUpdate({ ruc: value });
            }}
            placeholder="13 dígitos"
            maxLength={13}
            className={showRucError ? 'border-danger' : ''}
          />
          {showRucError && (
            <p className="text-xs text-danger">
              El RUC debe tener exactamente 13 dígitos
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Ciudad principal</Label>
          <Select value={data.city} onValueChange={(value) => onUpdate({ city: value })}>
            <SelectTrigger id="city">
              <SelectValue placeholder="Selecciona una ciudad" />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="business-type">Tipo de negocio</Label>
          <Select
            value={data.business_type}
            onValueChange={(value) => onUpdate({ business_type: value })}
          >
            <SelectTrigger id="business-type">
              <SelectValue placeholder="Selecciona el tipo de negocio" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_TYPES.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
