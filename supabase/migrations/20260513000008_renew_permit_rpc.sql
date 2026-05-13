-- RPC atómica para renovar un permit. Reemplaza las 3 operaciones secuenciales
-- del cliente (insert new, update old, upload doc) que podían dejar inconsistencia.
-- El upload del documento sigue siendo post-hoc (cliente contra Storage),
-- pero ambas filas (viejo archivado, nuevo creado) se mueven en una transacción.

CREATE OR REPLACE FUNCTION public.renew_permit(
  p_old_permit_id uuid,
  p_permit_number text,
  p_issue_date date,
  p_expiry_date date,
  p_issuer text DEFAULT NULL,
  p_issuer_id uuid DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_permit permits%ROWTYPE;
  new_permit_id uuid;
BEGIN
  SELECT * INTO old_permit FROM permits WHERE id = p_old_permit_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'permit_not_found';
  END IF;
  IF NOT old_permit.is_active THEN
    RAISE EXCEPTION 'permit_already_archived';
  END IF;

  IF user_company_id() IS DISTINCT FROM old_permit.company_id
     AND old_permit.company_id IS DISTINCT FROM '50707999-f033-41c4-91c9-989966311972'::uuid
  THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  INSERT INTO permits (
    company_id, location_id, type, status,
    permit_number, issue_date, expiry_date,
    issuer, issuer_id, notes,
    is_active, version, superseded_by, archived_at,
    assigned_to_profile_id
  ) VALUES (
    old_permit.company_id, old_permit.location_id, old_permit.type, 'vigente',
    p_permit_number, p_issue_date, p_expiry_date,
    COALESCE(p_issuer, old_permit.issuer), COALESCE(p_issuer_id, old_permit.issuer_id), p_notes,
    true, COALESCE(old_permit.version, 1) + 1, NULL, NULL,
    old_permit.assigned_to_profile_id
  )
  RETURNING id INTO new_permit_id;

  UPDATE permits
  SET is_active = false,
      superseded_by = new_permit_id,
      archived_at = NOW(),
      updated_at = NOW()
  WHERE id = p_old_permit_id;

  INSERT INTO permit_events (permit_id, actor_id, event_type, from_value, to_value, metadata)
  VALUES (
    new_permit_id,
    auth.uid(),
    'renewed',
    p_old_permit_id::text,
    new_permit_id::text,
    jsonb_build_object(
      'old_version', old_permit.version,
      'new_version', COALESCE(old_permit.version, 1) + 1,
      'new_expiry_date', p_expiry_date
    )
  );

  RETURN new_permit_id;
END;
$$;

REVOKE ALL ON FUNCTION public.renew_permit(uuid, text, date, date, text, uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.renew_permit(uuid, text, date, date, text, uuid, text) TO authenticated, service_role;
