-- Antes: policy "Anyone can insert leads" FOR INSERT TO public WITH CHECK (true).
-- Sin captcha ni rate-limit, spam abierto.
-- Ahora: solo service_role (via edge function submit-lead) puede insertar,
-- con rate-limit por IP hasheada.

DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;

CREATE POLICY leads_insert_service_only ON public.leads
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.lead_rate_limit (
  ip_hash text PRIMARY KEY,
  last_attempt_at timestamptz NOT NULL DEFAULT now(),
  attempt_count_hour integer NOT NULL DEFAULT 1,
  hour_window_start timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_rate_limit ENABLE ROW LEVEL SECURITY;

CREATE POLICY lead_rate_limit_service_only ON public.lead_rate_limit
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.check_lead_rate_limit(p_ip_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r lead_rate_limit%ROWTYPE;
BEGIN
  SELECT * INTO r FROM lead_rate_limit WHERE ip_hash = p_ip_hash FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO lead_rate_limit (ip_hash) VALUES (p_ip_hash);
    RETURN true;
  END IF;

  IF now() - r.last_attempt_at < interval '1 minute' THEN
    RETURN false;
  END IF;

  IF now() - r.hour_window_start < interval '1 hour' THEN
    IF r.attempt_count_hour >= 5 THEN
      RETURN false;
    END IF;
    UPDATE lead_rate_limit
    SET last_attempt_at = now(),
        attempt_count_hour = r.attempt_count_hour + 1
    WHERE ip_hash = p_ip_hash;
  ELSE
    UPDATE lead_rate_limit
    SET last_attempt_at = now(),
        attempt_count_hour = 1,
        hour_window_start = now()
    WHERE ip_hash = p_ip_hash;
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.check_lead_rate_limit(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_lead_rate_limit(text) TO service_role;
