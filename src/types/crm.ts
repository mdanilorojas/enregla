// ====================================================
// Tipos del CRM interno: leads y partners (enablers)
// Reflejan las tablas en Supabase:
//   - leads (creada en migration 20260506000000_leads_table)
//   - partners (creada en migration 20260506000100_partners_crm)
// ====================================================

// ============ LEADS ============

export type LeadSource = 'diagnostico' | 'partners' | 'home' | 'sobre' | 'otro'

export type LeadStatus =
  | 'nuevo'
  | 'contactado'
  | 'demo_agendada'
  | 'demo_completada'
  | 'convertido'
  | 'rechazado'
  | 'nurture'

export type Lead = {
  id: string
  nombre: string
  negocio: string
  email: string
  telefono: string | null
  ciudad: string | null
  num_sedes: number | null
  source: LeadSource
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  referrer: string | null
  user_agent: string | null
  status: LeadStatus
  notas: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
}

// ============ PARTNERS (enablers) ============

export type PartnerTipo =
  | 'contadora'
  | 'tramitador'
  | 'arcsa'
  | 'bomberos'
  | 'legal'
  | 'asesor_admin'
  | 'pos_provider'
  | 'gremio'
  | 'otro'

export type PartnerStatus =
  | 'identificado'
  | 'contactado'
  | 'respondio'
  | 'reunion_agendada'
  | 'pilot_propuesto'
  | 'pilot_activo'
  | 'convertido'
  | 'rechazado'
  | 'nurture'

export type PartnerScoreField =
  | 'score_acceso_decision_makers'
  | 'score_dolor_frecuente'
  | 'score_confianza_clientes'
  | 'score_velocidad_referir'
  | 'score_complementariedad'
  | 'score_velocidad_ejecucion'
  | 'score_mindset_comercial'
  | 'score_riesgo_mal_partner'

export type Partner = {
  id: string
  nombre_negocio: string
  tipo: PartnerTipo
  contacto_nombre: string | null
  email: string | null
  telefono: string | null
  ciudad: string | null
  score_acceso_decision_makers: number | null
  score_dolor_frecuente: number | null
  score_confianza_clientes: number | null
  score_velocidad_referir: number | null
  score_complementariedad: number | null
  score_velocidad_ejecucion: number | null
  score_mindset_comercial: number | null
  score_riesgo_mal_partner: number | null
  /** Auto-generated (GENERATED ALWAYS AS STORED) en Postgres */
  score_total: number
  status: PartnerStatus
  potencial_clientes_estimado: number | null
  proxima_accion: string | null
  proxima_accion_fecha: string | null
  notas: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
}

// ============ QUALIFICATION HELPERS ============

export type PartnerQualification = 'priority' | 'good' | 'nurture' | 'ignore'

/**
 * Mapea score total (0-40) a qualification:
 * - >= 35: priority (alta prioridad, cerrar rapido)
 * - 28-34: good (pipeline normal)
 * - 20-27: nurture (seguimiento largo plazo)
 * - < 20: ignore (no invertir tiempo ahora)
 */
export function qualifyPartner(scoreTotal: number): PartnerQualification {
  if (scoreTotal >= 35) return 'priority'
  if (scoreTotal >= 28) return 'good'
  if (scoreTotal >= 20) return 'nurture'
  return 'ignore'
}

export function qualificationLabel(q: PartnerQualification): string {
  switch (q) {
    case 'priority': return 'Priority Partner'
    case 'good': return 'Good Partner'
    case 'nurture': return 'Nurture'
    case 'ignore': return 'Ignore for now'
  }
}
