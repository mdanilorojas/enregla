import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui-v2/card';
import { Badge } from '@/components/ui-v2/badge';

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

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{sede.name}</CardTitle>
          <Badge variant={compliancePercent >= 80 ? 'default' : 'secondary'}>
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
