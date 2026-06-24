-- Extiende leads.source para atribuir solicitudes "lo sacamos por ti" del onboarding.
-- RLS sin cambios: la policy de INSERT ya es WITH CHECK (true) para autenticados/anon.
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check;
ALTER TABLE leads ADD CONSTRAINT leads_source_check
  CHECK (source IN ('diagnostico', 'partners', 'home', 'sobre', 'otro', 'onboarding'));

COMMENT ON COLUMN leads.source IS 'Pagina/flujo de origen del lead (landing o onboarding)';
