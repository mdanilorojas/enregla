import { Building2, MapPin, Shield, CheckCircle2 } from 'lucide-react';

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
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1 tracking-tight">
        Revisar y confirmar
      </h2>
      <p className="text-[13px] text-gray-500 mb-8">
        Verifica que toda la información sea correcta. Paso 4 de 4
      </p>

      <div className="space-y-6">
        {/* Company Info */}
        <div className="border border-gray-200 rounded-xl bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={18} className="text-gray-700" />
            <h3 className="text-[15px] font-semibold text-gray-900">
              Empresa
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[13px] text-gray-500">Nombre:</span>
              <span className="text-[13px] font-medium text-gray-900">
                {company.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[13px] text-gray-500">RUC:</span>
              <span className="text-[13px] font-medium text-gray-900">
                {company.ruc}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[13px] text-gray-500">Ciudad:</span>
              <span className="text-[13px] font-medium text-gray-900">
                {company.city}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[13px] text-gray-500">Tipo:</span>
              <span className="text-[13px] font-medium text-gray-900">
                {company.business_type}
              </span>
            </div>
          </div>
        </div>

        {/* Regulatory Factors */}
        <div className="border border-gray-200 rounded-xl bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} className="text-gray-700" />
            <h3 className="text-[15px] font-semibold text-gray-900">
              Factores regulatorios
            </h3>
          </div>
          {activeFactors.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {activeFactors.map((factor) => (
                <span
                  key={factor}
                  className="px-3 py-1.5 bg-gray-900 text-white text-[12px] font-medium rounded-lg"
                >
                  {factor}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-gray-500">
              No se seleccionaron factores especiales
            </p>
          )}
        </div>

        {/* Locations */}
        <div className="border border-gray-200 rounded-xl bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={18} className="text-gray-700" />
            <h3 className="text-[15px] font-semibold text-gray-900">
              Locales ({locations.length})
            </h3>
          </div>
          <div className="space-y-3">
            {locations.map((location, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="text-[13px] font-medium text-gray-900">
                    {location.name}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 bg-gray-200 text-gray-700 rounded font-medium">
                    {STATUS_LABELS[location.status]}
                  </span>
                </div>
                <p className="text-[12px] text-gray-500">{location.address}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Permits Preview */}
        <div className="border border-gray-200 rounded-xl bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={18} className="text-gray-700" />
            <h3 className="text-[15px] font-semibold text-gray-900">
              Permisos a generar
            </h3>
          </div>
          <p className="text-[13px] text-gray-500 mb-3">
            Se crearán {permitsToGenerate.length} permisos por cada local:
          </p>
          <div className="space-y-1.5">
            {permitsToGenerate.map((permit) => (
              <div
                key={permit}
                className="flex items-center gap-2 text-[13px] text-gray-700"
              >
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                {permit}
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-[13px] text-blue-900 leading-relaxed">
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
