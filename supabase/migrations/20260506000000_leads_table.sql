-- =============================================
-- Leads table (captured from enregla-landing)
-- Purpose: Captura leads públicos desde los forms de la landing
--          (/diagnostico, /partners, /sobre, home) y gestión en CRM interno
-- =============================================

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Datos del lead (captura desde form)
  nombre TEXT NOT NULL,
  negocio TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  ciudad TEXT,
  num_sedes INTEGER,

  -- Origen y tracking (auto-capturados en el cliente)
  source TEXT NOT NULL CHECK (source IN ('diagnostico', 'partners', 'home', 'sobre', 'otro')),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  user_agent TEXT,

  -- Estado en pipeline (gestionado en CRM interno)
  status TEXT NOT NULL DEFAULT 'nuevo' CHECK (status IN (
    'nuevo',
    'contactado',
    'demo_agendada',
    'demo_completada',
    'convertido',
    'rechazado',
    'nurture'
  )),

  -- Campos adicionales
  notas TEXT,
  assigned_to UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes para queries comunes en CRM
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_email ON leads(email);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy: INSERT anónimo permitido (desde landing pública)
-- La landing usa anon key sin auth, solo puede INSERTAR
CREATE POLICY "Anyone can insert leads"
ON leads FOR INSERT
WITH CHECK (true);

-- Policy: SELECT solo usuarios autenticados (CRM interno)
CREATE POLICY "Authenticated users can read leads"
ON leads FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Policy: UPDATE solo usuarios autenticados
CREATE POLICY "Authenticated users can update leads"
ON leads FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Policy: DELETE solo usuarios autenticados
CREATE POLICY "Authenticated users can delete leads"
ON leads FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Trigger: auto-update updated_at en cambios
CREATE OR REPLACE FUNCTION public.update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_update_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_leads_updated_at();

COMMENT ON TABLE leads IS 'Leads capturados desde enregla-landing, gestionados en CRM interno';
COMMENT ON COLUMN leads.source IS 'Pagina de origen del lead en la landing';
COMMENT ON COLUMN leads.status IS 'Estado en pipeline de conversion';
COMMENT ON COLUMN leads.assigned_to IS 'Usuario interno responsable del seguimiento';
