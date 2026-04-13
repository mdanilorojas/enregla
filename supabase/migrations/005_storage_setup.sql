-- Create storage bucket for permit documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('permit-documents', 'permit-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Allow authenticated users to upload documents
CREATE POLICY "Allow authenticated users to upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'permit-documents');

-- Storage policy: Allow authenticated users to view documents
CREATE POLICY "Allow authenticated users to view documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'permit-documents');

-- Storage policy: Allow authenticated users to delete documents
CREATE POLICY "Allow authenticated users to delete documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'permit-documents');

-- Storage policy: Allow authenticated users to update documents
CREATE POLICY "Allow authenticated users to update documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'permit-documents');
