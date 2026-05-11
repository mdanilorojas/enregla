-- Hardening post-v2: cerrar WARNs reales detectados por advisors tras el sprint dominio-v2.

-- 1. set_updated_at() sin search_path pinneado (creado en T1)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. log_permit_event y log_document_event son funciones-trigger.
-- Jamás deben ser callables via REST /rest/v1/rpc/. Revoke explícito.
REVOKE EXECUTE ON FUNCTION public.log_permit_event() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_document_event() FROM PUBLIC, anon, authenticated;

-- 3. Índices de FKs faltantes (advisors INFO, pero baratos de agregar)
CREATE INDEX IF NOT EXISTS idx_permit_events_actor_id
  ON public.permit_events (actor_id)
  WHERE actor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_permit_requirements_issuer_id
  ON public.permit_requirements (issuer_id)
  WHERE issuer_id IS NOT NULL;
