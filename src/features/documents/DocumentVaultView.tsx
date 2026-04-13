import { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { Card, Badge, EmptyState } from '@/components/ui';
import { PERMIT_TYPE_LABELS } from '@/types';
import type { Document } from '@/types';
import { formatDate } from '@/lib/dates';
import { FileText, Upload, AlertTriangle, FolderOpen } from 'lucide-react';

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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-[var(--color-legal-ink)] tracking-tight uppercase">Documentos</h2>
          <p className="text-[13px] font-medium text-slate-500 mt-1 uppercase tracking-widest">{documents.length} documentos registrados</p>
        </div>
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setGroupBy('sede')}
            className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
              groupBy === 'sede' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Por sede
          </button>
          <button
            onClick={() => setGroupBy('permiso')}
            className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
              groupBy === 'permiso' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Por permiso
          </button>
        </div>
      </div>

      {missingDocs.length > 0 && (
        <Card padding="none" className="mb-6 !border-orange-200">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b-2 border-orange-200 bg-orange-50">
            <AlertTriangle size={18} className="text-orange-600" strokeWidth={2.5} />
            <span className="text-[14px] font-bold text-orange-800 uppercase tracking-wide">Documentos faltantes</span>
            <Badge variant="risk" risk="alto" className="ml-auto">{missingDocs.length}</Badge>
          </div>
          <div className="divide-y divide-gray-50">
            {missingDocs.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-[13px] font-medium text-gray-900">{item.permitType}</p>
                  <p className="text-[12px] text-gray-400">{item.locationName}</p>
                </div>
                <button className="flex items-center gap-1.5 text-[13px] text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 font-medium">
                  <Upload size={13} />
                  Subir
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="space-y-6">
        {grouped.map(([key, { label, docs }]) => (
          <div key={key}>
            <div className="flex items-center gap-2.5 mb-4 px-2">
              <FolderOpen size={18} className="text-slate-800" strokeWidth={2.5} />
              <h3 className="text-[15px] font-bold text-[var(--color-legal-ink)] uppercase tracking-wide">{label}</h3>
              <span className="text-[12px] font-bold text-slate-700 px-2 py-0.5 rounded-sm bg-slate-200 border border-slate-300">{docs.length}</span>
            </div>
            <div className="space-y-2">
              {docs.map((doc) => {
                const loc = locations.find((l) => l.id === doc.locationId);
                const permit = doc.permitId ? permits.find((p) => p.id === doc.permitId) : null;

                return (
                  <Card key={doc.id} padding="sm" hover className="border-2 border-slate-200 rounded-sm hover:border-slate-400 transition-colors shadow-none">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-sm bg-[var(--color-legal-paper)] border-2 border-slate-200 flex items-center justify-center shrink-0">
                        <FileText size={18} className="text-slate-700" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-black text-[var(--color-legal-ink)] truncate uppercase tracking-widest">{doc.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {groupBy !== 'sede' && (
                            <span className="text-[12px] font-medium text-slate-600 uppercase tracking-wide">{loc?.name}</span>
                          )}
                          {groupBy !== 'permiso' && permit && (
                            <span className="text-[12px] font-medium text-slate-600 uppercase tracking-wide">{PERMIT_TYPE_LABELS[permit.type]}</span>
                          )}
                          <span className="text-slate-300">·</span>
                          <span className="text-[12px] font-medium text-slate-500 uppercase tracking-widest">{formatDate(doc.uploadedAt)}</span>
                        </div>
                      </div>
                      <Badge
                        variant="status"
                        status={
                          doc.status === 'vigente' ? 'vigente' :
                          doc.status === 'vencido' ? 'vencido' :
                          'no_registrado'
                        }
                      >
                        {doc.status}
                      </Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {grouped.length === 0 && (
          <EmptyState message="Sin documentos registrados. Sube documentos desde la vista de cada sede." />
        )}
      </div>
    </div>
  );
}
