-- =====================================================
-- FIX: Documents RLS Policy for Upload Functionality
-- =====================================================
-- Run this in Supabase SQL Editor to fix the document upload issue
-- Project: https://supabase.com/dashboard/project/zqaqhapxqwkvninnyqiu

BEGIN;

-- 1. Assign default role to existing users without role
UPDATE profiles
SET role = 'admin'
WHERE role IS NULL;

-- 2. Set default role for future profiles
ALTER TABLE profiles
ALTER COLUMN role SET DEFAULT 'admin';

-- 3. Drop the old restrictive policy
DROP POLICY IF EXISTS "Admins and operators can manage documents" ON documents;

-- 4. Create more granular policies

-- Allow INSERT: Any authenticated user in the company can upload documents
CREATE POLICY "Users can insert documents for own company permits"
ON documents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM permits
    WHERE permits.id = documents.permit_id
    AND permits.company_id = public.user_company_id()
  )
);

-- Allow SELECT: Any user in the company can view documents
CREATE POLICY "Users can read documents for own company permits"
ON documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM permits
    WHERE permits.id = documents.permit_id
    AND permits.company_id = public.user_company_id()
  )
);

-- Allow UPDATE: Only admins and operators
CREATE POLICY "Admins can update documents for own company"
ON documents FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM permits
    WHERE permits.id = documents.permit_id
    AND permits.company_id = public.user_company_id()
    AND public.user_role() IN ('admin', 'operator')
  )
);

-- Allow DELETE: Only admins
CREATE POLICY "Admins can delete documents for own company"
ON documents FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM permits
    WHERE permits.id = documents.permit_id
    AND permits.company_id = public.user_company_id()
    AND public.user_role() = 'admin'
  )
);

COMMIT;

-- Verify the fix
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'documents'
ORDER BY policyname;
