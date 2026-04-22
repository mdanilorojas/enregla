import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricsGridProps {
  metrics: {
    vigentes: number;
    porVencer: number;
    faltantes: number;
    compliance: number;
  };
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vigentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-success">{metrics.vigentes}</p>
          <p className="text-sm text-text-secondary mt-1">Permisos al día</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Por Vencer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-warning">{metrics.porVencer}</p>
          <p className="text-sm text-text-secondary mt-1">Próximos a vencer</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Faltantes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-danger">{metrics.faltantes}</p>
          <p className="text-sm text-text-secondary mt-1">Sin registrar</p>
        </CardContent>
      </Card>
    </div>
  );
}
