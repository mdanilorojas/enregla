import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ArrowRight, Check } from '@/lib/lucide-icons';
import { useBusinessTypes, useBusinessType, useSaveEvaluation } from './useEvaluacion';
import type { BusinessTypeDef, InputFieldDef, InputValues, ProspectMeta } from './types';

type Step = 'tipo' | 'datos';

function defaultValues(bt: BusinessTypeDef): InputValues {
  const v: InputValues = {};
  for (const f of bt.inputFields) {
    if (f.type === 'number') v[f.key] = 0;
    else if (f.type === 'boolean') v[f.key] = false;
    else if (f.type === 'multiselect') v[f.key] = [];
    else v[f.key] = '';
  }
  return v;
}

export function EvaluacionWizardView() {
  const navigate = useNavigate();
  const { data: types, isLoading: loadingTypes } = useBusinessTypes();

  const [step, setStep] = useState<Step>('tipo');
  const [slug, setSlug] = useState<string>('');
  const [prospect, setProspect] = useState<ProspectMeta>({ name: '' });
  const [values, setValues] = useState<InputValues>({});

  const { data: bt } = useBusinessType(step === 'datos' ? slug : undefined);
  const save = useSaveEvaluation();

  // Inicializa los valores por defecto cuando carga el tipo elegido.
  useEffect(() => {
    if (bt && Object.keys(values).length === 0) {
      setValues(defaultValues(bt));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bt]);

  const selectType = (s: string) => {
    setSlug(s);
    setValues({});
    setStep('datos');
  };

  const setField = (key: string, value: InputValues[string]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const toggleMulti = (key: string, option: string) =>
    setValues((prev) => {
      const arr = Array.isArray(prev[key]) ? (prev[key] as string[]) : [];
      return {
        ...prev,
        [key]: arr.includes(option) ? arr.filter((x) => x !== option) : [...arr, option],
      };
    });

  const canSubmit = bt != null && prospect.name.trim().length > 0 && !save.isPending;

  const handleSubmit = async () => {
    if (!bt || !canSubmit) return;
    try {
      const ev = await save.mutateAsync({
        businessTypeSlug: bt.slug,
        prospect: { ...prospect, name: prospect.name.trim() },
        inputs: values,
      });
      navigate(`/evaluacion/${ev.id}`);
    } catch {
      toast.error('No se pudo guardar el estudio.');
    }
  };

  // ---- Paso 1: tipo de negocio ----
  if (step === 'tipo') {
    return (
      <div className="space-y-[var(--ds-space-300)]">
        <div>
          <h1 className="text-[var(--ds-font-size-400)] font-semibold text-[var(--ds-text)]">
            Nueva evaluación
          </h1>
          <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-1">
            Elige el tipo de negocio del prospecto.
          </p>
        </div>
        <div className="grid gap-[var(--ds-space-150)] sm:grid-cols-2">
          {loadingTypes
            ? [0, 1].map((i) => <Skeleton key={i} className="h-[96px] rounded-[var(--ds-radius-200)]" />)
            : types?.map((t) => (
                <Card
                  key={t.slug}
                  interactive
                  onClick={() => selectType(t.slug)}
                  className="p-[var(--ds-space-250)]"
                >
                  <p className="text-[var(--ds-font-size-200)] font-semibold text-[var(--ds-text)]">
                    {t.name}
                  </p>
                  <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mt-1">
                    {t.description}
                  </p>
                </Card>
              ))}
          <Card className="p-[var(--ds-space-250)] opacity-60">
            <div className="flex items-center gap-[var(--ds-space-100)]">
              <p className="text-[var(--ds-font-size-200)] font-semibold text-[var(--ds-text)]">
                Más tipos
              </p>
              <Badge variant="secondary" size="sm">Próximamente</Badge>
            </div>
            <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mt-1">
              Restaurantes, gimnasios y más.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // ---- Paso 2: datos ----
  if (!bt) {
    return (
      <div className="space-y-[var(--ds-space-200)]">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px] rounded-[var(--ds-radius-200)]" />
      </div>
    );
  }

  return (
    <div className="space-y-[var(--ds-space-300)]">
      <button
        onClick={() => setStep('tipo')}
        className="flex items-center gap-[var(--ds-space-050)] text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] hover:text-[var(--ds-text)]"
      >
        <ArrowLeft size={14} aria-hidden="true" /> Cambiar tipo
      </button>

      <div>
        <h1 className="text-[var(--ds-font-size-400)] font-semibold text-[var(--ds-text)]">
          {bt.name}
        </h1>
        <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-1">
          Captura los datos del negocio para generar el estudio.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle as="h2">Datos del prospecto</CardTitle>
          <CardDescription>Información que aparece en la portada del estudio.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-[var(--ds-space-200)] sm:grid-cols-2">
          <Field label="Razón social / Nombre" required>
            <Input
              value={prospect.name}
              onChange={(e) => setProspect((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ej. Clínica San Rafael"
            />
          </Field>
          <Field label="RUC">
            <Input
              value={prospect.ruc ?? ''}
              onChange={(e) => setProspect((p) => ({ ...p, ruc: e.target.value }))}
              placeholder="Ej. 1790012345001"
            />
          </Field>
          <Field label="Ciudad">
            <Input
              value={prospect.city ?? ''}
              onChange={(e) => setProspect((p) => ({ ...p, city: e.target.value }))}
              placeholder="Ej. Quito"
            />
          </Field>
          <Field label="Contacto">
            <Input
              value={prospect.contact ?? ''}
              onChange={(e) => setProspect((p) => ({ ...p, contact: e.target.value }))}
              placeholder="Nombre / teléfono / correo"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h2">Características del negocio</CardTitle>
          <CardDescription>Estos datos determinan qué requisitos aplican.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-[var(--ds-space-250)] sm:grid-cols-2">
          {bt.inputFields.map((f) => (
            <FieldRenderer
              key={f.key}
              field={f}
              value={values[f.key]}
              onChange={(v) => setField(f.key, v)}
              onToggleMulti={(opt) => toggleMulti(f.key, opt)}
            />
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-[var(--ds-space-150)]">
        <Button variant="outline" onClick={() => navigate('/evaluacion')}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit} loading={save.isPending}>
          Generar estudio
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  help,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  help?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-[var(--ds-space-075)] ${className ?? ''}`}>
      <Label>
        {label}
        {required && <span className="text-[var(--ds-red-600)]"> *</span>}
      </Label>
      {children}
      {help && (
        <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtlest)]">{help}</p>
      )}
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
  onToggleMulti,
}: {
  field: InputFieldDef;
  value: InputValues[string];
  onChange: (v: InputValues[string]) => void;
  onToggleMulti: (option: string) => void;
}) {
  if (field.type === 'number') {
    return (
      <Field label={field.label} required={field.required} help={field.help}>
        <div className="flex items-center gap-[var(--ds-space-100)]">
          <Input
            type="number"
            min={0}
            value={typeof value === 'number' ? value : 0}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder={field.placeholder}
          />
          {field.unit && (
            <span className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] shrink-0">
              {field.unit}
            </span>
          )}
        </div>
      </Field>
    );
  }

  if (field.type === 'text') {
    return (
      <Field label={field.label} required={field.required} help={field.help}>
        <Input
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      </Field>
    );
  }

  if (field.type === 'boolean') {
    return (
      <label className="flex items-start gap-[var(--ds-space-150)] cursor-pointer sm:col-span-2">
        <Checkbox
          checked={value === true}
          onCheckedChange={(c) => onChange(c === true)}
          className="mt-0.5"
        />
        <span>
          <span className="text-[var(--ds-font-size-100)] font-medium text-[var(--ds-text)]">
            {field.label}
          </span>
          {field.help && (
            <span className="block text-[var(--ds-font-size-075)] text-[var(--ds-text-subtlest)]">
              {field.help}
            </span>
          )}
        </span>
      </label>
    );
  }

  // multiselect
  const selected = Array.isArray(value) ? value : [];
  return (
    <Field label={field.label} required={field.required} help={field.help} className="sm:col-span-2">
      <div className="flex flex-wrap gap-[var(--ds-space-100)]">
        {field.options?.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggleMulti(opt.value)}
              className={`inline-flex items-center gap-[var(--ds-space-050)] rounded-[var(--ds-radius-100)] px-[var(--ds-space-150)] py-[var(--ds-space-075)] text-[var(--ds-font-size-075)] border transition-colors ${
                active
                  ? 'bg-[var(--ds-blue-50)] border-[var(--ds-background-brand)] text-[var(--ds-text-brand)] font-medium'
                  : 'bg-[var(--ds-neutral-0)] border-[var(--ds-border)] text-[var(--ds-text-subtle)] hover:border-[var(--ds-border-bold)]'
              }`}
            >
              {active && <Check size={14} aria-hidden="true" />}
              {opt.label}
            </button>
          );
        })}
      </div>
    </Field>
  );
}
