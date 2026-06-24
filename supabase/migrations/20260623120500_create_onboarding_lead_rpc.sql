-- RPC SECURITY DEFINER para capturar leads "lo sacamos por ti" desde el onboarding.
-- Motivo: la policy de INSERT en leads esta restringida a service_role
-- (leads_insert_service_only). El cliente autenticado del onboarding no puede
-- insertar directo, asi que pasamos por una funcion definer — mismo patron que
-- create_company_for_user. Exige auth.uid() para evitar abuso anonimo.
CREATE OR REPLACE FUNCTION public.create_onboarding_lead(
  p_nombre TEXT,
  p_negocio TEXT,
  p_email TEXT,
  p_telefono TEXT,
  p_ciudad TEXT,
  p_permit_type TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Solo usuarios autenticados pueden solicitar este servicio';
  END IF;

  INSERT INTO leads (nombre, negocio, email, telefono, ciudad, source, status, notas)
  VALUES (
    p_nombre,
    p_negocio,
    p_email,
    NULLIF(btrim(p_telefono), ''),
    NULLIF(btrim(p_ciudad), ''),
    'onboarding',
    'nuevo',
    'Solicitud "lo sacamos por ti" desde onboarding — permiso: ' || coalesce(p_permit_type, 'n/d')
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_onboarding_lead(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_onboarding_lead(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
