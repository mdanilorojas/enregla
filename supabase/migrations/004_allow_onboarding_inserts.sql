-- Allow users without company_id to create a new company during onboarding
-- This enables the onboarding flow where users create their company first

-- Companies: Allow authenticated users WITHOUT company_id to INSERT
CREATE POLICY "Users without company can create one"
ON companies FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND public.user_company_id() IS NULL);

-- Locations: Allow users to INSERT locations for companies they're creating
CREATE POLICY "Users can create locations during onboarding"
ON locations FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (
    -- Either they own the company
    company_id = public.user_company_id()
    OR
    -- Or they're creating locations for a company they just created (company_id is still null)
    public.user_company_id() IS NULL
  )
);

-- Permits: Allow users to INSERT permits during onboarding
CREATE POLICY "Users can create permits during onboarding"
ON permits FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (
    company_id = public.user_company_id()
    OR
    public.user_company_id() IS NULL
  )
);

-- Profiles: Allow users to UPDATE their own profile (for setting company_id after onboarding)
-- This policy should already exist but let's make sure it's correct
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
