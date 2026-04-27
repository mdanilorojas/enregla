import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocations } from '@/hooks/useLocations';
import { useCompanyDocuments, type CompanyDocument } from '@/hooks/useCompanyDocuments';
import { usePermits } from '@/hooks/usePermits';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, daysUntil } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import {
  FileText,
  Upload,
  AlertTriangle,
  FolderOpen,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
} from 'lucide-react';

type GroupMode = 'sede' | 'permiso';

export function DocumentVaultView() {
  const { companyId } = useAuth();
  const { locations, loading: loadingLocations } = useLocations(companyId);
  const { permits, loading: loadingPermits } = usePermits({ companyId });
  const { documents, loading: loadingDocs } = useCompanyDocuments(companyId);
  const [groupBy, setGroupBy] = useState<GroupMode>('sede');

  const loading = loadingLocations || loadingPermits || loadingDocs;

  // Permisos sin documento que deberían tenerlo (no estén en 'no_registrado')
  const missingDocs = useMemo(() => {
    const docsNeeded: { locationName: string; permitType: string; id: string }[] = [];
    const permitIdsWithDocs = new Set(documents.map((d) => d.permit_id));

    permits
      .filter((p) => p.is_active && !permitIdsWithDocs.has(p.id) && p.status !== 'no_registrado')
      .forEach((p) => {
        const loc = locations.find((l) => l.id === p.location_id);
        docsNeeded.push({
          id: p.id,
          locationName: loc?.name || 'Sin sede',
          permitType: p.type,
        });
      });

    return docsNeeded;
  }, [permits, documents, locations]);

  // Deriva status del documento a partir del permit vinculado
  const getDocStatus = (doc: CompanyDocument): 'vigente' | 'vencido' | 'por_vencer' | 'sin_registro' => {
    const permit = doc.permits;
    if (!permit) return 'sin_registro';
    if (permit.status === 'vencido') return 'vencido';
    if (permit.expiry_date) {
      const days = daysUntil(permit.expiry_date);
      if (days < 0) return 'vencido';
      if (days <= 30) return 'por_vencer';
    }
    return 'vigente';
  };

  const grouped = useMemo(() => {
    if (groupBy === 'sede') {
      const groups: Record<string, { label: string; docs: CompanyDocument[] }> = {};
      locations.forEach((loc) => {
        groups[loc.id] = { label: loc.name, docs: [] };
      });
      documents.forEach((doc) => {
        const locationId = doc.permits?.location_id;
        if (locationId && groups[locationId]) {
          groups[locationId].docs.push(doc);
        }
      });
      return Object.entries(groups).filter(([, g]) => g.docs.length > 0);
    } else {
      const groups: Record<string, { label: string; docs: CompanyDocument[] }> = {};
      documents.forEach((doc) => {
        const type = doc.permits?.type || 'sin_tipo';
        if (!groups[type]) groups[type] = { label: type, docs: [] };
        groups[type].docs.push(doc);
      });
      return Object.entries(groups);
    }
  }, [documents, locations, groupBy]);

  const stats = useMemo(() => {
    const total = documents.length;
    const vigentes = documents.filter((d) => getDocStatus(d) === 'vigente').length;
    const vencidos = documents.filter((d) => getDocStatus(d) === 'vencido').length;
    const missing = missingDocs.length;

    return { total, vigentes, vencidos, missing };
  }, [documents, missingDocs]);

  const getDocumentStatusVariant = (
    status: string
  ): 'success' | 'destructive' | 'warning' | 'secondary' => {
    if (status === 'vigente') return 'success';
    if (status === 'vencido') return 'destructive';
    if (status === 'por_vencer') return 'warning';
    return 'secondary';
  };

  const getDocumentUrl = (filePath: string) => {
    const { data } = supabase.storage.from('permit-documents').getPublicUrl(filePath);
    return data.publicUrl;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Documentos</h1>
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
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
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
                <p className="text-3xl font-bold text-emerald-700">{stats.vigentes}</p>
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
                <p className="text-3xl font-bold text-red-700">{stats.vencidos}</p>
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
                <p className="text-3xl font-bold text-amber-700">{stats.missing}</p>
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
                <h3 className="text-sm font-semibold text-amber-900">Documentos faltantes</h3>
                <p className="text-xs text-amber-700 mt-0.5">
                  {missingDocs.length}{' '}
                  {missingDocs.length === 1 ? 'permiso requiere' : 'permisos requieren'} documentación
                </p>
              </div>
              <Badge variant="warning">{missingDocs.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {missingDocs.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.permitType}</p>
                  <p className="text-xs text-gray-500">{item.locationName}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => (window.location.href = `/permisos/${item.id}`)}
                >
                  <Upload size={14} className="mr-1.5" />
                  Subir
                </Button>
              </div>
            ))}
            {missingDocs.length > 5 && (
              <p className="text-xs text-amber-700 text-center pt-2">
                +{missingDocs.length - 5} más
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Group By Toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Agrupar por:</p>
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
                const loc = locations.find((l) => l.id === doc.permits?.location_id);
                const status = getDocStatus(doc);

                return (
                  <Card key={doc.id} className="transition-all hover:shadow-md">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                          <FileText size={20} className="text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {doc.file_name}
                          </h4>
                          <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500 mt-1">
                            {groupBy !== 'sede' && loc && (
                              <div className="flex items-center gap-1.5">
                                <Building2 size={12} />
                                {loc.name}
                              </div>
                            )}
                            {groupBy !== 'permiso' && doc.permits && (
                              <>
                                {groupBy !== 'sede' && <span className="text-gray-300">•</span>}
                                <span>{doc.permits.type}</span>
                              </>
                            )}
                            <span className="text-gray-300">•</span>
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} />
                              {formatDate(doc.uploaded_at)}
                            </div>
                          </div>
                        </div>
                        <Badge variant={getDocumentStatusVariant(status)}>
                          {status === 'vigente'
                            ? 'Vigente'
                            : status === 'vencido'
                            ? 'Vencido'
                            : status === 'por_vencer'
                            ? 'Por vencer'
                            : 'Sin registro'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(getDocumentUrl(doc.file_path), '_blank')}
                        >
                          <Eye size={14} />
                        </Button>
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
            <p className="text-gray-500 mb-2">No hay documentos registrados</p>
            <p className="text-sm text-gray-400">
              Sube documentos desde la vista de cada permiso
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
