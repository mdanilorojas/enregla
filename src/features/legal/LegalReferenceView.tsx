import { useState } from 'react';
import { Card } from '@/components/ui';
import { PERMIT_TYPE_LABELS, type PermitType } from '@/types';
import { getAllLegalReferences } from '@/data/legal-references';
import {
  Scale,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BookOpen,
  AlertTriangle,
  FileCheck,
  ListOrdered,
  DollarSign,
  Clock,
  Info,
  Building2,
} from 'lucide-react';

const SCOPE_LABELS: Record<string, string> = {
  nacional: 'Nacional',
  municipal: 'Municipal',
  institucional: 'Institucional',
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  ley_organica: 'Ley Orgánica',
  reglamento: 'Reglamento',
  ordenanza: 'Ordenanza',
  resolucion: 'Resolución',
  decreto: 'Decreto',
  normativa: 'Normativa Técnica',
};

export function LegalReferenceView() {
  const references = getAllLegalReferences();
  const [expandedType, setExpandedType] = useState<PermitType | null>(null);

  const toggleType = (type: PermitType) => {
    setExpandedType(expandedType === type ? null : type);
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <Scale size={20} className="text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Marco Legal</h2>
        </div>
        <p className="text-[13px] text-gray-500 mt-1">
          Referencia normativa de cada obligación regulatoria. Consulta las fuentes, artículos y periodicidad.
        </p>
      </div>

      <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-yellow-50 border border-yellow-200/60 mb-8">
        <Info size={16} className="text-yellow-600 mt-0.5 shrink-0" />
        <div className="text-[13px] text-yellow-800 leading-relaxed">
          <span className="font-semibold">Aviso importante:</span> Esta información se proporciona como referencia operativa, no como asesoría legal.
          Las normativas pueden actualizarse y las ordenanzas municipales varían por cantón.
        </div>
      </div>

      <div className="space-y-3">
        {references.map((ref) => {
          const isExpanded = expandedType === ref.permitType;

          return (
            <Card key={ref.permitType} padding="none" className={isExpanded ? '!border-gray-300' : ''}>
              <button
                onClick={() => toggleType(ref.permitType)}
                className="w-full flex items-center gap-4 px-5 py-5 text-left hover:bg-gray-50/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                  <Scale size={18} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[14px] font-semibold text-gray-900">
                    {PERMIT_TYPE_LABELS[ref.permitType]}
                  </span>
                  <p className="text-[12px] text-gray-400 mt-0.5 line-clamp-1">
                    {ref.description.slice(0, 120)}…
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[12px] text-gray-400 px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100">
                    {ref.sources.length} {ref.sources.length === 1 ? 'fuente' : 'fuentes'}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 animate-fade-in">
                  <div className="px-5 py-4 border-b border-gray-50">
                    <p className="text-[13px] text-gray-600 leading-relaxed">{ref.description}</p>
                  </div>

                  {/* Legal Sources */}
                  <div className="px-5 py-4 border-b border-gray-50">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen size={14} className="text-gray-400" />
                      <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                        Fuentes Normativas
                      </span>
                    </div>
                    <div className="space-y-3">
                      {ref.sources.map((source, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-gray-100 bg-gray-50/50 p-4"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <span className="text-[13px] font-medium text-gray-900">
                              {source.name}
                            </span>
                            {source.url && (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-700 transition-colors shrink-0 font-medium"
                              >
                                <ExternalLink size={11} />
                                Ver fuente
                              </a>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">
                              {SOURCE_TYPE_LABELS[source.type] || source.type}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">
                              {SCOPE_LABELS[source.scope] || source.scope}
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-gray-400">
                              <Building2 size={11} />
                              {source.entity}
                            </div>
                          </div>
                          {source.articles && (
                            <p className="text-[12px] text-gray-500 leading-relaxed bg-white rounded-lg px-3 py-2 border border-gray-100">
                              {source.articles}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Frequency Basis */}
                  <div className="px-5 py-4 border-b border-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={14} className="text-gray-400" />
                      <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                        Periodicidad y Base Legal
                      </span>
                    </div>
                    <p className="text-[13px] text-gray-600 leading-relaxed bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                      {ref.frequencyBasis}
                    </p>
                  </div>

                  {/* Consequences */}
                  <div className="px-5 py-4 border-b border-gray-50">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle size={14} className="text-red-400" />
                      <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                        Consecuencias por Incumplimiento
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {ref.consequences.map((c, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[13px] text-gray-600">
                          <span className="text-red-400 mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-red-400" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Required Documents */}
                  <div className="px-5 py-4 border-b border-gray-50">
                    <div className="flex items-center gap-2 mb-3">
                      <FileCheck size={14} className="text-gray-400" />
                      <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                        Documentos Requeridos
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {ref.requiredDocuments.map((d, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[13px] text-gray-600">
                          <span className="text-gray-400 font-medium shrink-0 w-5 text-right tabular-nums">{i + 1}.</span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Typical Process */}
                  <div className="px-5 py-4 border-b border-gray-50">
                    <div className="flex items-center gap-2 mb-3">
                      <ListOrdered size={14} className="text-gray-400" />
                      <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                        Proceso Típico
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {ref.typicalProcess.map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[11px] text-white font-medium">{i + 1}</span>
                          </div>
                          <span className="text-[13px] text-gray-600 pt-0.5">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cost & Disclaimer */}
                  <div className="px-5 py-4">
                    {ref.estimatedCost && (
                      <div className="flex items-start gap-2.5 mb-4">
                        <DollarSign size={14} className="text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                            Costo Estimado
                          </span>
                          <p className="text-[13px] text-gray-600 mt-1">{ref.estimatedCost}</p>
                        </div>
                      </div>
                    )}
                    {ref.disclaimer && (
                      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                        <Info size={13} className="text-gray-400 mt-0.5 shrink-0" />
                        <p className="text-[12px] text-gray-400 leading-relaxed italic">
                          {ref.disclaimer}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
