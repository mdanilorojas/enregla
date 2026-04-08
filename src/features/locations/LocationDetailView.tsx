import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { Card, Badge, StatusDot, EmptyState, LegalPill } from '@/components/ui';
import { PermitUploadModal } from '@/components/ui/PermitUploadModal';
import {
  PERMIT_TYPE_LABELS,
  PERMIT_STATUS_LABELS,
  STAGE_LABELS,
  type Permit,
  type Document,
} from '@/types';
import { calculateCompliancePercentage, countCriticalIssues } from '@/lib/risk';
import { formatDate, formatDateRelative, daysUntil } from '@/lib/dates';
import {
  ArrowLeft,
  Shield,
  FileText,
  ListChecks,
  CalendarClock,
  AlertTriangle,
  MapPin,
  Building2,
  Upload,
  RefreshCw,
} from 'lucide-react';

export function LocationDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { locations, getLocationPermits, getLocationTasks, getLocationRenewals, getPermitDocuments } = useAppStore();
  const [uploadPermit, setUploadPermit] = useState<Permit | null>(null);

  const location = locations.find((l) => l.id === id);
  if (!location) {
    return <EmptyState message="Sede no encontrada." action="Volver a sedes" onAction={() => navigate('/sedes')} />;
  }

  const permits = getLocationPermits(location.id);
  const tasks = getLocationTasks(location.id);
  const renewals = getLocationRenewals(location.id);
  const compliance = calculateCompliancePercentage(permits);
  const criticals = countCriticalIssues(permits);
  const faltantes = permits.filter((p) => p.status === 'no_registrado');

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/sedes')}
        className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 transition-colors font-medium"
      >
        <ArrowLeft size={14} />
        Sedes
      </button>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100 border border-violet-200/60 flex items-center justify-center shadow-sm">
              <Building2 size={18} className="text-violet-600" strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 tracking-tight">{location.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <MapPin size={12} className="text-gray-400" />
                <span className="text-[12px] text-gray-500">{location.address}</span>
                <span className="text-[12px] text-gray-400 px-2 py-0.5 rounded-lg bg-gray-50 border border-gray-100 font-medium">{STAGE_LABELS[location.stage]}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="risk" risk={location.riskLevel}>{location.riskLevel}</Badge>
          <span className={`text-3xl font-bold tracking-tight ${
            compliance >= 80 ? 'text-emerald-600' : compliance >= 50 ? 'text-amber-600' : 'text-red-500'
          }`}>
            {compliance}<span className="text-lg opacity-60">%</span>
          </span>
        </div>
      </div>

      {/* Permit Matrix */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm shadow-emerald-500/10">
            <Shield size={14} strokeWidth={1.8} />
          </div>
          <span className="text-[14px] font-semibold text-gray-900">Permisos</span>
          {criticals > 0 && (
            <Badge variant="risk" risk="critico">{criticals} {criticals === 1 ? 'crítico' : 'críticos'}</Badge>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {permits.map((permit) => (
            <PermitCard
              key={permit.id}
              permit={permit}
              documents={getPermitDocuments(permit.id)}
              onUpload={() => setUploadPermit(permit)}
            />
          ))}
        </div>
      </div>

      {faltantes.length > 0 && (
        <Card padding="none" className="!border-red-200">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-red-100 bg-red-50/50">
            <AlertTriangle size={16} className="text-red-500" />
            <span className="text-[14px] font-semibold text-red-700">Permisos faltantes</span>
          </div>
          <div className="divide-y divide-gray-50">
            {faltantes.map((p) => (
              <div
                key={p.id}
                className="px-5 py-3.5 flex items-center justify-between hover:bg-red-50/30 transition-colors cursor-pointer group"
                onClick={() => setUploadPermit(p)}
              >
                <div>
                  <p className="text-[13px] font-medium text-gray-900">{PERMIT_TYPE_LABELS[p.type]}</p>
                  <p className="text-[12px] text-red-500 mt-0.5">Permiso requerido no registrado</p>
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-blue-700">
                  <Upload size={12} />
                  Subir
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {renewals.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm shadow-amber-500/10">
              <CalendarClock size={14} strokeWidth={1.8} />
            </div>
            <span className="text-[14px] font-semibold text-gray-900">Vencimientos</span>
          </div>
          <div className="space-y-2">
            {renewals
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .map((r) => {
                const permit = permits.find((p) => p.id === r.permitId);
                const days = daysUntil(r.dueDate);
                return (
                  <Card key={r.id} padding="sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <StatusDot
                          status={days < 0 ? 'vencido' : days <= 30 ? 'por_vencer' : 'vigente'}
                          pulse={days < 0}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-medium text-gray-900">
                              {permit ? PERMIT_TYPE_LABELS[permit.type] : 'Permiso'}
                            </p>
                            {permit && <LegalPill permitType={permit.type} variant="inline" />}
                          </div>
                          <p className="text-[12px] text-gray-400 mt-0.5">{r.owner || 'Sin asignar'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[13px] font-semibold ${
                          days < 0 ? 'text-red-500' :
                          days <= 30 ? 'text-amber-600' :
                          'text-gray-400'
                        }`}>
                          {formatDateRelative(r.dueDate)}
                        </span>
                        <p className="text-[12px] text-gray-400">{formatDate(r.dueDate)}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-sm shadow-rose-500/10">
            <ListChecks size={14} strokeWidth={1.8} />
          </div>
          <span className="text-[14px] font-semibold text-gray-900">Tareas</span>
          <span className="text-[12px] text-gray-400 px-2 py-0.5 rounded-lg bg-gray-50 border border-gray-100 font-medium">{tasks.filter(t => t.status !== 'completada').length} pendientes</span>
        </div>
        {tasks.length > 0 ? (
          <div className="space-y-2">
            {tasks
              .sort((a, b) => {
                const order = { critica: 0, alta: 1, media: 2, baja: 3 };
                return order[a.priority] - order[b.priority];
              })
              .map((task) => (
                <Card key={task.id} padding="sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <StatusDot
                        status={
                          task.status === 'completada' ? 'vigente' :
                          task.priority === 'critica' ? 'vencido' :
                          task.priority === 'alta' ? 'por_vencer' :
                          'en_tramite'
                        }
                      />
                      <div>
                        <p className="text-[13px] font-medium text-gray-900">{task.title}</p>
                        <p className="text-[12px] text-gray-400 mt-0.5">{task.description}</p>
                        {task.assignee && (
                          <p className="text-[12px] text-gray-500 mt-1 font-medium">{task.assignee}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge variant="priority" priority={task.priority}>{task.priority}</Badge>
                      {task.dueDate && (
                        <span className="text-[12px] text-gray-400">
                          {formatDateRelative(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        ) : (
          <Card><p className="text-[13px] text-gray-400 text-center py-6">Sin tareas asignadas</p></Card>
        )}
      </div>

      {uploadPermit && (
        <PermitUploadModal
          permit={uploadPermit}
          onClose={() => setUploadPermit(null)}
        />
      )}
    </div>
  );
}

function PermitCard({ permit, documents, onUpload }: { permit: Permit; documents: Document[]; onUpload: () => void }) {
  const isRisk = permit.status === 'vencido' || permit.status === 'no_registrado';
  const needsAction = permit.status !== 'vigente';
  const latestDoc = documents.length > 0
    ? documents.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0]
    : null;

  return (
    <Card
      padding="none"
      className={`group ${isRisk ? '!border-red-200' : ''} cursor-pointer`}
      hover
      onClick={onUpload}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-[13px] font-semibold text-gray-900">
            {PERMIT_TYPE_LABELS[permit.type]}
          </span>
          <Badge
            variant="status"
            status={permit.status}
            pulse={permit.status === 'vencido'}
          >
            {PERMIT_STATUS_LABELS[permit.status]}
          </Badge>
        </div>
        <p className="text-[12px] text-gray-400">{permit.issuer}</p>
        {permit.expiryDate && (
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[11px] text-gray-400 font-medium">Vencimiento</span>
            <span className={`text-[12px] font-semibold ${
              daysUntil(permit.expiryDate) < 0 ? 'text-red-500' :
              daysUntil(permit.expiryDate) <= 30 ? 'text-amber-600' :
              'text-gray-600'
            }`}>
              {formatDate(permit.expiryDate)}
            </span>
          </div>
        )}
        {permit.status === 'no_registrado' && (
          <p className="text-[12px] text-red-500 mt-2 font-medium">Permiso requerido no registrado</p>
        )}

        {/* Document section — always visible */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          {latestDoc ? (
            <div className="flex items-center gap-3">
              {/* Thumbnail */}
              {latestDoc.thumbnailUrl ? (
                <div className="w-12 h-12 rounded-lg border border-gray-200 overflow-hidden shrink-0 bg-gray-50">
                  <img
                    src={latestDoc.thumbnailUrl}
                    alt={latestDoc.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-gray-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-gray-700 truncate">{latestDoc.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(latestDoc.uploadedAt)}</p>
              </div>
              {/* Re-upload hint */}
              <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                  <RefreshCw size={12} className="text-gray-400" />
                </div>
              </div>
            </div>
          ) : needsAction ? (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-100/80 group-hover:bg-blue-100/60 transition-colors">
              <Upload size={13} className="text-blue-500 shrink-0" />
              <span className="text-[11px] font-semibold text-blue-600">
                {permit.status === 'no_registrado' ? 'Subir documento para registrar' :
                 permit.status === 'vencido' ? 'Subir renovación' :
                 permit.status === 'por_vencer' ? 'Subir renovación anticipada' :
                 'Subir documento'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 group-hover:bg-gray-100/60 transition-colors">
              <Upload size={13} className="text-gray-400 shrink-0" />
              <span className="text-[11px] font-medium text-gray-500">Subir documento</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
