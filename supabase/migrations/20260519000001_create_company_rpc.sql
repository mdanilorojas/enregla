-- RPC para crear company en onboarding sin pasar por PostgREST RETURNING.
-- INSERT directo + .select() falla con 42501 porque el SELECT policy de
-- companies se evalúa sobre la fila recién insertada antes que el trigger
-- AFTER INSERT actualice profile.company_id, y user_company_id() retorna
-- NULL en ese punto. SECURITY DEFINER bypassa RLS para esta operación
-- específica del onboarding.

CREATE OR REPLACE FUNCTION public.create_company_for_user(
  p_name text,
  p_ruc text,
  p_city text,
  p_business_type text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_company_id uuid;
  v_existing_company uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No authenticated user' USING ERRCODE = '42501';
  END IF;

  SELECT company_id INTO v_existing_company
  FROM public.profiles
  WHERE id = v_uid;

  IF v_existing_company IS NOT NULL THEN
    RAISE EXCEPTION 'User already has a company' USING ERRCODE = '23505';
  END IF;

  IF p_business_type NOT IN (
    'restaurante','retail','food_truck','consultorio','cafeteria',
    'panaderia','bar','farmacia','gimnasio','salon_belleza','oficina','otro'
  ) THEN
    RAISE EXCEPTION 'Invalid business_type: %', p_business_type USING ERRCODE = '23514';
  END IF;

  IF p_ruc !~ '^\d{13}$' THEN
    RAISE EXCEPTION 'RUC must be 13 digits' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.companies (name, ruc, city, business_type, location_count)
  VALUES (p_name, p_ruc, p_city, p_business_type, 0)
  RETURNING id INTO v_company_id;

  RETURN v_company_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_company_for_user(text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_company_for_user(text,text,text,text) TO authenticated;
