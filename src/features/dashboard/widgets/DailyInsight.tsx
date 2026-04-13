import { useState } from 'react';
import { Lightbulb, TrendingUp, X } from 'lucide-react';

interface DailyInsightProps {
  compliancePercent: number;
  criticalCount: number;
}

export function DailyInsight({ compliancePercent, criticalCount }: DailyInsightProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  // Generate insight based on data
  const getInsight = () => {
    if (compliancePercent >= 90) {
      return {
        text: 'Excelente nivel de cumplimiento. Mantén el ritmo con revisiones periódicas.',
        icon: <TrendingUp size={18} className="text-emerald-500" strokeWidth={2} />,
        color: 'text-slate-700',
      };
    }
    if (criticalCount > 0) {
      return {
        text: `Hay ${criticalCount} permiso${criticalCount > 1 ? 's' : ''} crítico${criticalCount > 1 ? 's' : ''} que requiere${criticalCount > 1 ? 'n' : ''} atención inmediata.`,
        icon: <Lightbulb size={18} className="text-amber-500" strokeWidth={2} />,
        color: 'text-slate-700',
      };
    }
    return {
      text: 'Revisa los permisos por vencer esta semana para evitar problemas.',
      icon: <Lightbulb size={18} className="text-blue-500" strokeWidth={2} />,
      color: 'text-slate-700',
    };
  };

  const insight = getInsight();

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 relative animate-in slide-in-from-bottom-5 fade-in duration-500">
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 rounded-full p-1"
        aria-label="Cerrar sugerencia"
      >
        <X size={14} strokeWidth={2} />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div className="flex-shrink-0 mt-0.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">{insight.icon}</div>
        <div>
          <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Sugerencia del día
          </h3>
          <p className={`text-[14px] font-medium leading-snug ${insight.color}`}>{insight.text}</p>
        </div>
      </div>
    </div>
  );
}
