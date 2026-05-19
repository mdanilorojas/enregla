import { useState } from 'react';
import { Plus, Trash2, Copy, FileText } from '@/lib/lucide-icons';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/ui/banner';

interface LocationInput {
  name: string;
  address: string;
  status: 'operando' | 'en_preparacion' | 'cerrado';
}

interface LocationsStepProps {
  onComplete: (locations: LocationInput[]) => Promise<void>;
  loading: boolean;
}

const STATUS_OPTIONS = [
  { value: 'operando' as const, label: 'Operando' },
  { value: 'en_preparacion' as const, label: 'En preparación' },
  { value: 'cerrado' as const, label: 'Cerrado' },
];

export function LocationsStep({ onComplete, loading }: LocationsStepProps) {
  const [locations, setLocations] = useState<LocationInput[]>([
    {
      name: '',
      address: '',
      status: 'operando',
    },
  ]);

  const addLocation = () => {
    setLocations([
      ...locations,
      {
        name: '',
        address: '',
        status: 'operando',
      },
    ]);
  };

  const removeLocation = (index: number) => {
    if (locations.length > 1) {
      setLocations(locations.filter((_, i) => i !== index));
    }
  };

  const updateLocation = (index: number, partial: Partial<LocationInput>) => {
    const newLocations = [...locations];
    newLocations[index] = { ...newLocations[index], ...partial };
    setLocations(newLocations);
  };

  const duplicateLast = () => {
    const last = locations[locations.length - 1];
    if (!last) return;
    setLocations([...locations, { ...last, name: '', address: last.address }]);
  };

  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);

  const handlePaste = () => {
    setPasteError(null);
    const lines = pasteText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !/^(nombre|name)\s*[,\t]/i.test(l));

    if (lines.length === 0) {
      setPasteError('Pega al menos una línea con formato: Nombre, Dirección');
      return;
    }

    const parsed: LocationInput[] = [];
    for (const line of lines) {
      // Soporta CSV ("Nombre","Dirección") y TSV (tab)
      const parts = line.includes('\t')
        ? line.split('\t').map((s) => s.trim().replace(/^"|"$/g, ''))
        : line.split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
      const [name, address] = parts;
      if (!name || !address) {
        setPasteError(`Línea inválida: "${line.slice(0, 40)}..." — necesita Nombre y Dirección`);
        return;
      }
      parsed.push({ name, address, status: 'operando' });
    }

    // Reemplaza si la única sede actual está vacía, si no concatena
    const hasEmptyFirst = locations.length === 1 && !locations[0].name && !locations[0].address;
    setLocations(hasEmptyFirst ? parsed : [...locations, ...parsed]);
    setPasteText('');
    setPasteOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceed) return;
    await onComplete(locations);
  };

  // Validation
  const canProceed =
    locations.length > 0 &&
    locations.every((loc) => loc.name.trim().length > 0 && loc.address.trim().length > 0);

  const baseInputClass =
    'w-full bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] px-[var(--ds-space-150)] py-[var(--ds-space-100)] text-[var(--ds-font-size-100)] text-[var(--ds-text)] placeholder:text-[var(--ds-text-subtlest)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-background-brand)]/20 focus:border-[var(--ds-border-bold)] transition-all disabled:opacity-50';

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-[var(--ds-font-size-400)] font-semibold text-[var(--ds-text)] mb-[var(--ds-space-050)] tracking-tight">
        Locales / Sedes
      </h2>
      <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-400)]">
        Agrega todos los locales de tu empresa. Paso 3 de 3
      </p>

      <Banner variant="info" className="mb-[var(--ds-space-300)]">
        Los permisos se crean automáticamente según el tipo de negocio de la empresa.
      </Banner>

      <div className="flex flex-wrap gap-[var(--ds-space-100)] mb-[var(--ds-space-300)]">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPasteOpen((o) => !o)}
          disabled={loading}
        >
          <FileText className="w-4 h-4" />
          {pasteOpen ? 'Ocultar paste' : 'Pegar desde Excel / CSV'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={duplicateLast}
          disabled={loading || locations.length === 0}
        >
          <Copy className="w-4 h-4" />
          Duplicar última
        </Button>
      </div>

      {pasteOpen && (
        <div className="mb-[var(--ds-space-300)] p-[var(--ds-space-250)] bg-[var(--ds-neutral-50)] border border-[var(--ds-border)] rounded-[var(--ds-radius-200)]">
          <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-100)]">
            Una sede por línea. Formato: <code>Nombre, Dirección</code> (o separado por tab desde Excel).
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={6}
            className="w-full bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] px-[var(--ds-space-150)] py-[var(--ds-space-100)] text-[var(--ds-font-size-100)] font-mono"
            placeholder="Sucursal Quito Centro, Av. Amazonas N34-451&#10;Sucursal Guayaquil Urdesa, Circunvalación Sur 123"
          />
          {pasteError && (
            <div className="mt-[var(--ds-space-100)]">
              <Banner variant="error">{pasteError}</Banner>
            </div>
          )}
          <div className="mt-[var(--ds-space-100)] flex gap-[var(--ds-space-100)]">
            <Button type="button" variant="default" size="sm" onClick={handlePaste} disabled={!pasteText.trim()}>
              Agregar sedes
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setPasteOpen(false); setPasteText(''); setPasteError(null); }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-[var(--ds-space-200)]">
        {locations.map((location, index) => (
          <div
            key={index}
            className="border border-[var(--ds-border)] rounded-[var(--ds-radius-300)] bg-white p-[var(--ds-space-250)] shadow-[var(--ds-shadow-raised)]"
          >
            <div className="flex items-start justify-between mb-[var(--ds-space-200)]">
              <h3 className="text-[var(--ds-font-size-100)] font-semibold text-[var(--ds-text)]">
                Local {index + 1}
              </h3>
              {locations.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLocation(index)}
                  disabled={loading}
                  title="Eliminar local"
                  className="text-[var(--ds-text-subtlest)] hover:text-[var(--ds-red-600)]"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="space-y-[var(--ds-space-200)]">
              <div>
                <label className="block text-[var(--ds-font-size-075)] font-medium text-[var(--ds-text)] mb-[var(--ds-space-075)]">
                  Nombre del local
                </label>
                <input
                  type="text"
                  value={location.name}
                  onChange={(e) => updateLocation(index, { name: e.target.value })}
                  placeholder="Ej: Sucursal La Mariscal"
                  disabled={loading}
                  className={baseInputClass}
                />
              </div>

              <div>
                <label className="block text-[var(--ds-font-size-075)] font-medium text-[var(--ds-text)] mb-[var(--ds-space-075)]">
                  Dirección
                </label>
                <input
                  type="text"
                  value={location.address}
                  onChange={(e) => updateLocation(index, { address: e.target.value })}
                  placeholder="Dirección completa"
                  disabled={loading}
                  className={baseInputClass}
                />
              </div>

              <div>
                <label className="block text-[var(--ds-font-size-075)] font-medium text-[var(--ds-text)] mb-[var(--ds-space-100)]">
                  Estado
                </label>
                <div className="flex gap-[var(--ds-space-100)]">
                  {STATUS_OPTIONS.map(({ value, label }) => (
                    <Button
                      key={value}
                      type="button"
                      onClick={() => updateLocation(index, { status: value })}
                      disabled={loading}
                      variant={location.status === value ? 'default' : 'secondary'}
                      size="sm"
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addLocation}
        disabled={loading}
        className="mt-[var(--ds-space-200)] w-full border-2 border-dashed border-[var(--ds-border-bold)] rounded-[var(--ds-radius-300)] py-[var(--ds-space-150)] text-[var(--ds-text-subtle)] hover:text-[var(--ds-text)] hover:bg-[var(--ds-neutral-50)]"
      >
        <Plus className="w-4 h-4" />
        Agregar otra sede
      </Button>

      {locations.length === 0 && (
        <div className="mt-[var(--ds-space-100)]">
          <Banner variant="error">Debes agregar al menos un local</Banner>
        </div>
      )}

      <Button type="submit" disabled={!canProceed || loading} className="hidden">
        Completar
      </Button>
    </form>
  );
}
