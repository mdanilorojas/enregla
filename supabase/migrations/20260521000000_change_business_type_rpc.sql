-- RPC para cambiar el business_type de una empresa de forma destructiva.
-- Borra todos los permits actuales de la empresa y regenera permits default
-- (basados en permit_requirements) para todas las sedes existentes.
--
-- Confirmación tipo "type-to-delete": el caller debe enviar p_confirmation_name
-- igual al name actual de la empresa (case-sensitive, exact match). Si no
-- coincide, lanza error y no hace cambios.
--
-- Solo el admin/owner de la empresa puede ejecutarlo. Demo company excluida.

CREATE OR REPLACE FUNCTION public.change_company_business_type(
  p_company_id uuid,
  p_new_business_type text,
  p_confirmation_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_caller_role text;
  v_caller_company uuid;
  v_company_name text;
  v_old_business_type text;
  v_deleted_count int := 0;
  v_created_count int := 0;
  v_demo_company uuid := '50707999-f033-41c4-91c9-989966311972'::uuid;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado' USING ERRCODE = '42501';
  END IF;

  IF p_company_id = v_demo_company THEN
    RAISE EXCEPTION 'No se permite cambiar el tipo de negocio de la empresa demo'
      USING ERRCODE = '42501';
  END IF;

  -- Validar rol del caller en la empresa
  SELECT role, company_id
    INTO v_caller_role, v_caller_company
    FROM public.profiles
   WHERE id = v_caller_id;

  IF v_caller_company IS NULL OR v_caller_company <> p_company_id THEN
    RAISE EXCEPTION 'No perteneces a esta empresa' USING ERRCODE = '42501';
  END IF;

  IF v_caller_role NOT IN ('admin', 'owner') THEN
    RAISE EXCEPTION 'Solo administradores pueden cambiar el tipo de negocio'
      USING ERRCODE = '42501';
  END IF;

  -- Obtener empresa actual
  SELECT name, business_type
    INTO v_company_name, v_old_business_type
    FROM public.companies
   WHERE id = p_company_id
   FOR UPDATE;

  IF v_company_name IS NULL THEN
    RAISE EXCEPTION 'Empresa no encontrada' USING ERRCODE = 'P0002';
  END IF;

  -- Validar confirmación: nombre exacto
  IF p_confirmation_name IS DISTINCT FROM v_company_name THEN
    RAISE EXCEPTION 'El nombre de confirmación no coincide con el de la empresa'
      USING ERRCODE = '22023';
  END IF;

  -- Validar nuevo business_type
  IF p_new_business_type IS NULL OR length(trim(p_new_business_type)) = 0 THEN
    RAISE EXCEPTION 'business_type inválido' USING ERRCODE = '22023';
  END IF;

  IF p_new_business_type = v_old_business_type THEN
    RAISE EXCEPTION 'El nuevo tipo de negocio es igual al actual'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.permit_requirements WHERE business_type = p_new_business_type
  ) THEN
    RAISE EXCEPTION 'Tipo de negocio sin requisitos configurados: %', p_new_business_type
      USING ERRCODE = '22023';
  END IF;

  -- 1) Borrar todos los permits de la empresa (cascade -> documents, permit_events, notification_logs)
  WITH del AS (
    DELETE FROM public.permits
     WHERE company_id = p_company_id
     RETURNING 1
  )
  SELECT count(*) INTO v_deleted_count FROM del;

  -- 2) Actualizar business_type en companies
  UPDATE public.companies
     SET business_type = p_new_business_type,
         updated_at = NOW()
   WHERE id = p_company_id;

  -- 3) Regenerar permits default para cada sede existente, basado en permit_requirements
  WITH ins AS (
    INSERT INTO public.permits (company_id, location_id, type, status, is_active)
    SELECT l.company_id, l.id, pr.permit_type, 'no_registrado', true
      FROM public.locations l
      JOIN public.permit_requirements pr
        ON pr.business_type = p_new_business_type
       AND pr.is_mandatory = true
     WHERE l.company_id = p_company_id
    RETURNING 1
  )
  SELECT count(*) INTO v_created_count FROM ins;

  RETURN jsonb_build_object(
    'company_id', p_company_id,
    'old_business_type', v_old_business_type,
    'new_business_type', p_new_business_type,
    'permits_deleted', v_deleted_count,
    'permits_created', v_created_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.change_company_business_type(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.change_company_business_type(uuid, text, text) TO authenticated;

COMMENT ON FUNCTION public.change_company_business_type(uuid, text, text) IS
  'Cambio destructivo de business_type. Borra todos los permits de la empresa y regenera defaults '
  'basados en permit_requirements para cada sede. Requiere confirmación con nombre exacto. '
  'Solo admin/owner. Demo company excluida.';
