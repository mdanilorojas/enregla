-- 4 permits con status='vigente' pero expiry_date IS NULL.
-- Sin fecha no se puede afirmar vigencia → status correcto es no_registrado.
-- Evita que cuenten como cumplidos en rollup del dashboard.

UPDATE permits
SET status = 'no_registrado',
    updated_at = NOW()
WHERE is_active = true
  AND status = 'vigente'
  AND expiry_date IS NULL;
