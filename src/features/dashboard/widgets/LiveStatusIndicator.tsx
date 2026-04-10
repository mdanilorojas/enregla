import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { RefreshCw } from 'lucide-react';

export function LiveStatusIndicator() {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const isLive = true;

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm">
      <div className="relative flex items-center justify-center">
        <div
          className={`w-2 h-2 rounded-full ${
            isLive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
          }`}
        />
        {isLive && (
          <div className="absolute w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        )}
      </div>
      <div className="flex items-center gap-2">
        <RefreshCw size={12} className="text-emerald-600" />
        <span className="text-xs font-semibold text-emerald-700">
          Actualizado{' '}
          {formatDistanceToNow(lastUpdate, {
            addSuffix: true,
            locale: es,
          })}
        </span>
      </div>
    </div>
  );
}
