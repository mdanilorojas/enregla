import { GlassCard } from '@/components/ui';
import { Lightbulb, TrendingUp } from 'lucide-react';

interface DailyInsightProps {
  compliancePercent: number;
  criticalCount: number;
}

export function DailyInsight({ compliancePercent, criticalCount }: DailyInsightProps) {
  // Generate insight based on data
  const getInsight = () => {
    if (compliancePercent >= 90) {
      return {
        text: 'Excelente nivel de cumplimiento. Mantén el ritmo con revisiones periódicas.',
        icon: <TrendingUp size={16} className="text-emerald-600" />,
        color: 'text-emerald-900',
      };
    }
    if (criticalCount > 0) {
      return {
        text: `Hay ${criticalCount} permiso${criticalCount > 1 ? 's' : ''} crítico${criticalCount > 1 ? 's' : ''} que requiere${criticalCount > 1 ? 'n' : ''} atención inmediata.`,
        icon: <Lightbulb size={16} className="text-amber-600" />,
        color: 'text-amber-900',
      };
    }
    return {
      text: 'Revisa los permisos por vencer esta semana para evitar problemas.',
      icon: <Lightbulb size={16} className="text-blue-600" />,
      color: 'text-blue-900',
    };
  };

  const insight = getInsight();

  return (
    <GlassCard intensity="subtle" className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{insight.icon}</div>
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
            Sugerencia del día
          </h3>
          <p className={`text-sm font-medium ${insight.color}`}>{insight.text}</p>
        </div>
      </div>
    </GlassCard>
  );
}
