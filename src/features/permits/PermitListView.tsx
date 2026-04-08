import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { Card, Badge, StatusDot, EmptyState, LegalPill } from '@/components/ui';
import {
  PERMIT_TYPE_LABELS,
  PERMIT_STATUS_LABELS,
} from '@/types';
import { formatDate, formatDateRelative, daysUntil } from '@/lib/dates';
import { getLegalReference } from '@/data/legal-references';
import { Filter, ChevronDown, ChevronUp, FileText, ListChecks, AlertTriangle, Scale, ExternalLink, Clock, BookOpen, Shield } from 'lucide-react';

export function PermitListView() {
  const { permits, locations, documents, tasks } = useAppStore();
  const navigate = useNavigate();
  const [filterSede, setFilterSede] = useState<string>('all');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return permits.filter((p) => {
      if (filterSede !== 'all' && p.locationId !== filterSede) return false;
      if (filterTipo !== 'all' && p.type !== filterTipo) return false;
      if (filterEstado !== 'all' && p.status !== filterEstado) return false;
      return true;
    });
  }, [permits, filterSede, filterTipo, filterEstado]);

  const uniqueTypes = [...new Set(permits.map((p) => p.type))];
  const uniqueStatuses = [...new Set(permits.map((p) => p.status))];

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm shadow-emerald-500/10">
            <Shield size={16} strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Permisos</h2>
            <p className="text-[12px] text-gray-400 font-medium">{permits.length} permisos rastreados en {locations.length} sedes</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Filter size={14} className="text-gray-400" />
        <select
          value={filterSede}
          onChange={(e) => setFilterSede(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
        >
          <option value="all">Todas las sedes</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>

        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
        >
          <option value="all">Todos los tipos</option>
          {uniqueTypes.map((t) => (
            <option key={t} value={t}>{PERMIT_TYPE_LABELS[t]}</option>
          ))}
        </select>

        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
        >
          <option value="all">Todos los estados</option>
          {uniqueStatuses.map((s) => (
            <option key={s} value={s}>{PERMIT_STATUS_LABELS[s]}</option>
          ))}
        </select>

        {(filterSede !== 'all' || filterTipo !== 'all' || filterEstado !== 'all') && (
          <button
            onClick={() => { setFilterSede('all'); setFilterTipo('all'); setFilterEstado('all'); }}
            className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors font-medium"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {filtered.map((permit) => {
          const loc = locations.find((l) => l.id === permit.locationId);
          const isExpanded = expandedId === permit.id;
          const isRisk = permit.status === 'vencido' || permit.status === 'no_registrado';
          const permitDocs = documents.filter((d) => d.permitId === permit.id);
          const permitTasks = tasks.filter((t) => t.permitId === permit.id);

          return (
            <Card
              key={permit.id}
              padding="none"
              className={isRisk ? '!border-red-200' : ''}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : permit.id)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
              >
                <StatusDot status={permit.status} pulse={permit.status === 'vencido'} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[14px] font-semibold text-gray-900">
                      {PERMIT_TYPE_LABELS[permit.type]}
                    </span>
                    <Badge variant="status" status={permit.status}>
                      {PERMIT_STATUS_LABELS[permit.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[12px] text-gray-400">{loc?.name}</span>
                    <span className="text-gray-200">·</span>
                    <span className="text-[12px] text-gray-400">{permit.issuer}</span>
                    <span className="text-gray-200">·</span>
                    {/* Legal pill visible directly on the row */}
                    <LegalPill permitType={permit.type} variant="inline" />
                  </div>
                </div>

                {permit.expiryDate && (
                  <span className={`text-[13px] font-semibold shrink-0 ${
                    daysUntil(permit.expiryDate) < 0 ? 'text-red-500' :
                    daysUntil(permit.expiryDate) <= 30 ? 'text-amber-600' :
                    'text-gray-400'
                  }`}>
                    {formatDateRelative(permit.expiryDate)}
                  </span>
                )}

                {isExpanded ? (
                  <ChevronUp size={16} className="text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400 shrink-0" />
                )}
              </button>

              {isExpanded && (() => {
                const legalRef = getLegalReference(permit.type);
                return (
                <div className="border-t border-gray-100 px-5 py-4 space-y-4 animate-fade-in">
                  {isRisk && (
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
                      <AlertTriangle size={14} className="text-red-500" />
                      <span className="text-[13px] text-red-600 font-medium">
                        {permit.status === 'vencido'
                          ? 'Permiso vencido — actividad regulada sin autorización vigente'
                          : 'Permiso requerido no registrado — riesgo operativo activo'}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-5">
                    <div>
                      <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Emisor</span>
                      <p className="text-[13px] text-gray-700 mt-0.5 font-medium">{permit.issuer}</p>
                    </div>
                    {permit.issuedDate && (
                      <div>
                        <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Emitido</span>
                        <p className="text-[13px] text-gray-700 mt-0.5">{formatDate(permit.issuedDate)}</p>
                      </div>
                    )}
                    {permit.expiryDate && (
                      <div>
                        <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Vencimiento</span>
                        <p className="text-[13px] text-gray-700 mt-0.5">{formatDate(permit.expiryDate)}</p>
                      </div>
                    )}
                  </div>

                  {/* Full legal reference panel */}
                  {legalRef && (
                    <div className="rounded-2xl border border-indigo-100/80 bg-gradient-to-b from-indigo-50/40 to-white overflow-hidden">
                      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-indigo-100/60 bg-indigo-50/60">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-500 flex items-center justify-center">
                          <Scale size={13} />
                        </div>
                        <span className="text-[12px] font-bold text-indigo-700 uppercase tracking-wider">
                          Base Legal
                        </span>
                      </div>
                      <div className="px-4 py-3 space-y-3">
                        {legalRef.sources.map((source, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className="w-5 h-5 rounded-md bg-indigo-100/60 text-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                              <BookOpen size={10} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-[12px] text-gray-800 font-semibold">{source.shortName}</p>
                                {source.url && (
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
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
                              <p className="text-[10px] text-gray-400 mt-0.5">{source.entity}</p>
                            </div>
                          </div>
                        ))}

                        <div className="pt-2.5 border-t border-indigo-100/60">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Clock size={11} className="text-indigo-400" />
                            <span className="text-[11px] text-indigo-600 font-semibold">Periodicidad</span>
                          </div>
                          <p className="text-[11px] text-gray-600 leading-relaxed">
                            {legalRef.frequencyBasis}
                          </p>
                        </div>

                        {legalRef.consequences.length > 0 && (
                          <div className="pt-2.5 border-t border-indigo-100/60">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <AlertTriangle size={11} className="text-red-400" />
                              <span className="text-[11px] text-red-600 font-semibold">Riesgo por incumplimiento</span>
                            </div>
                            <ul className="space-y-1">
                              {legalRef.consequences.slice(0, 3).map((c, i) => (
                                <li key={i} className="flex items-start gap-2 text-[11px] text-gray-600">
                                  <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
                                  {c}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/marco-legal');
                          }}
                          className="flex items-center gap-1.5 text-[12px] text-indigo-600 hover:text-indigo-700 transition-colors font-semibold mt-1"
                        >
                          <Scale size={11} />
                          Ver referencia legal completa →
                        </button>
                      </div>
                    </div>
                  )}

                  {permitDocs.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <FileText size={13} className="text-gray-400" />
                        <span className="text-[12px] text-gray-500 font-semibold">Documentos</span>
                      </div>
                      {permitDocs.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 mb-1.5">
                          <span className="text-[13px] text-gray-700">{doc.name}</span>
                          <Badge variant="status" status={doc.status === 'vigente' ? 'vigente' : doc.status === 'vencido' ? 'vencido' : 'no_registrado'}>
                            {doc.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {permitTasks.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <ListChecks size={13} className="text-gray-400" />
                        <span className="text-[12px] text-gray-500 font-semibold">Tareas relacionadas</span>
                      </div>
                      {permitTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 mb-1.5">
                          <span className="text-[13px] text-gray-700">{task.title}</span>
                          <Badge variant="priority" priority={task.priority}>{task.priority}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                );
              })()}
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <EmptyState message="Sin permisos que coincidan con los filtros seleccionados." />
        )}
      </div>
    </div>
  );
}
