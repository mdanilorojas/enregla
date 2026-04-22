import { Link2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface PublicLinkBannerProps {
  locationId: string;
  hasPublicLink: boolean;
  onGenerateLink: () => void;
  onViewLink: () => void;
}

export function PublicLinkBanner({
  hasPublicLink,
  onGenerateLink,
  onViewLink
}: PublicLinkBannerProps) {
  if (hasPublicLink) {
    return (
      <Card className="bg-info-bg border-info-border">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info">
                <Link2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-text">Enlace público activo</h3>
                <p className="text-sm text-text-secondary">
                  Comparte el estado de permisos de esta sede
                </p>
              </div>
            </div>
            <Button onClick={onViewLink} variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              Ver enlace
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-surface border-border">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Link2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-text">Genera un enlace público</h3>
              <p className="text-sm text-text-secondary">
                Permite que terceros verifiquen el estado de permisos
              </p>
            </div>
          </div>
          <Button onClick={onGenerateLink}>
            Generar enlace
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
