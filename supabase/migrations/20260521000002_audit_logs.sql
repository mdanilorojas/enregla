-- audit_logs: trail completo de cambios sobre tablas críticas.
-- Crítico para SaaS de compliance.
-- RLS: cada empresa solo ve sus logs. Solo admin/owner pueden leer.

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id    uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  action        text        NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  resource_type text        NOT NULL,
  resource_id   uuid,
  old_value     jsonb,
  new_value     jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_company_created
  ON public.audit_logs (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource
  ON public.audit_logs (resource_type, resource_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_select_admin"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT p.company_id FROM public.profiles p
     WHERE p.id = (SELECT auth.uid())
       AND p.role IN ('admin','owner')
  )
);

-- INSERT solo vía SECURITY DEFINER trigger; no se permite client INSERT.
-- No policy de INSERT/UPDATE/DELETE → todo bloqueado salvo el trigger.

-- Función genérica de auditoría
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id uuid;
  v_old jsonb;
  v_new jsonb;
  v_resource_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    v_new := NULL;
    v_resource_id := (OLD).id;
    v_company_id := COALESCE(
      (to_jsonb(OLD)->>'company_id')::uuid,
      v_company_id
    );
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_resource_id := (NEW).id;
    v_company_id := COALESCE(
      (to_jsonb(NEW)->>'company_id')::uuid,
      (to_jsonb(OLD)->>'company_id')::uuid
    );
  ELSE -- INSERT
    v_old := NULL;
    v_new := to_jsonb(NEW);
    v_resource_id := (NEW).id;
    v_company_id := (to_jsonb(NEW)->>'company_id')::uuid;
  END IF;

  INSERT INTO public.audit_logs (
    user_id, company_id, action, resource_type, resource_id, old_value, new_value
  ) VALUES (
    v_user_id, v_company_id, TG_OP, TG_TABLE_NAME, v_resource_id, v_old, v_new
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Triggers
DROP TRIGGER IF EXISTS audit_locations ON public.locations;
CREATE TRIGGER audit_locations
  AFTER INSERT OR UPDATE OR DELETE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_permits ON public.permits;
CREATE TRIGGER audit_permits
  AFTER INSERT OR UPDATE OR DELETE ON public.permits
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_documents ON public.documents;
CREATE TRIGGER audit_documents
  AFTER INSERT OR UPDATE OR DELETE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- companies: solo UPDATE (la creación pasa por RPC y la borrada va con el user)
DROP TRIGGER IF EXISTS audit_companies ON public.companies;
CREATE TRIGGER audit_companies
  AFTER UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

COMMENT ON TABLE public.audit_logs IS
  'Trail inmutable de cambios sobre datos críticos (locations, permits, documents, companies). '
  'Inserts solo vía trigger SECURITY DEFINER. Lectura limitada a admin/owner de la empresa.';
