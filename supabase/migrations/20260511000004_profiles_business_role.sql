-- Task 5: profiles.business_role + extend auto_assign_company_to_profile trigger
-- Adds business_role column to profiles and makes the user who creates
-- a company during onboarding automatically become representante_legal.

ALTER TABLE public.profiles
  ADD COLUMN business_role text NOT NULL DEFAULT 'empleado'
    CHECK (business_role IN ('empleado','representante_legal','contador','tecnico_responsable'));

COMMENT ON COLUMN public.profiles.business_role IS
  'Rol de negocio del miembro del equipo. Usado para matching con permit_requirements.required_role.';

-- Extender el trigger auto_assign_company_to_profile para setear
-- business_role = 'representante_legal' al primer usuario que crea la company
CREATE OR REPLACE FUNCTION public.auto_assign_company_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    UPDATE profiles
    SET company_id = NEW.id,
        role = 'admin',
        business_role = 'representante_legal',
        updated_at = NOW()
    WHERE id = auth.uid()
      AND company_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;
