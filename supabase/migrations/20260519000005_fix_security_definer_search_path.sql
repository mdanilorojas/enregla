-- BLOCKER fix: agregar SET search_path en SECURITY DEFINER funcs.
-- Sin search_path pinneado, atacante con permisos para crear schema en
-- search_path puede shadowear tabla y secuestrar la funcion.

CREATE OR REPLACE FUNCTION public.set_trial_ends_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NEW.trial_ends_at IS NULL AND NEW.subscription_status = 'trial' THEN
    NEW.trial_ends_at := NOW() + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.get_public_permits(text) SET search_path = public, pg_catalog;
