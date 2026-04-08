import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '@/store';
import { Card, Badge, EmptyState } from '@/components/ui';
import {
  PERMIT_TYPE_LABELS,
  PERMIT_STATUS_LABELS,
} from '@/types';
import { formatDate, formatDateRelative, daysUntil } from '@/lib/dates';
import { getLegalReference } from '@/data/legal-references';
import {
  ArrowLeft,
  Shield,
  FileText,
  ListChecks,
  CalendarClock,
  AlertTriangle,
  Scale,
  ExternalLink,
  Clock,
  BookOpen,
  MapPin,
  Building2,
} from 'lucide-react';

export function PermitDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { permits, locations, documents, tasks, renewals } = useAppStore();

  const permit = permits.find((p) => p.id === id);
  if (!permit) {
    return <EmptyState message="Permiso no encontrado." action="Volver a permisos" onAction={() => navigate('/permisos')} />;
  }

  const location = locations.find((l) => l.id === permit.locationId);
  const permitDocs = documents.filter((d) => d.permitId === permit.id);
  const permitTasks = tasks.filter((t) => t.permitId === permit.id && t.status !== 'completada');
  const permitRenewals = renewals.filter((r) => r.permitId === permit.id);
  const legalRef = getLegalReference(permit.type);
  const isRisk = permit.status === 'vencido' || permit.status === 'no_registrado';
  const latestDoc = permitDocs.length > 0
    ? [...permitDocs].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0]
    : null;

  return (
    <div className="space-y-6 max-w-3xl">
      <button
        onClick={() => navigate('/permisos')}
        className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 transition-colors font-medium"
      >
        <ArrowLeft size={14} />
        Permisos
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200/60 flex items-center justify-center shadow-sm">
            <Shield size={18} className="text-emerald-600" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
              {PERMIT_TYPE_LABELS[permit.type]}
            </h2>
            <p className="text-[12px] text-gray-400 mt-0.5">{permit.issuer}</p>
          </div>
        </div>
        <Badge variant="status" status={permit.status} pulse={permit.status === 'vencido'}>
          {PERMIT_STATUS_LABELS[permit.status]}
        </Badge>
      </div>

      {/* Risk alert */}
      {isRisk && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
          <AlertTriangle size={14} className="text-red-500 shrink-0" />
          <span className="text-[13px] text-red-600 font-medium">
            {permit.status === 'vencido'
              ? 'Permiso vencido — actividad regulada sin autorización vigente'
              : 'Permiso requerido no registrado — riesgo operativo activo'}
          </span>
        </div>
      )}

      {/* Details grid */}
      <Card>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          <div>
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Sede</span>
            {location ? (
              <Link
                to={`/sedes/${location.id}`}
                className="flex items-center gap-1.5 text-[13px] text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <MapPin size={12} />
                {location.name}
              </Link>
            ) : (
              <p className="text-[13px] text-gray-500">—</p>
            )}
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Emisor</span>
            <p className="text-[13px] text-gray-700 font-medium">{permit.issuer}</p>
          </div>
          {permit.issuedDate && (
            <div>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Emitido</span>
              <p className="text-[13px] text-gray-700">{formatDate(permit.issuedDate)}</p>
            </div>
          )}
          {permit.expiryDate && (
            <div>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Vencimiento</span>
              <p className={`text-[13px] font-semibold ${
                daysUntil(permit.expiryDate) < 0 ? 'text-red-500' :
                daysUntil(permit.expiryDate) <= 30 ? 'text-amber-600' :
                'text-gray-700'
              }`}>
                {formatDate(permit.expiryDate)}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">{formatDateRelative(permit.expiryDate)}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Document */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-sm shadow-sky-500/10">
            <FileText size={14} strokeWidth={1.8} />
          </div>
          <span className="text-[14px] font-semibold text-gray-900">Documento</span>
        </div>

        {latestDoc ? (
          <Card padding="none">
            <div className="flex items-center gap-4 p-4">
              {latestDoc.thumbnailUrl ? (
                <div className="w-16 h-16 rounded-xl border border-gray-200 overflow-hidden shrink-0 bg-gray-50">
                  <img src={latestDoc.thumbnailUrl} alt={latestDoc.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
                  <FileText size={24} className="text-gray-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-gray-900 truncate">{latestDoc.name}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Subido {formatDate(latestDoc.uploadedAt)}</p>
                {latestDoc.expiryDate && (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Vence {formatDate(latestDoc.expiryDate)}
                  </p>
                )}
              </div>
              <Badge
                variant="status"
                status={latestDoc.status === 'vigente' ? 'vigente' : latestDoc.status === 'vencido' ? 'vencido' : 'no_registrado'}
              >
                {latestDoc.status}
              </Badge>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="flex items-center gap-3 py-4 justify-center">
              <FileText size={18} className="text-gray-300" />
              <p className="text-[13px] text-gray-400">Sin documento registrado</p>
            </div>
          </Card>
        )}
      </div>

      {/* Legal reference */}
      {legalRef && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-500/10">
              <Scale size={14} strokeWidth={1.8} />
            </div>
            <span className="text-[14px] font-semibold text-gray-900">Base legal</span>
          </div>

          <Card padding="none">
            <div className="p-5 space-y-4">
              <p className="text-[12px] text-gray-600 leading-relaxed">{legalRef.description}</p>

              <div className="space-y-3">
                {legalRef.sources.map((source, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-indigo-100/60 text-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                      <BookOpen size={11} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[12px] text-gray-800 font-semibold">{source.shortName}</p>
                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] text-indigo-500 hover:text-indigo-700 transition-colors shrink-0 font-medium"
                          >
                            <ExternalLink size={10} />
                            Ver fuente
                          </a>
                        )}
                      </div>
                      {source.articles && (
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{source.articles}</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-0.5">{source.entity} · {source.scope}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock size={12} className="text-indigo-400" />
                  <span className="text-[11px] text-indigo-600 font-semibold">Periodicidad</span>
                </div>
                <p className="text-[12px] text-gray-600 leading-relaxed">{legalRef.frequencyBasis}</p>
              </div>

              {legalRef.consequences.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle size={12} className="text-red-400" />
                    <span className="text-[11px] text-red-600 font-semibold">Riesgo por incumplimiento</span>
                  </div>
                  <ul className="space-y-1.5">
                    {legalRef.consequences.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-gray-600 leading-snug">
                        <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {legalRef.requiredDocuments.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <span className="text-[11px] text-gray-500 font-semibold block mb-1.5">Documentos requeridos</span>
                  <ul className="space-y-1">
                    {legalRef.requiredDocuments.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-gray-600">
                        <FileText size={11} className="text-gray-400 shrink-0 mt-0.5" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {legalRef.typicalProcess.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <span className="text-[11px] text-gray-500 font-semibold block mb-1.5">Proceso típico</span>
                  <ol className="space-y-1.5">
                    {legalRef.typicalProcess.map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[12px] text-gray-600">
                        <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0 text-[10px] font-bold">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {legalRef.estimatedCost && (
                <div className="pt-3 border-t border-gray-100">
                  <span className="text-[11px] text-gray-500 font-semibold block mb-1">Costo estimado</span>
                  <p className="text-[12px] text-gray-700 font-medium">{legalRef.estimatedCost}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Renewals */}
      {permitRenewals.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm shadow-amber-500/10">
              <CalendarClock size={14} strokeWidth={1.8} />
            </div>
            <span className="text-[14px] font-semibold text-gray-900">Renovaciones</span>
          </div>
          <div className="space-y-2">
            {permitRenewals
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .map((r) => {
                const days = daysUntil(r.dueDate);
                return (
                  <Card key={r.id} padding="sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="priority" priority={r.priority}>{r.priority}</Badge>
                          <span className="text-[12px] text-gray-500">{r.owner || 'Sin asignar'}</span>
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
                        <p className="text-[11px] text-gray-400">{formatDate(r.dueDate)}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* Tasks */}
      {permitTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-sm shadow-rose-500/10">
              <ListChecks size={14} strokeWidth={1.8} />
            </div>
            <span className="text-[14px] font-semibold text-gray-900">Tareas pendientes</span>
          </div>
          <div className="space-y-2">
            {permitTasks.map((task) => (
              <Card key={task.id} padding="sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-gray-900">{task.title}</p>
                    <p className="text-[12px] text-gray-400 mt-0.5">{task.description}</p>
                    {task.assignee && (
                      <p className="text-[12px] text-gray-500 mt-1 font-medium">{task.assignee}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge variant="priority" priority={task.priority}>{task.priority}</Badge>
                    {task.dueDate && (
                      <span className="text-[11px] text-gray-400">{formatDateRelative(task.dueDate)}</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Navigate to sede */}
      {location && (
        <div className="pt-2">
          <Link
            to={`/sedes/${location.id}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200/80 text-[13px] font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Building2 size={14} />
            Ver sede {location.name} para subir documento
          </Link>
        </div>
      )}
    </div>
  );
}
