import { useState } from 'react';
import type { ClassificationResult, PermitType } from '@/types';
import { Badge } from '@/components/ui';
import { getLegalReference } from '@/data/legal-references';
import { AlertTriangle, Info, Scale, ExternalLink, ChevronDown, ChevronUp, Clock } from 'lucide-react';

interface Props {
  classifications: ClassificationResult[];
}

export function StepClasificacion({ classifications }: Props) {
  const [expandedObligation, setExpandedObligation] = useState<string | null>(null);

  const toggleObligation = (locationId: string, type: PermitType) => {
    const key = `${locationId}-${type}`;
    setExpandedObligation(expandedObligation === key ? null : key);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-enregla-100 mb-1">Obligaciones identificadas</h2>
      <p className="text-sm text-enregla-400 mb-8">
        Basado en el tipo de negocio y los factores de cada local. Revisa y confirma.
      </p>

      <div className="space-y-6">
        {classifications.map((c) => (
          <div key={c.locationId} className="border border-enregla-700/50 rounded-lg bg-enregla-900/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-enregla-700/30">
              <span className="text-sm font-medium text-enregla-200">{c.locationName || 'Local sin nombre'}</span>
              <Badge variant="risk" risk={c.riskLevel}>{c.riskLevel}</Badge>
            </div>

            <div className="p-4 space-y-2">
              {c.obligations.map((o) => {
                const key = `${c.locationId}-${o.type}`;
                const isExpanded = expandedObligation === key;
                const legalRef = getLegalReference(o.type);

                return (
                  <div key={o.type} className="rounded-md bg-enregla-800/50 overflow-hidden">
                    <div className="flex items-center justify-between py-2 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-enregla-100 shrink-0" />
                        <div>
                          <span className="text-sm text-enregla-200">{o.name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-enregla-500">{o.issuer}</span>
                            <span className="text-[10px] text-enregla-600">·</span>
                            <span className="text-[10px] text-enregla-500">{o.frequency}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {o.validateInCity && (
                          <span className="flex items-center gap-1 text-[10px] text-status-por-vencer">
                            <AlertTriangle size={10} />
                            Validar en ciudad
                          </span>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          o.confidence === 'alta'
                            ? 'bg-status-vigente/10 text-status-vigente'
                            : 'bg-status-por-vencer/10 text-status-por-vencer'
                        }`}>
                          {o.confidence === 'alta' ? 'Alta confianza' : 'Confianza media'}
                        </span>
                        {legalRef && (
                          <button
                            onClick={() => toggleObligation(c.locationId, o.type)}
                            className="flex items-center gap-0.5 text-[10px] text-enregla-500 hover:text-enregla-300 transition-colors"
                          >
                            <Scale size={10} />
                            {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && legalRef && (
                      <div className="border-t border-enregla-700/20 px-3 py-2.5 bg-enregla-900/30 space-y-2">
                        <p className="text-[10px] text-enregla-400 leading-relaxed">
                          {legalRef.description.slice(0, 180)}…
                        </p>
                        <div className="space-y-1.5">
                          {legalRef.sources.map((source, i) => (
                            <div key={i} className="flex items-start justify-between gap-2 py-1 px-2 rounded bg-enregla-800/40">
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-enregla-300 font-medium">{source.shortName}</p>
                                {source.articles && (
                                  <p className="text-[9px] text-enregla-600 mt-0.5">{source.articles}</p>
                                )}
                              </div>
                              {source.url && (
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-0.5 text-[9px] text-enregla-500 hover:text-enregla-300 shrink-0"
                                >
                                  <ExternalLink size={8} />
                                  Ver
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-start gap-1.5 pt-1 border-t border-enregla-700/15">
                          <Clock size={10} className="text-enregla-600 mt-0.5 shrink-0" />
                          <p className="text-[9px] text-enregla-600 leading-relaxed">
                            <span className="text-enregla-500 font-medium">Periodicidad: </span>
                            {o.frequencyBasis || legalRef.frequencyBasis.slice(0, 150) + '…'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="px-4 pb-3">
              <div className="flex items-start gap-2 px-3 py-2 rounded bg-enregla-800/30">
                <Info size={13} className="text-enregla-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-enregla-500 leading-relaxed">
                  Las obligaciones se determinan según el tipo de actividad y factores operativos. Haz clic en <Scale size={9} className="inline" /> para ver la base legal. Los ítems marcados como "validar en ciudad" pueden variar según ordenanzas municipales específicas.
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
