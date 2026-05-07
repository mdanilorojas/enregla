-- =============================================
-- Partners (enablers) CRM table
-- Purpose: Gestion del pipeline de enablers (contadoras, tramitadores,
--          consultores ARCSA/bomberos, legales, etc.) que refieren clientes
--          a EnRegla. Tabla solo accesible desde CRM interno (no publica).
-- =============================================

CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Datos basicos
  nombre_negocio TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'contadora',
    'tramitador',
    'arcsa',
    'bomberos',
    'legal',
    'asesor_admin',
    'pos_provider',
    'gremio',
    'otro'
  )),
  contacto_nombre TEXT,
  email TEXT CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  telefono TEXT,
  ciudad TEXT,

  -- Scoring (8 criterios * 1-5 = max 40)
  score_acceso_decision_makers INTEGER CHECK (score_acceso_decision_makers BETWEEN 1 AND 5),
  score_dolor_frecuente INTEGER CHECK (score_dolor_frecuente BETWEEN 1 AND 5),
  score_confianza_clientes INTEGER CHECK (score_confianza_clientes BETWEEN 1 AND 5),
  score_velocidad_referir INTEGER CHECK (score_velocidad_referir BETWEEN 1 AND 5),
  score_complementariedad INTEGER CHECK (score_complementariedad BETWEEN 1 AND 5),
  score_velocidad_ejecucion INTEGER CHECK (score_velocidad_ejecucion BETWEEN 1 AND 5),
  score_mindset_comercial INTEGER CHECK (score_mindset_comercial BETWEEN 1 AND 5),
  score_riesgo_mal_partner INTEGER CHECK (score_riesgo_mal_partner BETWEEN 1 AND 5),
  score_total INTEGER GENERATED ALWAYS AS (
    COALESCE(score_acceso_decision_makers, 0) +
    COALESCE(score_dolor_frecuente, 0) +
    COALESCE(score_confianza_clientes, 0) +
    COALESCE(score_velocidad_referir, 0) +
    COALESCE(score_complementariedad, 0) +
    COALESCE(score_velocidad_ejecucion, 0) +
    COALESCE(score_mindset_comercial, 0) +
    COALESCE(score_riesgo_mal_partner, 0)
  ) STORED,

  -- Estado en pipeline
  status TEXT NOT NULL DEFAULT 'identificado' CHECK (status IN (
    'identificado',
    'contactado',
    'respondio',
    'reunion_agendada',
    'pilot_propuesto',
    'pilot_activo',
    'convertido',
    'rechazado',
    'nurture'
  )),

  -- Potencial estimado
  potencial_clientes_estimado INTEGER,

  -- Proxima accion
  proxima_accion TEXT,
  proxima_accion_fecha DATE,

  notas TEXT,
  assigned_to UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes para queries comunes en CRM
CREATE INDEX idx_partners_status ON partners(status);
CREATE INDEX idx_partners_tipo ON partners(tipo);
CREATE INDEX idx_partners_score_total ON partners(score_total DESC);
CREATE INDEX idx_partners_proxima_accion ON partners(proxima_accion_fecha);

-- Enable RLS
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- Policy: solo usuarios autenticados (CRM interno)
-- No hay INSERT publico: los partners se crean manualmente desde CRM
CREATE POLICY "Authenticated users can manage partners"
ON partners FOR ALL
USING (auth.uid() IS NOT NULL);

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER partners_update_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_partners_updated_at();

COMMENT ON TABLE partners IS 'Partners (enablers) en pipeline del CRM interno. No es tabla publica.';
COMMENT ON COLUMN partners.tipo IS 'Tipo de enabler: contadora, tramitador, arcsa, bomberos, legal, asesor_admin, pos_provider, gremio, otro';
COMMENT ON COLUMN partners.score_total IS 'Auto-calculado: suma de los 8 scores individuales (max 40). Qualification: >=35 priority, 28-34 good, 20-27 nurture, <20 ignore.';
COMMENT ON COLUMN partners.status IS 'Estado en pipeline: identificado -> contactado -> respondio -> reunion -> pilot -> convertido | rechazado | nurture';
