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
    <Card padding="sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-900">Calendario - {format(today, 'MMMM', { locale: es })}</h3>
        <Calendar size={14} className="text-gray-400" />
      </div>

      <div className="space-y-1">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1">
          {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, i) => (
            <div key={i} className="text-center text-[9px] font-bold text-gray-400 uppercase py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const intensity = getDayIntensity(day);
            const dayRenewals = getDayRenewals(day);
            const today = isToday(day);
            const currentMonth = isCurrentMonth(day);

            return (
              <div key={day.toISOString()} className="relative">
                <button
                  className={`
                    w-full aspect-square rounded flex items-center justify-center
                    text-[10px] font-semibold transition-all cursor-pointer
                    ${intensity.bg} ${intensity.text}
                    ${!currentMonth ? 'opacity-30' : ''}
                    ${today ? 'ring-1 ring-blue-500' : ''}
                  `}
                  title={dayRenewals.length > 0 ? `${dayRenewals.length} vencimiento(s)` : format(day, 'dd/MM/yyyy')}
                >
                  {format(day, 'd')}
                </button>
              </div>
            );
          })}
        </div>

        {/* Compact Legend */}
        <div className="flex items-center justify-center gap-3 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-100" />
            <span className="text-[9px] text-gray-500">0</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-100" />
            <span className="text-[9px] text-gray-500">1</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-300" />
            <span className="text-[9px] text-gray-500">2</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-400" />
            <span className="text-[9px] text-gray-500">3+</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
