-- Fix RLS deadlock: Allow users to read their own profile
-- The existing policy "Users can read own company profiles" creates a circular dependency:
-- 1. User tries to read their profile
-- 2. RLS checks company_id = user_company_id()
-- 3. user_company_id() tries to read profiles table again -> deadlock

-- Add policy to allow users to read their own profile directly
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

-- The existing "Users can read own company profiles" policy is still useful
-- for admins to view other profiles in their company, so we keep it.
