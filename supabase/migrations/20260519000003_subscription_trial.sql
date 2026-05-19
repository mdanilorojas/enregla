-- Trial period 30 dias para nuevas companies. Admin activa manual al recibir pago.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'expired', 'suspended')),
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

UPDATE public.companies
SET trial_ends_at = (created_at + INTERVAL '30 days') AT TIME ZONE 'UTC'
WHERE trial_ends_at IS NULL AND subscription_status = 'trial';

UPDATE public.companies
SET subscription_status = 'active', trial_ends_at = NULL
WHERE id = '50707999-f033-41c4-91c9-989966311972';

CREATE OR REPLACE FUNCTION public.set_trial_ends_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.trial_ends_at IS NULL AND NEW.subscription_status = 'trial' THEN
    NEW.trial_ends_at := NOW() + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS companies_set_trial_ends_at ON public.companies;
CREATE TRIGGER companies_set_trial_ends_at
  BEFORE INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_trial_ends_at();

CREATE OR REPLACE FUNCTION public.company_effective_status(p_company_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    CASE
      WHEN subscription_status = 'active' THEN 'active'
      WHEN subscription_status = 'suspended' THEN 'suspended'
      WHEN subscription_status = 'expired' THEN 'expired'
      WHEN subscription_status = 'trial' AND trial_ends_at > NOW() THEN 'trial'
      WHEN subscription_status = 'trial' AND trial_ends_at <= NOW() THEN 'expired'
      ELSE 'expired'
    END
  FROM public.companies
  WHERE id = p_company_id;
$$;

GRANT EXECUTE ON FUNCTION public.company_effective_status(uuid) TO authenticated, anon;

-- Re-create create_company_for_user con explicit trial_ends_at
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

  INSERT INTO public.companies (
    name, ruc, city, business_type, location_count,
    subscription_status, trial_ends_at
  )
  VALUES (
    p_name, p_ruc, p_city, p_business_type, 0,
    'trial', NOW() + INTERVAL '30 days'
  )
  RETURNING id INTO v_company_id;

  RETURN v_company_id;
END;
$$;
