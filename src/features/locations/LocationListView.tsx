import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { Card, ProgressBar, Badge } from '@/components/ui';
import { calculateCompliancePercentage, countCriticalIssues } from '@/lib/risk';
import { STAGE_LABELS } from '@/types';
import { MapPin, ArrowUpRight } from 'lucide-react';

export function LocationListView() {
  const navigate = useNavigate();
  const { locations, permits } = useAppStore();

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Sedes</h2>
        <p className="text-[13px] text-gray-500 mt-1">{locations.length} locales registrados</p>
      </div>

      <div className="space-y-3">
        {locations.map((loc) => {
          const locPermits = permits.filter((p) => p.locationId === loc.id);
          const compliance = calculateCompliancePercentage(locPermits);
          const critical = countCriticalIssues(locPermits);
          const totalPermits = locPermits.length;
          const vigentes = locPermits.filter((p) => p.status === 'vigente').length;

          return (
            <Card key={loc.id} hover onClick={() => navigate(`/sedes/${loc.id}`)} padding="none">
              <div className="p-5 flex items-center gap-5">
                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-gray-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-[14px] font-semibold text-gray-900 truncate">{loc.name}</h3>
                    <Badge variant="risk" risk={loc.riskLevel}>{loc.riskLevel}</Badge>
                  </div>
                  <p className="text-[12px] text-gray-400 mt-0.5 truncate">{loc.address}</p>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <span className="text-[12px] text-gray-400 px-2 py-0.5 rounded-full bg-gray-50">{STAGE_LABELS[loc.stage]}</span>

                  <div className="w-28">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12px] text-gray-500">{vigentes}/{totalPermits}</span>
                      <span className="text-[12px] font-medium text-gray-600">{compliance}%</span>
                    </div>
                    <ProgressBar value={compliance} />
                  </div>

                  {critical > 0 && (
                    <span className="text-[12px] text-red-500 font-medium whitespace-nowrap">
                      {critical} {critical === 1 ? 'crítico' : 'críticos'}
                    </span>
                  )}

                  <ArrowUpRight size={16} className="text-gray-300" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
