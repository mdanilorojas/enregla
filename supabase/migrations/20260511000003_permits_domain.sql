-- T4: Add issuer_id + assigned_to_profile_id to permits, migrate legacy issuer text
-- Keeps permits.issuer alive for one release as a safety net.

ALTER TABLE public.permits
  ADD COLUMN issuer_id              uuid REFERENCES public.permit_issuers(id) ON DELETE SET NULL,
  ADD COLUMN assigned_to_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.permits.issuer IS
  'DEPRECATED: reemplazado por issuer_id. Drop en release posterior.';

COMMENT ON COLUMN public.permits.assigned_to_profile_id IS
  'Persona del equipo asignada a ejecutar el trámite. NULL = sin asignar.';

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_permits_assigned_to
  ON public.permits (assigned_to_profile_id)
  WHERE assigned_to_profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_permits_issuer
  ON public.permits (issuer_id);

-- Data migration: mapear issuer string → issuer_id donde se pueda
UPDATE public.permits p
SET issuer_id = pi.id
FROM public.permit_issuers pi
WHERE p.issuer IS NOT NULL
  AND p.issuer_id IS NULL
  AND (
    lower(p.issuer) IN (lower(pi.slug), lower(pi.short_name), lower(pi.name))
    OR (p.issuer = 'Municipio' AND pi.slug = 'gad_quito')
    OR (p.issuer = 'CBomberos' AND pi.slug = 'bomberos_quito')
    OR (p.issuer ILIKE 'Bomberos%' AND pi.slug = 'bomberos_quito')
  );

-- Data cleanup: registros con issuer obsoleto/no aplicable quedan issuer_id = NULL
-- SCPM y CONSEP no son emisores del MVP; se mantiene permits.issuer como string histórico.
