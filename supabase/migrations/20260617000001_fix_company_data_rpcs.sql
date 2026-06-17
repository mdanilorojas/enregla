-- Fix P0.2 + P0.3 (auditoría pre-product-grade):
-- (1) documents no tiene company_id (es permit_id) -> llegar a empresa vía permits.
-- (2) Modelo de roles no tiene 'owner' (CHECK admin/operator/viewer).
--     export/delete deben aceptar 'admin'; delete no debe setear role='owner' (viola CHECK).

CREATE OR REPLACE FUNCTION public.export_company_data(p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_role text;
  v_result jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Auth required';
  END IF;

  IF public.is_demo_company(p_company_id) THEN
    RAISE EXCEPTION 'Demo company export blocked';
  END IF;

  SELECT p.role INTO v_role
    FROM public.profiles p
   WHERE p.id = v_user_id AND p.company_id = p_company_id;

  IF v_role IS NULL OR v_role NOT IN ('admin','owner') THEN
    RAISE EXCEPTION 'Only admin can export company data';
  END IF;

  SELECT jsonb_build_object(
    'exported_at', now(),
    'exported_by', v_user_id,
    'company_id', p_company_id,
    'company', (
      SELECT to_jsonb(c) FROM public.companies c WHERE c.id = p_company_id
    ),
    'profiles', COALESCE((
      SELECT jsonb_agg(to_jsonb(p)) FROM public.profiles p
       WHERE p.company_id = p_company_id
    ), '[]'::jsonb),
    'locations', COALESCE((
      SELECT jsonb_agg(to_jsonb(l)) FROM public.locations l
       WHERE l.company_id = p_company_id
    ), '[]'::jsonb),
    'permits', COALESCE((
      SELECT jsonb_agg(to_jsonb(pr)) FROM public.permits pr
       WHERE pr.company_id = p_company_id
    ), '[]'::jsonb),
    'documents', COALESCE((
      SELECT jsonb_agg(to_jsonb(d)) FROM public.documents d
       JOIN public.permits pr ON pr.id = d.permit_id
       WHERE pr.company_id = p_company_id
    ), '[]'::jsonb),
    'audit_logs', COALESCE((
      SELECT jsonb_agg(to_jsonb(a)) FROM (
        SELECT * FROM public.audit_logs
         WHERE company_id = p_company_id
         ORDER BY created_at DESC
         LIMIT 1000
      ) a
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

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

  IF v_role IS NULL OR v_role NOT IN ('admin','owner') THEN
    RAISE EXCEPTION 'Only an admin can delete the company';
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

  -- documents llega a empresa vía permits (no tiene company_id).
  WITH d AS (
    DELETE FROM public.documents
     WHERE permit_id IN (SELECT id FROM public.permits WHERE company_id = p_company_id)
     RETURNING 1
  )
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

  -- No setear role='owner' (no existe en el CHECK). Solo desvincular la empresa.
  UPDATE public.profiles
     SET company_id = NULL
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