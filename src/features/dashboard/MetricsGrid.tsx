import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Clock, FileX } from 'lucide-react';

interface MetricsGridProps {
  metrics: {
    vigentes: number;
    porVencer: number;
    faltantes: number;
    compliance: number;
  };
}

interface MetricCardProps {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function MetricCard({ label, value, description, icon, color, bgColor }: MetricCardProps) {
  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              {label}
            </p>
          </div>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: bgColor }}
          >
            <span style={{ color }}>{icon}</span>
          </div>
        </div>

        <p className="text-3xl font-bold leading-none tracking-tight" style={{ color }}>
          {value}
        </p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-2">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        label="Vigentes"
        value={metrics.vigentes}
        description="Permisos al día"
        icon={<CheckCircle2 size={16} strokeWidth={2.5} />}
        color="var(--color-status-vigente-text)"
        bgColor="var(--color-status-vigente-bg)"
      />
      <MetricCard
        label="Por Vencer"
        value={metrics.porVencer}
        description="Próximos a vencer"
        icon={<Clock size={16} strokeWidth={2.5} />}
        color="var(--color-status-por-vencer-text)"
        bgColor="var(--color-status-por-vencer-bg)"
      />
      <MetricCard
        label="Faltantes"
        value={metrics.faltantes}
        description="Sin registrar"
        icon={<FileX size={16} strokeWidth={2.5} />}
        color="var(--color-status-vencido-text)"
        bgColor="var(--color-status-vencido-bg)"
      />
    </div>
  );
}
