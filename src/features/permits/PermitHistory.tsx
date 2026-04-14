import { Card, Badge } from '@/components/ui';
import { formatDate } from '@/lib/dates';
import { Clock, Archive, CheckCircle2 } from 'lucide-react';
import type { Permit } from '@/types/database';

interface PermitHistoryProps {
  history: Permit[];
  currentPermitId: string;
}

export function PermitHistory({ history, currentPermitId }: PermitHistoryProps) {
  if (history.length === 0) {
    return (
      <Card>
        <div className="flex items-center gap-3 py-4 justify-center">
          <Clock size={18} className="text-gray-300" />
          <p className="text-[13px] text-gray-400">Sin historial de versiones</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((version) => {
        const isCurrentVersion = version.id === currentPermitId;
        const isArchived = !version.is_active;

        return (
          <Card key={version.id} padding="sm">
            <div className="flex items-start justify-between gap-4">
              {/* Left side - Version info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${
                    isCurrentVersion
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isCurrentVersion ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <Archive size={12} />
                    )}
                    <span className="text-[11px] font-bold">
                      Versión {version.version}
                    </span>
                  </div>

                  {isCurrentVersion && (
                    <Badge variant="status" status={version.status}>
                      Actual
                    </Badge>
                  )}

                  {isArchived && (
                    <Badge variant="status" status="no_registrado">
                      Archivada
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-0.5">
                      Número
                    </span>
                    <p className="text-[12px] text-gray-700 font-medium">
                      {version.permit_number || '—'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-0.5">
                      Emisor
                    </span>
                    <p className="text-[12px] text-gray-700 font-medium">
                      {version.issuer || '—'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-0.5">
                      Emitido
                    </span>
                    <p className="text-[12px] text-gray-700">
                      {version.issue_date ? formatDate(version.issue_date) : '—'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-0.5">
                      Vencimiento
                    </span>
                    <p className="text-[12px] text-gray-700">
                      {version.expiry_date ? formatDate(version.expiry_date) : '—'}
                    </p>
                  </div>
                </div>

                {version.notes && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">
                      Notas
                    </span>
                    <p className="text-[12px] text-gray-600 leading-relaxed">
                      {version.notes}
                    </p>
                  </div>
                )}

                {isArchived && version.archived_at && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <Archive size={11} className="text-gray-400" />
                    <span className="text-[11px] text-gray-400">
                      Archivada el {formatDate(version.archived_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
