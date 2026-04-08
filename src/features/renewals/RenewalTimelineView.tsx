import { useMemo } from 'react';
import { useAppStore } from '@/store';
import { Card, Badge, LegalPill } from '@/components/ui';
import { PERMIT_TYPE_LABELS } from '@/types';
import { formatDateRelative, daysUntil, getMonthName } from '@/lib/dates';
import { parseISO } from 'date-fns';

export function RenewalTimelineView() {
  const { renewals, permits, locations } = useAppStore();

  const grouped = useMemo(() => {
    const sorted = [...renewals].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    const groups: Record<string, typeof sorted> = {};
    sorted.forEach((r) => {
      const month = getMonthName(r.dueDate);
      if (!groups[month]) groups[month] = [];
      groups[month].push(r);
    });

    return Object.entries(groups);
  }, [renewals]);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Renovaciones</h2>
        <p className="text-[13px] text-gray-500 mt-1">{renewals.length} renovaciones rastreadas</p>
      </div>

      <div className="space-y-8">
        {grouped.map(([month, items]) => {
          const expired = items.filter((r) => daysUntil(r.dueDate) < 0).length;
          const urgent = items.filter((r) => {
            const d = daysUntil(r.dueDate);
            return d >= 0 && d <= 30;
          }).length;

          return (
            <div key={month}>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-[15px] font-semibold text-gray-900 capitalize">{month}</h3>
                <div className="flex-1 h-px bg-gray-100" />
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-gray-400">{items.length} renovaciones</span>
                  {expired > 0 && (
                    <Badge variant="risk" risk="critico">{expired} vencidas</Badge>
                  )}
                  {urgent > 0 && (
                    <Badge variant="risk" risk="medio">{urgent} urgentes</Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-0.5 mb-4 h-1.5 rounded-full overflow-hidden">
                {items.map((r) => {
                  const days = daysUntil(r.dueDate);
                  const color =
                    days < 0 ? 'bg-red-400' :
                    days <= 30 ? 'bg-yellow-400' :
                    days <= 60 ? 'bg-yellow-300' :
                    'bg-emerald-400';
                  return <div key={r.id} className={`flex-1 ${color} rounded-full`} />;
                })}
              </div>

              <div className="space-y-2">
                {items.map((r) => {
                  const permit = permits.find((p) => p.id === r.permitId);
                  const location = locations.find((l) => l.id === r.locationId);
                  const days = daysUntil(r.dueDate);

                  return (
                    <Card key={r.id} padding="sm" hover>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center w-12 shrink-0">
                          <span className={`text-xl font-semibold tabular-nums ${
                            days < 0 ? 'text-red-500' :
                            days <= 30 ? 'text-yellow-600' :
                            'text-gray-400'
                          }`}>
                            {parseISO(r.dueDate).getDate()}
                          </span>
                        </div>

                        <div className="w-px h-8 bg-gray-100" />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[14px] font-medium text-gray-900">
                              {permit ? PERMIT_TYPE_LABELS[permit.type] : 'Renovación'}
                            </span>
                            <Badge variant="priority" priority={r.priority}>{r.priority}</Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[12px] text-gray-400">{location?.name}</span>
                            {r.owner && (
                              <>
                                <span className="text-gray-200">·</span>
                                <span className="text-[12px] text-gray-400">{r.owner}</span>
                              </>
                            )}
                            <span className="text-gray-200">·</span>
                            {permit && <LegalPill permitType={permit.type} variant="inline" />}
                          </div>
                        </div>

                        <span className={`text-[13px] font-medium shrink-0 ${
                          days < 0 ? 'text-red-500' :
                          days <= 30 ? 'text-yellow-600' :
                          'text-gray-400'
                        }`}>
                          {formatDateRelative(r.dueDate)}
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
