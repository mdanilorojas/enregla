-- EnRegla pasa a tier gratuito: las empresas nuevas se crean 'active' sin
-- reloj de trial, y se desbloquean las empresas existentes que el paywall
-- de 30 dias dejo en trial/expired. La infraestructura de paywall (ruta /pago,
-- PaywallView, columnas subscription_status/trial_ends_at) se conserva intacta
-- para reactivar un tier pago en el futuro: solo cambia el default a gratis.

-- 1) create_company_for_user: crear empresas 'active' (gratis, sin expiracion)
CREATE OR REPLACE FUNCTION public.create_company_for_user(
  p_name text, p_ruc text, p_city text, p_business_type text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  FROM public.profiles WHERE id = v_uid;

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

  -- Tier gratuito: 'active' sin trial_ends_at => getEffectiveStatus nunca
  -- devuelve 'expired' => nunca redirige a /pago.
  INSERT INTO public.companies (
    name, ruc, city, business_type, location_count,
    subscription_status, trial_ends_at
  )
  VALUES (
    p_name, p_ruc, p_city, p_business_type, 0,
    'active', NULL
  )
  RETURNING id INTO v_company_id;

  RETURN v_company_id;
END;
$function$;

-- 2) Desbloquear empresas existentes atrapadas por el paywall de trial.
--    Solo trial/expired -> active. 'suspended' se respeta (puede ser baneo manual).
UPDATE public.companies
SET subscription_status = 'active', trial_ends_at = NULL
WHERE subscription_status IN ('trial', 'expired');
