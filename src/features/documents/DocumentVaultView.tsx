import { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PERMIT_TYPE_LABELS } from '@/types';
import type { Document } from '@/types';
import { formatDate } from '@/lib/dates';
import {
  FileText,
  Upload,
  AlertTriangle,
  FolderOpen,
  Building2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

type GroupMode = 'sede' | 'permiso';

export function DocumentVaultView() {
  const { documents, locations, permits } = useAppStore();
  const [groupBy, setGroupBy] = useState<GroupMode>('sede');

  const missingDocs = useMemo(() => {
    const docsNeeded: { locationName: string; permitType: string; id: string }[] = [];
    permits.forEach((p) => {
      if (p.documentIds.length === 0 && p.status !== 'no_registrado') {
        const loc = locations.find((l) => l.id === p.locationId);
        docsNeeded.push({
          id: p.id,
          locationName: loc?.name || '',
          permitType: PERMIT_TYPE_LABELS[p.type],
        });
      }
    });
    return docsNeeded;
  }, [permits, locations]);

  const grouped = useMemo(() => {
    if (groupBy === 'sede') {
      const groups: Record<string, { label: string; docs: Document[] }> = {};
      locations.forEach((loc) => {
        groups[loc.id] = { label: loc.name, docs: [] };
      });
      documents.forEach((doc) => {
        if (groups[doc.locationId]) {
          groups[doc.locationId].docs.push(doc);
        }
      });
      return Object.entries(groups).filter(([, g]) => g.docs.length > 0);
    } else {
      const groups: Record<string, { label: string; docs: Document[] }> = {};
      documents.forEach((doc) => {
        const permit = doc.permitId ? permits.find((p) => p.id === doc.permitId) : null;
        const key = permit ? permit.type : 'sin_permiso';
        const label = permit ? PERMIT_TYPE_LABELS[permit.type] : 'Sin permiso vinculado';
        if (!groups[key]) groups[key] = { label, docs: [] };
        groups[key].docs.push(doc);
      });
      return Object.entries(groups);
    }
  }, [documents, locations, permits, groupBy]);

  const stats = useMemo(() => {
    const total = documents.length;
    const vigentes = documents.filter((d) => d.status === 'vigente').length;
    const vencidos = documents.filter((d) => d.status === 'vencido').length;
    const missing = missingDocs.length;

    return { total, vigentes, vencidos, missing };
  }, [documents, missingDocs]);

  const getDocumentStatusVariant = (status: string): 'success' | 'destructive' | 'secondary' => {
    if (status === 'vigente') return 'success';
    if (status === 'vencido') return 'destructive';
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Documentos
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {stats.total} documentos registrados
            </p>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-gray-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
                  Total
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <FileText size={32} className="text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-1">
                  Vigentes
                </p>
                <p className="text-3xl font-bold text-emerald-700">
                  {stats.vigentes}
                </p>
              </div>
              <CheckCircle2 size={32} className="text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-600 uppercase tracking-wider mb-1">
                  Vencidos
                </p>
                <p className="text-3xl font-bold text-red-700">
                  {stats.vencidos}
                </p>
              </div>
              <AlertTriangle size={32} className="text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-1">
                  Faltantes
                </p>
                <p className="text-3xl font-bold text-amber-700">
                  {stats.missing}
                </p>
              </div>
              <Upload size={32} className="text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Missing Documents Alert */}
      {missingDocs.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className="text-amber-600" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-900">
                  Documentos faltantes
                </h3>
                <p className="text-xs text-amber-700 mt-0.5">
                  {missingDocs.length} {missingDocs.length === 1 ? 'permiso requiere' : 'permisos requieren'} documentación
                </p>
              </div>
              <Badge variant="warning">{missingDocs.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {missingDocs.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.permitType}</p>
                  <p className="text-xs text-gray-500">{item.locationName}</p>
                </div>
                <Button variant="outline" size="sm">
                  <Upload size={14} className="mr-1.5" />
                  Subir
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Group By Toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">
          Agrupar por:
        </p>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <Button
            variant={groupBy === 'sede' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setGroupBy('sede')}
            className={groupBy === 'sede' ? '' : 'bg-transparent'}
          >
            <Building2 size={14} className="mr-1.5" />
            Sede
          </Button>
          <Button
            variant={groupBy === 'permiso' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setGroupBy('permiso')}
            className={groupBy === 'permiso' ? '' : 'bg-transparent'}
          >
            <FileText size={14} className="mr-1.5" />
            Permiso
          </Button>
        </div>
      </div>

      {/* Grouped Documents */}
      <div className="space-y-6">
        {grouped.map(([key, { label, docs }]) => (
          <div key={key}>
            {/* Group Header */}
            <div className="flex items-center gap-3 mb-4">
              <FolderOpen size={18} className="text-gray-600" />
              <h3 className="text-base font-semibold text-gray-900">{label}</h3>
              <Badge variant="secondary">{docs.length}</Badge>
            </div>

            {/* Document List */}
            <div className="space-y-3">
              {docs.map((doc) => {
                const loc = locations.find((l) => l.id === doc.locationId);
                const permit = doc.permitId ? permits.find((p) => p.id === doc.permitId) : null;

                return (
                  <Card
                    key={doc.id}
                    className="transition-all hover:shadow-md"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                          <FileText size={20} className="text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {doc.name}
                          </h4>
                          <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500 mt-1">
                            {groupBy !== 'sede' && loc && (
                              <div className="flex items-center gap-1.5">
                                <Building2 size={12} />
                                {loc.name}
                              </div>
                            )}
                            {groupBy !== 'permiso' && permit && (
                              <>
                                {groupBy !== 'sede' && <span className="text-gray-300">•</span>}
                                <span>{PERMIT_TYPE_LABELS[permit.type]}</span>
                              </>
                            )}
                            <span className="text-gray-300">•</span>
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} />
                              {formatDate(doc.uploadedAt)}
                            </div>
                          </div>
                        </div>
                        <Badge variant={getDocumentStatusVariant(doc.status)}>
                          {doc.status === 'vigente' ? 'Vigente' : doc.status === 'vencido' ? 'Vencido' : doc.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {grouped.length === 0 && (
          <div className="text-center py-12">
            <FileText size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">
              No hay documentos registrados
            </p>
            <p className="text-sm text-gray-400">
              Sube documentos desde la vista de cada sede
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
