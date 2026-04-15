-- Fix: Assign default role to users without role
-- This ensures existing users can upload documents

-- Update existing profiles without company_id to have admin role
-- (these are users created before onboarding completion)
UPDATE profiles
SET role = 'admin'
WHERE role IS NULL OR company_id IS NULL;

-- Ensure all future profiles have a default role
ALTER TABLE profiles
ALTER COLUMN role SET DEFAULT 'admin';

-- Add a more permissive policy for document insertion
-- Allow users to insert documents for permits in their company
DROP POLICY IF EXISTS "Admins and operators can manage documents" ON documents;

CREATE POLICY "Users can insert documents for own company permits"
ON documents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM permits
    WHERE permits.id = documents.permit_id
    AND permits.company_id = public.user_company_id()
  )
);

CREATE POLICY "Users can read documents for own company permits"
ON documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM permits
    WHERE permits.id = documents.permit_id
    AND permits.company_id = public.user_company_id()
  )
);

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
