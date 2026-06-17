-- Bug: borrar una sede (o permiso) con documentos fallaba con FK violation.
-- Al cascadear, el permit se elimina antes que sus documents; el trigger
-- AFTER DELETE de documents (log_document_event) insertaba un permit_events
-- referenciando el permit ya borrado → 23503 que abortaba todo el borrado.
-- Fix: en DELETE, solo loguear si el permit todavía existe (borrado directo del
-- documento); durante el cascade se omite el log.
CREATE OR REPLACE FUNCTION public.log_document_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  actor uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO permit_events (permit_id, actor_id, event_type, to_value, metadata)
    VALUES (NEW.permit_id, actor, 'document_uploaded', NEW.file_name,
            jsonb_build_object('document_id', NEW.id, 'file_size', NEW.file_size));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF EXISTS (SELECT 1 FROM permits WHERE id = OLD.permit_id) THEN
      INSERT INTO permit_events (permit_id, actor_id, event_type, from_value, metadata)
      VALUES (OLD.permit_id, actor, 'document_deleted', OLD.file_name,
              jsonb_build_object('document_id', OLD.id));
    END IF;
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;