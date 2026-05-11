-- T3: Extender permit_requirements con issuer, rol requerido, rango de costo, rango de multa y applies_when.
-- Backbone de la matriz Marco Legal y del cálculo de "real factura" del Dashboard.

ALTER TABLE public.permit_requirements
  ADD COLUMN issuer_id        uuid REFERENCES public.permit_issuers(id) ON DELETE SET NULL,
  ADD COLUMN required_role    text NOT NULL DEFAULT 'anyone'
    CHECK (required_role IN ('anyone','representante_legal','contador','tecnico_responsable')),
  ADD COLUMN cost_min         numeric(10,2),
  ADD COLUMN cost_max         numeric(10,2),
  ADD COLUMN cost_currency    text DEFAULT 'USD',
  ADD COLUMN cost_notes       text,
  ADD COLUMN cost_updated_at  date,
  ADD COLUMN fine_min         numeric(10,2),
  ADD COLUMN fine_max         numeric(10,2),
  ADD COLUMN fine_source      text,
  ADD COLUMN applies_when     text;

-- Constraint sanity: si hay cost_min también debe haber cost_max y viceversa
ALTER TABLE public.permit_requirements
  ADD CONSTRAINT cost_range_both_or_neither CHECK (
    (cost_min IS NULL AND cost_max IS NULL) OR
    (cost_min IS NOT NULL AND cost_max IS NOT NULL AND cost_min <= cost_max)
  );

ALTER TABLE public.permit_requirements
  ADD CONSTRAINT fine_range_both_or_neither CHECK (
    (fine_min IS NULL AND fine_max IS NULL) OR
    (fine_min IS NOT NULL AND fine_max IS NOT NULL AND fine_min <= fine_max)
  );

-- Índice para lookup rápido por giro
CREATE INDEX IF NOT EXISTS idx_permit_requirements_business_type
  ON public.permit_requirements (business_type);
