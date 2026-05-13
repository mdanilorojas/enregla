-- MVP: invitar miembros a la misma empresa via token + email.
-- No migra las RLS existentes (siguen usando profiles.company_id 1:1).
-- Desbloquea el caso "gerente invita colaborador a SU empresa" sin riesgo
-- de romper las policies existentes. Multi-empresa real queda follow-up.

CREATE TABLE IF NOT EXISTS public.company_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email text NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  role text NOT NULL DEFAULT 'operator' CHECK (role IN ('admin','operator','viewer')),
  token text NOT NULL UNIQUE,
  invited_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid REFERENCES profiles(id),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_invitations_token ON public.company_invitations(token);
CREATE INDEX IF NOT EXISTS idx_company_invitations_company ON public.company_invitations(company_id) WHERE accepted_at IS NULL AND revoked_at IS NULL;

ALTER TABLE public.company_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY invitations_select_own_company ON public.company_invitations
  FOR SELECT
  USING (
    company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
    OR (
      auth.uid() IS NOT NULL
      AND company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

CREATE POLICY invitations_insert_admin ON public.company_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
    AND invited_by = auth.uid()
  );

CREATE POLICY invitations_update_admin ON public.company_invitations
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION public.accept_company_invitation(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv company_invitations%ROWTYPE;
  current_user_id uuid := auth.uid();
  current_profile profiles%ROWTYPE;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO inv FROM company_invitations WHERE token = p_token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;
  IF inv.accepted_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_accepted');
  END IF;
  IF inv.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'revoked');
  END IF;
  IF inv.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'expired');
  END IF;

  SELECT * INTO current_profile FROM profiles WHERE id = current_user_id;
  IF current_profile.company_id IS NOT NULL AND current_profile.company_id <> inv.company_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_in_other_company');
  END IF;

  UPDATE profiles
  SET company_id = inv.company_id,
      role = inv.role,
      updated_at = now()
  WHERE id = current_user_id;

  UPDATE company_invitations
  SET accepted_at = now(),
      accepted_by = current_user_id
  WHERE id = inv.id;

  RETURN jsonb_build_object('ok', true, 'company_id', inv.company_id);
END;
$$;

REVOKE ALL ON FUNCTION public.accept_company_invitation(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.accept_company_invitation(text) TO authenticated;
