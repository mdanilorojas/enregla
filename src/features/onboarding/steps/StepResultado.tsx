import type { ClassificationResult, OnboardingInput } from '@/types';
import { RiskIndicator, Badge } from '@/components/ui';
import { Shield, CalendarClock, ListChecks, MapPin } from 'lucide-react';

interface Props {
  classifications: ClassificationResult[];
  input: OnboardingInput;
}

export function StepResultado({ classifications, input }: Props) {
  const totalObligations = classifications.reduce((acc, c) => acc + c.obligations.length, 0);
  const totalChecklist = classifications.reduce((acc, c) => acc + c.checklist.length, 0);
  const worstRisk = classifications.reduce<'bajo' | 'medio' | 'alto' | 'critico'>((worst, c) => {
    const order = ['bajo', 'medio', 'alto', 'critico'] as const;
    return order.indexOf(c.riskLevel) > order.indexOf(worst) ? c.riskLevel : worst;
  }, 'bajo');

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1 tracking-tight">Sistema configurado</h2>
      <p className="text-[13px] text-gray-500 mb-8">
        {input.companyName} — {input.locations.length} {input.locations.length === 1 ? 'local' : 'locales'} en Quito
      </p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-gray-400" />
            <span className="text-[13px] text-gray-500 font-medium">Riesgo general</span>
          </div>
          <RiskIndicator level={worstRisk} size="lg" />
        </div>

        <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={16} className="text-gray-400" />
            <span className="text-[13px] text-gray-500 font-medium">Locales</span>
          </div>
          <span className="text-3xl font-semibold text-gray-900 tracking-tight">{input.locations.length}</span>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock size={16} className="text-gray-400" />
            <span className="text-[13px] text-gray-500 font-medium">Obligaciones</span>
          </div>
          <span className="text-3xl font-semibold text-gray-900 tracking-tight">{totalObligations}</span>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-3">
            <ListChecks size={16} className="text-gray-400" />
            <span className="text-[13px] text-gray-500 font-medium">Tareas iniciales</span>
          </div>
          <span className="text-3xl font-semibold text-gray-900 tracking-tight">{totalChecklist}</span>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[14px] font-semibold text-gray-700">Calendario de renovaciones</h3>
        {classifications.map((c) => (
          <div key={c.locationId}>
            <p className="text-[12px] text-gray-400 mb-2 font-medium">{c.locationName}</p>
            <div className="space-y-1.5">
              {c.renewalStructure.map((r) => (
                <div
                  key={r.permitType}
                  className="flex items-center justify-between py-2 px-3.5 rounded-lg bg-gray-50"
                >
                  <span className="text-[13px] text-gray-700">{r.name}</span>
                  <span className="text-[12px] text-gray-400">{r.estimatedMonth}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        <h3 className="text-[14px] font-semibold text-gray-700">Primeras tareas</h3>
        {classifications.map((c) => (
          <div key={c.locationId}>
            <p className="text-[12px] text-gray-400 mb-2 font-medium">{c.locationName}</p>
            <div className="space-y-1.5">
              {c.checklist.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2.5 py-2 px-3.5 rounded-lg bg-gray-50"
                >
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
                  <span className="text-[13px] text-gray-700 flex-1">{item.task}</span>
                  <Badge variant="priority" priority={item.priority} className="ml-auto">{item.priority}</Badge>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
