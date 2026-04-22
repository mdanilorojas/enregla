import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SedeCardProps {
  sede: {
    id: string;
    name: string;
    address?: string;
  };
  permitCounts: {
    vigentes: number;
    total: number;
  };
  onClick?: () => void;
}

export function SedeCard({ sede, permitCounts, onClick }: SedeCardProps) {
  const compliancePercent = permitCounts.total > 0
    ? Math.round((permitCounts.vigentes / permitCounts.total) * 100)
    : 0;

  // Lógica de color basada en nivel de cumplimiento
  const getBadgeColor = (): 'green' | 'yellow' | 'red' => {
    if (compliancePercent >= 80) return 'green';
    if (compliancePercent >= 60) return 'yellow';
    return 'red';
  };

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{sede.name}</CardTitle>
          <Badge color={getBadgeColor()}>
            {compliancePercent}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-text-secondary mb-2">{sede.address || 'Sin dirección'}</p>
        <p className="text-sm">
          {permitCounts.vigentes} de {permitCounts.total} permisos vigentes
        </p>
      </CardContent>
    </Card>
  );
}
