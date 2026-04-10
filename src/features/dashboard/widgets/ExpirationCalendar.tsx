import { eachDayOfInterval, format, isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Renewal } from '@/types';
import { Card } from '@/components/ui';
import { Calendar } from 'lucide-react';

interface ExpirationCalendarProps {
  renewals: Renewal[];
}

export function ExpirationCalendar({ renewals }: ExpirationCalendarProps) {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const getDayIntensity = (date: Date) => {
    const count = renewals.filter((r) =>
      isSameDay(new Date(r.dueDate), date) && r.status !== 'completado'
    ).length;

    if (count === 0) return { bg: 'bg-gray-50 hover:bg-gray-100', text: 'text-gray-600' };
    if (count === 1) return { bg: 'bg-amber-100 hover:bg-amber-200', text: 'text-amber-800' };
    if (count === 2) return { bg: 'bg-orange-300 hover:bg-orange-400', text: 'text-orange-900' };
    return { bg: 'bg-red-400 hover:bg-red-500', text: 'text-white' };
  };

  const getDayRenewals = (date: Date) => {
    return renewals.filter((r) =>
      isSameDay(new Date(r.dueDate), date) && r.status !== 'completado'
    );
  };

  const isToday = (date: Date) => isSameDay(date, today);
  const isCurrentMonth = (date: Date) => date.getMonth() === today.getMonth();

  return (
    <Card>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
          <Calendar size={18} strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Calendario de Vencimientos</h3>
          <p className="text-sm text-gray-500">{format(today, 'MMMM yyyy', { locale: es })}</p>
        </div>
      </div>

      <div className="space-y-2">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
            <div key={day} className="text-center text-xs font-bold text-gray-500 uppercase tracking-wide py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const intensity = getDayIntensity(day);
            const dayRenewals = getDayRenewals(day);
            const today = isToday(day);
            const currentMonth = isCurrentMonth(day);

            return (
              <div key={day.toISOString()} className="relative">
                <button
                  className={`
                    w-full aspect-square rounded-lg flex flex-col items-center justify-center
                    text-xs font-semibold transition-all cursor-pointer
                    ${intensity.bg} ${intensity.text}
                    ${!currentMonth ? 'opacity-40' : ''}
                    ${today ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                  `}
                  title={dayRenewals.length > 0 ? `${dayRenewals.length} vencimiento(s)` : format(day, 'dd/MM/yyyy')}
                >
                  <span>{format(day, 'd')}</span>
                  {dayRenewals.length > 0 && (
                    <span className="text-[9px] font-bold mt-0.5">
                      {dayRenewals.length}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-100" />
            <span className="text-xs text-gray-600">Sin vencimientos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-100" />
            <span className="text-xs text-gray-600">1</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-300" />
            <span className="text-xs text-gray-600">2</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-400" />
            <span className="text-xs text-gray-600">3+</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
