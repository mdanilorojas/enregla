-- delete_company: borra TODA la data de la empresa (LOPDP Right to Erasure).
-- Type-to-confirm con nombre exacto. Solo owner.
-- Demo company bloqueada.
--
-- Cascade order (manual aunque haya FK ON DELETE CASCADE para borrar storage también):
--   1. Validar permisos.
--   2. Borrar documents (rows). Storage objects se limpian con tarea cron aparte (dev tag).
--   3. Borrar permits, locations, invitations, audit_logs.
--   4. Borrar profiles de la company (excepto el owner que ejecuta — para que pueda recibir confirmación).
--   5. Borrar company.
--   6. Owner queda sin company_id → al recargar irá al onboarding.

CREATE OR REPLACE FUNCTION public.delete_company(
  p_company_id uuid,
  p_confirmation_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_role text;
  v_company_name text;
  v_deleted jsonb;
  v_count_perms int := 0;
  v_count_locs int := 0;
  v_count_docs int := 0;
  v_count_profiles int := 0;
  v_count_invites int := 0;
  v_count_audits int := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Auth required';
  END IF;

  IF public.is_demo_company(p_company_id) THEN
    RAISE EXCEPTION 'Cannot delete demo company';
  END IF;

  SELECT p.role INTO v_role
    FROM public.profiles p
   WHERE p.id = v_user_id AND p.company_id = p_company_id;

  IF v_role IS NULL OR v_role <> 'owner' THEN
    RAISE EXCEPTION 'Only the owner can delete the company';
  END IF;

  SELECT c.name INTO v_company_name
    FROM public.companies c
   WHERE c.id = p_company_id
   FOR UPDATE;

  IF v_company_name IS NULL THEN
    RAISE EXCEPTION 'Company not found';
  END IF;

  IF lower(trim(p_confirmation_name)) <> lower(trim(v_company_name)) THEN
    RAISE EXCEPTION 'Confirmation name does not match';
  END IF;

  WITH d AS (DELETE FROM public.documents WHERE company_id = p_company_id RETURNING 1)
  SELECT count(*) INTO v_count_docs FROM d;

  WITH d AS (DELETE FROM public.permits WHERE company_id = p_company_id RETURNING 1)
  SELECT count(*) INTO v_count_perms FROM d;

  WITH d AS (DELETE FROM public.locations WHERE company_id = p_company_id RETURNING 1)
  SELECT count(*) INTO v_count_locs FROM d;

  IF to_regclass('public.company_invitations') IS NOT NULL THEN
    EXECUTE 'WITH d AS (DELETE FROM public.company_invitations WHERE company_id = $1 RETURNING 1) SELECT count(*) FROM d'
      USING p_company_id INTO v_count_invites;
  END IF;

  WITH d AS (DELETE FROM public.audit_logs WHERE company_id = p_company_id RETURNING 1)
  SELECT count(*) INTO v_count_audits FROM d;

  WITH d AS (
    DELETE FROM public.profiles
     WHERE company_id = p_company_id AND id <> v_user_id
     RETURNING 1
  )
  SELECT count(*) INTO v_count_profiles FROM d;

  UPDATE public.profiles
     SET company_id = NULL, role = 'owner'
   WHERE id = v_user_id;

  DELETE FROM public.companies WHERE id = p_company_id;

  v_deleted := jsonb_build_object(
    'company_id', p_company_id,
    'company_name', v_company_name,
    'deleted_at', now(),
    'deleted_by', v_user_id,
    'counts', jsonb_build_object(
      'documents', v_count_docs,
      'permits', v_count_perms,
      'locations', v_count_locs,
      'invitations', v_count_invites,
      'audit_logs', v_count_audits,
      'profiles_other', v_count_profiles
    )
  );

  RETURN v_deleted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_company(uuid, text) TO authenticated;

COMMENT ON FUNCTION public.delete_company(uuid, text) IS
  'LOPDP Right to Erasure: borra company + locations + permits + documents + audit_logs + invitations. '
  'Type-to-confirm con nombre. Solo owner. Demo company bloqueada.';
