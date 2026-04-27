import { FileCheck, Clock, AlertCircle, FileX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PermitDocumentsSection } from '@/features/permits/PermitDocumentsSection';
import type { Permit } from '@/types/database';
import type { PermitStatus } from '@/types';

interface PermitCardsGridProps {
  permits: Permit[];
  onViewDetails: (permitId: string) => void;
  onPermitChange?: () => void | Promise<void>;
}

// Status configuration siguiendo tu sistema
const statusConfig: Record<PermitStatus, {
  icon: typeof FileCheck;
  color: 'green' | 'yellow' | 'red' | 'gray';
  label: string;
}> = {
  vigente: {
    icon: FileCheck,
    color: 'green',
    label: 'Vigente',
  },
  por_vencer: {
    icon: Clock,
    color: 'yellow',
    label: 'Por vencer',
  },
  vencido: {
    icon: AlertCircle,
    color: 'red',
    label: 'Vencido',
  },
  no_registrado: {
    icon: FileX,
    color: 'gray',
    label: 'Sin registrar',
  },
};

export function PermitCardsGrid({
  permits,
  onViewDetails,
  onPermitChange,
}: PermitCardsGridProps) {

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {permits.map(permit => {
        const config = statusConfig[permit.status];
        const Icon = config.icon;

        return (
          <div
            key={permit.id}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
          >
            {/* Permit info header */}
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <div className="flex items-start justify-between gap-3 mb-2">
                <Button
                  variant="ghost"
                  className="flex-1 justify-start p-0 h-auto hover:bg-transparent text-left"
                  onClick={() => onViewDetails(permit.id)}
                >
                  <h3 className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                    {permit.type}
                  </h3>
                </Button>
                <Badge color={config.color} className="flex items-center gap-1.5 shrink-0">
                  <Icon size={12} strokeWidth={2.5} />
                  {config.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{permit.issuer || 'Sin emisor'}</span>
                {permit.expiry_date && (
                  <>
                    <span>•</span>
                    <span>Vence: {new Date(permit.expiry_date).toLocaleDateString('es-CL')}</span>
                  </>
                )}
              </div>
            </div>

            {/* Document section - using shared component */}
            <div className="p-4">
              <PermitDocumentsSection permitId={permit.id} onDocumentChange={onPermitChange} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
