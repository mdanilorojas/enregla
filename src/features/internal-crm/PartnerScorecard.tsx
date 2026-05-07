import { useState } from 'react'
import { qualifyPartner, qualificationLabel, type Partner } from '@/types/crm'

type ScoreFieldKey =
  | 'score_acceso_decision_makers'
  | 'score_dolor_frecuente'
  | 'score_confianza_clientes'
  | 'score_velocidad_referir'
  | 'score_complementariedad'
  | 'score_velocidad_ejecucion'
  | 'score_mindset_comercial'
  | 'score_riesgo_mal_partner'

type ScoreField = {
  key: ScoreFieldKey
  label: string
  help: string
}

const SCORE_FIELDS: ScoreField[] = [
  { key: 'score_acceso_decision_makers', label: 'Acceso a decision makers', help: '¿Puede llegar rápido al dueño o gerente?' },
  { key: 'score_dolor_frecuente', label: 'Frecuencia del dolor de compliance', help: '¿Sus clientes sufren permisos vencidos a menudo?' },
  { key: 'score_confianza_clientes', label: 'Confianza con sus clientes', help: '¿Sus clientes lo consideran asesor, no proveedor?' },
  { key: 'score_velocidad_referir', label: 'Velocidad para referir', help: '¿Va a referir rápido o se toma meses?' },
  { key: 'score_complementariedad', label: 'Complementariedad con EnRegla', help: '¿Su trabajo complementa o compite con nosotros?' },
  { key: 'score_velocidad_ejecucion', label: 'Velocidad de ejecución', help: '¿Es acción o solo habla?' },
  { key: 'score_mindset_comercial', label: 'Mindset comercial', help: '¿Piensa en ganar-ganar o solo en él?' },
  { key: 'score_riesgo_mal_partner', label: 'Riesgo de ser mal partner (invertido)', help: '5 = bajo riesgo; 1 = alto riesgo' },
]

type Props = {
  initialScores?: Partial<Pick<Partner, ScoreFieldKey>>
  onChange?: (scores: Record<ScoreFieldKey, number>, total: number) => void
}

export function PartnerScorecard({ initialScores = {}, onChange }: Props) {
  const [scores, setScores] = useState<Record<ScoreFieldKey, number>>(() => {
    const init = {} as Record<ScoreFieldKey, number>
    for (const f of SCORE_FIELDS) {
      init[f.key] = (initialScores[f.key] as number | null | undefined) ?? 0
    }
    return init
  })

  const total = Object.values(scores).reduce((a, b) => a + b, 0)
  const qualification = qualifyPartner(total)

  const handleScore = (key: ScoreFieldKey, value: number) => {
    const next = { ...scores, [key]: value }
    setScores(next)
    const newTotal = Object.values(next).reduce((a, b) => a + b, 0)
    onChange?.(next, newTotal)
  }

  const qualColors: Record<string, string> = {
    priority: 'bg-ds-green-50 text-ds-green-600 border-ds-green-500',
    good: 'bg-ds-blue-50 text-ds-blue-500 border-ds-blue-500',
    nurture: 'bg-ds-yellow-50 text-ds-yellow-600 border-ds-yellow-500',
    ignore: 'bg-ds-red-50 text-ds-red-600 border-ds-red-500',
  }

  return (
    <div className="bg-white border border-ds-neutral-200 rounded-lg p-6">
      <div className="flex justify-between items-start mb-6 gap-4 flex-wrap">
        <h3 className="text-lg font-extrabold text-ds-blue-500">Partner Scorecard</h3>
        <div className={`px-3 py-1.5 rounded border text-sm font-bold ${qualColors[qualification]}`}>
          {total} / 40 — {qualificationLabel(qualification)}
        </div>
      </div>

      <div className="space-y-4">
        {SCORE_FIELDS.map(field => (
          <div key={field.key}>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-semibold text-ds-blue-500">{field.label}</label>
              <span className="text-sm text-ds-neutral-600">{scores[field.key]} / 5</span>
            </div>
            <p className="text-xs text-ds-neutral-500 mb-2">{field.help}</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleScore(field.key, n)}
                  className={`flex-1 py-2 text-sm font-semibold rounded transition-colors ${
                    scores[field.key] >= n
                      ? 'bg-ds-blue-500 text-white'
                      : 'bg-ds-neutral-100 text-ds-neutral-600 hover:bg-ds-neutral-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
