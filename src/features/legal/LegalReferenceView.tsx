import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Search,
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
  const [searchQuery, setSearchQuery] = useState('');

  const toggleType = (type: PermitType) => {
    setExpandedType(expandedType === type ? null : type);
  };

  // Filter references by search query
  const filteredReferences = references.filter((ref) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      PERMIT_TYPE_LABELS[ref.permitType]?.toLowerCase().includes(query) ||
      ref.description.toLowerCase().includes(query) ||
      ref.sources.some((s) => s.name.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
            <Scale size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Marco Legal
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Referencia normativa de cada obligación regulatoria
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex items-start gap-3 pt-6">
          <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900 leading-relaxed">
            <span className="font-semibold">Aviso importante:</span> Esta
            información se proporciona como referencia operativa, no como
            asesoría legal. Las normativas pueden actualizarse y las ordenanzas
            municipales varían por cantón.
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <Input
          type="text"
          placeholder="Buscar por tipo de permiso, normativa o entidad..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 h-12"
        />
      </div>

      {/* Results count */}
      {searchQuery && (
        <div className="text-sm text-gray-500">
          {filteredReferences.length === 0 ? (
            <span>No se encontraron resultados para "{searchQuery}"</span>
          ) : (
            <span>
              {filteredReferences.length}{' '}
              {filteredReferences.length === 1 ? 'resultado' : 'resultados'}
            </span>
          )}
        </div>
      )}

      {/* References List */}
      <div className="space-y-4">
        {filteredReferences.map((ref) => {
          const isExpanded = expandedType === ref.permitType;

          return (
            <Card
              key={ref.permitType}
              className={`transition-all ${
                isExpanded ? 'ring-2 ring-gray-200' : ''
              }`}
            >
              {/* Collapsed Header */}
              <button
                onClick={() => toggleType(ref.permitType)}
                className="w-full"
              >
                <CardHeader className="hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      <Scale size={20} className="text-gray-600" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <h3 className="text-base font-semibold text-gray-900">
                        {PERMIT_TYPE_LABELS[ref.permitType]}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                        {ref.description.slice(0, 120)}…
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant="secondary">
                        {ref.sources.length}{' '}
                        {ref.sources.length === 1 ? 'fuente' : 'fuentes'}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp size={20} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <CardContent className="space-y-6 animate-in fade-in duration-200">
                  {/* Description */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {ref.description}
                    </p>
                  </div>

                  {/* Legal Sources */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen size={16} className="text-gray-600" />
                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Fuentes Normativas
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {ref.sources.map((source, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-lg border border-gray-100 bg-white space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h5 className="text-sm font-semibold text-gray-900">
                              {source.name}
                            </h5>
                            {source.url && (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors shrink-0 font-medium"
                              >
                                <ExternalLink size={12} />
                                Ver fuente
                              </a>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">
                              {SOURCE_TYPE_LABELS[source.type] || source.type}
                            </Badge>
                            <Badge variant="secondary">
                              {SCOPE_LABELS[source.scope] || source.scope}
                            </Badge>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Building2 size={12} />
                              {source.entity}
                            </div>
                          </div>
                          {source.articles && (
                            <p className="text-sm text-gray-600 leading-relaxed p-3 bg-gray-50 rounded-md">
                              {source.articles}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Frequency Basis */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock size={16} className="text-gray-600" />
                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Periodicidad y Base Legal
                      </h4>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-900 leading-relaxed">
                        {ref.frequencyBasis}
                      </p>
                    </div>
                  </div>

                  {/* Consequences */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle size={16} className="text-red-600" />
                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Consecuencias por Incumplimiento
                      </h4>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-100 space-y-2">
                      {ref.consequences.map((c, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-2" />
                          <p className="text-sm text-red-900">{c}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Required Documents */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileCheck size={16} className="text-gray-600" />
                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Documentos Requeridos
                      </h4>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
                      {ref.requiredDocuments.map((d, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="text-sm font-medium text-gray-500 shrink-0 w-6 text-right tabular-nums">
                            {i + 1}.
                          </span>
                          <p className="text-sm text-gray-700">{d}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Typical Process */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <ListOrdered size={16} className="text-gray-600" />
                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Proceso Típico
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {ref.typicalProcess.map((step, i) => (
                        <div key={i} className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                            <span className="text-sm text-white font-semibold">
                              {i + 1}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 pt-1.5">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cost & Disclaimer */}
                  <div className="space-y-4">
                    {ref.estimatedCost && (
                      <div className="flex items-start gap-3">
                        <DollarSign size={16} className="text-gray-600 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                            Costo Estimado
                          </h4>
                          <p className="text-sm text-gray-700">{ref.estimatedCost}</p>
                        </div>
                      </div>
                    )}
                    {ref.disclaimer && (
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-100">
                        <Info size={14} className="text-gray-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-gray-600 leading-relaxed italic">
                          {ref.disclaimer}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* No results */}
      {filteredReferences.length === 0 && (
        <div className="text-center py-12">
          <Scale size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            No se encontraron referencias legales que coincidan con tu búsqueda.
          </p>
        </div>
      )}
    </div>
  );
}
