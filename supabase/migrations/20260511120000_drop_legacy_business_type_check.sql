-- FIX URGENTE: había dos CHECK constraints sobre companies.business_type:
--   - companies_business_type_check  (actualizada a 12 giros en T2) ✓
--   - companies_business_type_valid   (legacy, solo 4 giros) ← bloqueaba el onboarding
-- Síntoma: "Siguiente" en /setup paso 2 "Empresa" se quedaba colgado spinning.
-- La migración T2 solo dropeaba companies_business_type_check; la legacy
-- quedó silente hasta que alguien insertó un giro nuevo (gimnasio, cafeteria, etc).

ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_business_type_valid;

DO $$
DECLARE
  n int;
BEGIN
  SELECT count(*) INTO n
  FROM pg_constraint
  WHERE conrelid = 'public.companies'::regclass
    AND conname LIKE '%business_type%';
  IF n <> 1 THEN
    RAISE EXCEPTION 'Se esperaba 1 constraint sobre business_type, hay %', n;
  END IF;
END $$;
