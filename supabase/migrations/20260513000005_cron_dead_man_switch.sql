-- Dead-man switch: el cron send-expiry-alerts-daily cayó 5 días en mayo 2026
-- sin alerta. Solución: heartbeat table + cron que verifica que el primario
-- corrió en las últimas 26h. Si no, inserta fila en cron_heartbeat_alerts.

CREATE TABLE IF NOT EXISTS public.cron_heartbeats (
  job_name text PRIMARY KEY,
  last_run_at timestamptz NOT NULL,
  last_status text NOT NULL CHECK (last_status IN ('success','failed')),
  last_error text,
  run_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cron_heartbeats ENABLE ROW LEVEL SECURITY;

CREATE POLICY cron_heartbeats_select_staff ON public.cron_heartbeats
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_staff = true
    )
  );

CREATE TABLE IF NOT EXISTS public.cron_heartbeat_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  detected_at timestamptz NOT NULL DEFAULT now(),
  severity text NOT NULL CHECK (severity IN ('warning','failed')),
  message text NOT NULL,
  acknowledged_at timestamptz
);

ALTER TABLE public.cron_heartbeat_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY cron_heartbeat_alerts_staff ON public.cron_heartbeat_alerts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_staff = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_staff = true
    )
  );

CREATE OR REPLACE FUNCTION public.record_cron_heartbeat(
  p_job_name text,
  p_status text,
  p_error text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO cron_heartbeats (job_name, last_run_at, last_status, last_error, run_count, updated_at)
  VALUES (p_job_name, now(), p_status, p_error, 1, now())
  ON CONFLICT (job_name) DO UPDATE
  SET last_run_at = EXCLUDED.last_run_at,
      last_status = EXCLUDED.last_status,
      last_error = EXCLUDED.last_error,
      run_count = cron_heartbeats.run_count + 1,
      updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.record_cron_heartbeat(text, text, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_cron_heartbeat(text, text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.check_cron_heartbeats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  threshold interval := interval '26 hours';
BEGIN
  FOR r IN
    SELECT job_name, last_run_at, last_status
    FROM cron_heartbeats
    WHERE last_run_at < now() - threshold
       OR last_status = 'failed'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM cron_heartbeat_alerts
      WHERE job_name = r.job_name
        AND acknowledged_at IS NULL
        AND detected_at > now() - interval '24 hours'
    ) THEN
      INSERT INTO cron_heartbeat_alerts (job_name, severity, message)
      VALUES (
        r.job_name,
        CASE WHEN r.last_status = 'failed' THEN 'failed' ELSE 'warning' END,
        format('Job %s último status: %s · última corrida: %s',
               r.job_name, r.last_status, to_char(r.last_run_at, 'YYYY-MM-DD HH24:MI'))
      );
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.check_cron_heartbeats() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_cron_heartbeats() TO service_role;

SELECT cron.schedule(
  'cron-heartbeat-monitor',
  '0 */2 * * *',
  $$ SELECT public.check_cron_heartbeats(); $$
);
