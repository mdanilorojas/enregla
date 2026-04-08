import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { Card, Badge, StatusDot, EmptyState, LegalPill } from '@/components/ui';
import {
  PERMIT_TYPE_LABELS,
  PERMIT_STATUS_LABELS,
  STAGE_LABELS,
  type Permit,
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
} from 'lucide-react';

export function LocationDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { locations, getLocationPermits, getLocationTasks, getLocationDocuments, getLocationRenewals } = useAppStore();

  const location = locations.find((l) => l.id === id);
  if (!location) {
    return <EmptyState message="Sede no encontrada." action="Volver a sedes" onAction={() => navigate('/sedes')} />;
  }

  const permits = getLocationPermits(location.id);
  const tasks = getLocationTasks(location.id);
  const documents = getLocationDocuments(location.id);
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
            <PermitCard key={permit.id} permit={permit} />
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
              <div key={p.id} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium text-gray-900">{PERMIT_TYPE_LABELS[p.type]}</p>
                  <p className="text-[12px] text-red-500 mt-0.5">Permiso requerido no registrado</p>
                </div>
                <LegalPill permitType={p.type} variant="inline" />
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
          <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-sm shadow-sky-500/10">
            <FileText size={14} strokeWidth={1.8} />
          </div>
          <span className="text-[14px] font-semibold text-gray-900">Documentos</span>
          <span className="text-[12px] text-gray-400 px-2 py-0.5 rounded-lg bg-gray-50 border border-gray-100 font-medium">{documents.length}</span>
        </div>
        {documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((doc) => (
              <Card key={doc.id} padding="sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                      <FileText size={14} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-gray-900">{doc.name}</p>
                      <p className="text-[12px] text-gray-400 mt-0.5">Subido {formatDate(doc.uploadedAt)}</p>
                    </div>
                  </div>
                  <Badge
                    variant="status"
                    status={doc.status === 'vigente' ? 'vigente' : doc.status === 'vencido' ? 'vencido' : 'no_registrado'}
                  >
                    {doc.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card><p className="text-[13px] text-gray-400 text-center py-6">Sin documentos registrados</p></Card>
        )}
      </div>

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
    </div>
  );
}

function PermitCard({ permit }: { permit: Permit }) {
  const isRisk = permit.status === 'vencido' || permit.status === 'no_registrado';

  return (
    <Card
      padding="none"
      className={isRisk ? '!border-red-200' : ''}
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

        {/* Legal reference always visible */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <LegalPill permitType={permit.type} variant="full" />
        </div>
      </div>
    </Card>
  );
}
