-- Allow demo user to perform all operations even without proper auth session
-- This enables demo mode to work without real authentication

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can read own company locations" ON locations;
DROP POLICY IF EXISTS "Users can create locations for their company" ON locations;
DROP POLICY IF EXISTS "Users can update own company locations" ON locations;
DROP POLICY IF EXISTS "Users can read own company permits" ON permits;
DROP POLICY IF EXISTS "Users can create permits for their company" ON permits;
DROP POLICY IF EXISTS "Users can update own company permits" ON permits;

-- Locations policies - allow all operations for demo company
CREATE POLICY "Allow all operations on demo company locations"
ON locations
FOR ALL
USING (
  company_id = '50707999-f033-41c4-91c9-989966311972'
  OR
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- Permits policies - allow all operations for demo company
CREATE POLICY "Allow all operations on demo company permits"
ON permits
FOR ALL
USING (
  company_id = '50707999-f033-41c4-91c9-989966311972'
  OR
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- Companies policy - allow reading demo company
DROP POLICY IF EXISTS "Users can read own company" ON companies;
CREATE POLICY "Users can read own company"
ON companies
FOR SELECT
USING (
  id = '50707999-f033-41c4-91c9-989966311972'
  OR
  id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
  OR
  NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
);
