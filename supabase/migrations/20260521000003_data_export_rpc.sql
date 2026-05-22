-- export_company_data: dump completo de datos de la empresa para LOPDP Art. 9 (portabilidad).
-- Solo admin/owner. Demo company bloqueada.
-- Devuelve jsonb con: company, profiles, locations, permits, documents, audit_logs (últimos 1000).

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
    RAISE EXCEPTION 'Only admin/owner can export company data';
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
       WHERE d.company_id = p_company_id
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

GRANT EXECUTE ON FUNCTION public.export_company_data(uuid) TO authenticated;

COMMENT ON FUNCTION public.export_company_data(uuid) IS
  'LOPDP Art. 9 portabilidad: devuelve dump JSON completo de datos de la empresa. Solo admin/owner.';
