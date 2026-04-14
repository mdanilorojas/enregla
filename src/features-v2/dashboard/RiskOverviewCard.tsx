import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui-v2/card';
import { Badge } from '@/components/ui-v2/badge';

interface RiskOverviewCardProps {
  metrics: {
    vigentes: number;
    porVencer: number;
    faltantes: number;
    compliance: number;
  };
}

export function RiskOverviewCard({ metrics }: RiskOverviewCardProps) {
  const getRiskLevel = (): 'bajo' | 'medio' | 'alto' | 'critico' => {
    if (metrics.compliance >= 90) return 'bajo';
    if (metrics.compliance >= 75) return 'medio';
    if (metrics.compliance >= 60) return 'alto';
    return 'critico';
  };

  const riskLevel = getRiskLevel();
  const riskLabels = {
    bajo: 'Bajo',
    medio: 'Medio',
    alto: 'Alto',
    critico: 'Crítico',
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <CardTitle>Estado General de Cumplimiento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-4xl font-bold">{Math.round(metrics.compliance)}%</span>
            <Badge variant={riskLevel === 'bajo' ? 'default' : riskLevel === 'critico' ? 'destructive' : 'secondary'}>
              Riesgo {riskLabels[riskLevel]}
            </Badge>
          </div>
          <p className="text-sm text-text-secondary">
            {metrics.vigentes} permisos vigentes, {metrics.porVencer} por vencer, {metrics.faltantes} faltantes
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
