-- Fix companies SELECT policy to allow onboarding flow
-- Issue: New users couldn't read the company they just created because
-- they don't have a profile.company_id yet

DROP POLICY IF EXISTS "Users can read own company" ON companies;

CREATE POLICY "Users can read own company" ON companies
  FOR SELECT
  USING (
    -- User has profile and can read their company
    id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
    OR
    -- User has no profile yet (onboarding), can read all to find/create theirs
    NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can read own company" ON companies IS 
'Allows users to read their company (via profile.company_id) or any company if they have no profile yet (onboarding flow).';
