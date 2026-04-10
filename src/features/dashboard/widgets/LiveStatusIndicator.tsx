import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function LiveStatusIndicator() {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-600 font-medium">
      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
      Actualizado {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: es })}
    </span>
  );
}
