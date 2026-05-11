CREATE TABLE public.permit_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id   uuid NOT NULL REFERENCES public.permits(id) ON DELETE CASCADE,
  actor_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type  text NOT NULL CHECK (event_type IN (
    'created',
    'status_changed',
    'document_uploaded',
    'document_deleted',
    'assigned',
    'unassigned',
    'renewed',
    'dates_updated'
  )),
  from_value  text,
  to_value    text,
  metadata    jsonb,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_permit_events_permit_created
  ON public.permit_events (permit_id, created_at DESC);

-- RLS: mismo company scoping que permits
ALTER TABLE public.permit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY permit_events_select ON public.permit_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.permits p
    WHERE p.id = permit_events.permit_id
      AND (
        p.company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
        OR p.company_id IN (SELECT company_id FROM public.profiles WHERE id = (SELECT auth.uid()))
      )
  ));

CREATE POLICY permit_events_select_anon_demo ON public.permit_events
  FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.permits p
    WHERE p.id = permit_events.permit_id
      AND p.company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
  ));

-- Writes: solo via triggers (SECURITY DEFINER). Nadie puede escribir directo.
REVOKE INSERT, UPDATE, DELETE ON public.permit_events FROM anon, authenticated;

-- Trigger de permits: dispara status_changed, assigned, unassigned, dates_updated
CREATE OR REPLACE FUNCTION public.log_permit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  actor uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO permit_events (permit_id, actor_id, event_type, to_value)
    VALUES (NEW.id, actor, 'created', NEW.status);
    RETURN NEW;
  END IF;

  -- UPDATE: detectar cambios relevantes
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO permit_events (permit_id, actor_id, event_type, from_value, to_value)
    VALUES (NEW.id, actor, 'status_changed', OLD.status, NEW.status);
  END IF;

  IF NEW.assigned_to_profile_id IS DISTINCT FROM OLD.assigned_to_profile_id THEN
    IF NEW.assigned_to_profile_id IS NULL THEN
      INSERT INTO permit_events (permit_id, actor_id, event_type, from_value)
      VALUES (NEW.id, actor, 'unassigned', OLD.assigned_to_profile_id::text);
    ELSE
      INSERT INTO permit_events (permit_id, actor_id, event_type, from_value, to_value)
      VALUES (NEW.id, actor, 'assigned',
              OLD.assigned_to_profile_id::text,
              NEW.assigned_to_profile_id::text);
    END IF;
  END IF;

  IF NEW.expiry_date IS DISTINCT FROM OLD.expiry_date
     OR NEW.issue_date IS DISTINCT FROM OLD.issue_date THEN
    INSERT INTO permit_events (permit_id, actor_id, event_type, metadata)
    VALUES (NEW.id, actor, 'dates_updated',
            jsonb_build_object(
              'issue_date_from', OLD.issue_date,
              'issue_date_to',   NEW.issue_date,
              'expiry_date_from', OLD.expiry_date,
              'expiry_date_to',   NEW.expiry_date
            ));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS permits_log_event ON public.permits;
CREATE TRIGGER permits_log_event
  AFTER INSERT OR UPDATE ON public.permits
  FOR EACH ROW EXECUTE FUNCTION public.log_permit_event();

-- Trigger de documents: dispara document_uploaded, document_deleted
CREATE OR REPLACE FUNCTION public.log_document_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  actor uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO permit_events (permit_id, actor_id, event_type, to_value, metadata)
    VALUES (NEW.permit_id, actor, 'document_uploaded', NEW.file_name,
            jsonb_build_object('document_id', NEW.id, 'file_size', NEW.file_size));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO permit_events (permit_id, actor_id, event_type, from_value, metadata)
    VALUES (OLD.permit_id, actor, 'document_deleted', OLD.file_name,
            jsonb_build_object('document_id', OLD.id));
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS documents_log_event ON public.documents;
CREATE TRIGGER documents_log_event
  AFTER INSERT OR DELETE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.log_document_event();
