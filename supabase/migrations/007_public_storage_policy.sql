-- Enable public access to permit documents via active public links
-- This allows inspectors to view documents when accessing /p/{token}
--
-- SECURITY: Grants unauthenticated public access only to documents for permits
-- at locations with active public links. Access is revocable via is_active flag.
--
-- Path format: permits/{permit_id}/{filename}

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_permits_id_location ON permits(id, location_id);

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public access to permit documents via active public link" ON storage.objects;

-- Create corrected policy
CREATE POLICY "Public access to permit documents via active public link"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'permit-documents'
  AND (storage.foldername(name))[1] = 'permits'
  AND (storage.foldername(name))[2] IS NOT NULL
  AND (storage.foldername(name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND EXISTS (
    SELECT 1
    FROM permits p
    JOIN public_links pl ON pl.location_id = p.location_id
    WHERE p.id::text = (storage.foldername(name))[2]
    AND p.is_active = true
    AND pl.is_active = true
  )
);
