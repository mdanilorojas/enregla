-- Make company_id nullable in profiles table to support onboarding flow
-- New users will have NULL company_id until they complete onboarding

ALTER TABLE profiles
ALTER COLUMN company_id DROP NOT NULL;

-- Update the foreign key constraint to allow NULL
-- (The existing FK already allows NULL, we just needed to remove NOT NULL)
