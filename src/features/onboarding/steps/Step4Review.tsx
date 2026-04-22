import { Building2, MapPin, Shield, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface CompanyData {
  name: string;
  ruc: string;
  city: string;
  business_type: string;
}

interface RegulatoryFactors {
  alimentos: boolean;
  alcohol: boolean;
  salud: boolean;
  quimicos: boolean;
}

interface LocationInput {
  name: string;
  address: string;
  status: 'operando' | 'en_preparacion' | 'cerrado';
}

interface Props {
  company: CompanyData;
  regulatory: RegulatoryFactors;
  locations: LocationInput[];
}

const PERMIT_MAPPING = {
  always: ['Patente Municipal', 'RUC'],
  alimentos: ['Permiso Sanitario (ARCSA)'],
  alcohol: ['Permiso de Alcohol (SCPM)'],
  salud: ['Permiso de Salud (MSP)'],
  quimicos: ['Permiso Químicos (CONSEP)'],
};

const STATUS_LABELS = {
  operando: 'Operando',
  en_preparacion: 'En preparación',
  cerrado: 'Cerrado',
};

export function Step4Review({ company, regulatory, locations }: Props) {
  // Calculate permits to be generated
  const permitsToGenerate = [...PERMIT_MAPPING.always];
  if (regulatory.alimentos) permitsToGenerate.push(...PERMIT_MAPPING.alimentos);
  if (regulatory.alcohol) permitsToGenerate.push(...PERMIT_MAPPING.alcohol);
  if (regulatory.salud) permitsToGenerate.push(...PERMIT_MAPPING.salud);
  if (regulatory.quimicos) permitsToGenerate.push(...PERMIT_MAPPING.quimicos);

  const activeFactors = [
    regulatory.alimentos && 'Alimentos',
    regulatory.alcohol && 'Alcohol',
    regulatory.salud && 'Salud',
    regulatory.quimicos && 'Químicos',
  ].filter((f): f is string => Boolean(f));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-text mb-2">
          Revisar y confirmar
        </h2>
        <p className="text-sm text-text-secondary">
          Verifica que toda la información sea correcta. Paso 4 de 4
        </p>
      </div>

      <div className="space-y-6">
        {/* Company Info */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-text">
              Empresa
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-text-secondary">Nombre:</span>
              <span className="text-sm font-medium text-text">
                {company.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-text-secondary">RUC:</span>
              <span className="text-sm font-medium text-text">
                {company.ruc}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-text-secondary">Ciudad:</span>
              <span className="text-sm font-medium text-text">
                {company.city}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-text-secondary">Tipo:</span>
              <span className="text-sm font-medium text-text">
                {company.business_type}
              </span>
            </div>
          </div>
        </Card>

        {/* Regulatory Factors */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-text">
              Factores regulatorios
            </h3>
          </div>
          {activeFactors.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {activeFactors.map((factor) => (
                <Badge key={factor} variant="secondary">
                  {factor}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">
              No se seleccionaron factores especiales
            </p>
          )}
        </Card>

        {/* Locations */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-text">
              Locales ({locations.length})
            </h3>
          </div>
          <div className="space-y-3">
            {locations.map((location, index) => (
              <div key={index}>
                {index > 0 && <Separator className="my-3" />}
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-text">
                      {location.name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {STATUS_LABELS[location.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-secondary">{location.address}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Permits Preview */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <h3 className="text-base font-semibold text-text">
              Permisos a generar
            </h3>
          </div>
          <p className="text-sm text-text-secondary mb-3">
            Se crearán {permitsToGenerate.length} permisos por cada local:
          </p>
          <div className="space-y-2">
            {permitsToGenerate.map((permit) => (
              <div
                key={permit}
                className="flex items-center gap-2 text-sm text-text"
              >
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                {permit}
              </div>
            ))}
          </div>
        </Card>

        {/* Info Box */}
        <div className="rounded-lg border border-info-border bg-info-bg p-4">
          <p className="text-sm text-text leading-relaxed">
            <strong>Al activar el sistema:</strong> Se crearán {locations.length}{' '}
            {locations.length === 1 ? 'local' : 'locales'} con{' '}
            {permitsToGenerate.length * locations.length} permisos totales en
            estado "No registrado". Podrás cargar documentos y actualizar
            información desde el dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
