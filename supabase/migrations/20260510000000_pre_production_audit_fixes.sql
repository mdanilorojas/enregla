-- ============================================================================
-- PRE-PRODUCTION AUDIT FIXES (2026-05-10)
-- Consolidated migration addressing BLOCKERs from the pre-production audit.
-- Already applied to prod via mcp__supabase__apply_migration.
-- Committed here for version-control parity.
-- ============================================================================

-- 1. Schema additions: staff flag + public_links expiry
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_staff boolean NOT NULL DEFAULT false;

UPDATE public.profiles
  SET is_staff = true
  WHERE id = '4bb8066b-0807-4eb7-81a8-29436b6875ea'::uuid;

ALTER TABLE public.public_links
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- 2. Storage bucket: private + 5MB limit + MIME allowlist
UPDATE storage.buckets
   SET public = false,
       file_size_limit = 5242880,
       allowed_mime_types = ARRAY['application/pdf','image/png','image/jpeg']
 WHERE id = 'permit-documents';

-- 3. Storage RLS — AND semantics, authenticated role, proper company scoping
DROP POLICY IF EXISTS "Users can upload documents for own company permits" ON storage.objects;
DROP POLICY IF EXISTS "Users can read documents for own company permits" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete documents for own company" ON storage.objects;
DROP POLICY IF EXISTS "Public access to permit documents via active public link" ON storage.objects;

CREATE POLICY "permit_docs_insert_authenticated"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'permit-documents'
  AND (storage.foldername(name))[1] = 'permits'
  AND (storage.foldername(name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND (
    EXISTS (
      SELECT 1 FROM public.permits p
      WHERE p.id::text = (storage.foldername(name))[2]
        AND p.company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
    )
    OR
    EXISTS (
      SELECT 1 FROM public.permits p
      JOIN public.profiles pr ON pr.company_id = p.company_id
      WHERE p.id::text = (storage.foldername(name))[2]
        AND pr.id = auth.uid()
    )
  )
);

CREATE POLICY "permit_docs_select_authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'permit-documents'
  AND (storage.foldername(name))[1] = 'permits'
  AND (
    EXISTS (
      SELECT 1 FROM public.permits p
      WHERE p.id::text = (storage.foldername(name))[2]
        AND p.company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
    )
    OR
    EXISTS (
      SELECT 1 FROM public.permits p
      JOIN public.profiles pr ON pr.company_id = p.company_id
      WHERE p.id::text = (storage.foldername(name))[2]
        AND pr.id = auth.uid()
    )
  )
);

CREATE POLICY "permit_docs_delete_admin"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'permit-documents'
  AND (storage.foldername(name))[1] = 'permits'
  AND (
    EXISTS (
      SELECT 1 FROM public.permits p
      WHERE p.id::text = (storage.foldername(name))[2]
        AND p.company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
    )
    OR
    EXISTS (
      SELECT 1 FROM public.permits p
      JOIN public.profiles pr ON pr.company_id = p.company_id
      WHERE p.id::text = (storage.foldername(name))[2]
        AND pr.id = auth.uid()
        AND pr.role = 'admin'
    )
  )
);

CREATE POLICY "permit_docs_select_public_link"
ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'permit-documents'
  AND (storage.foldername(name))[1] = 'permits'
  AND (storage.foldername(name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND EXISTS (
    SELECT 1
    FROM public.permits p
    JOIN public.public_links pl ON pl.company_id = p.company_id
    WHERE p.id::text = (storage.foldername(objects.name))[2]
      AND p.is_active = true
      AND pl.is_active = true
      AND (pl.expires_at IS NULL OR pl.expires_at > now())
      AND (pl.location_id IS NULL OR pl.location_id = p.location_id)
  )
);

-- 4. Partners — staff-only
DROP POLICY IF EXISTS "Authenticated users can manage partners" ON public.partners;
DROP POLICY IF EXISTS partners_all ON public.partners;

CREATE POLICY partners_staff_select ON public.partners FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_staff));

CREATE POLICY partners_staff_insert ON public.partners FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_staff));

CREATE POLICY partners_staff_update ON public.partners FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_staff))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_staff));

CREATE POLICY partners_staff_delete ON public.partners FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_staff));

-- 5. Leads — staff-only reads; anon INSERT kept but with length caps
DROP POLICY IF EXISTS leads_select ON public.leads;
DROP POLICY IF EXISTS leads_update ON public.leads;
DROP POLICY IF EXISTS leads_delete ON public.leads;

CREATE POLICY leads_staff_select ON public.leads FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_staff));

CREATE POLICY leads_staff_update ON public.leads FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_staff))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_staff));

CREATE POLICY leads_staff_delete ON public.leads FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_staff));

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_nombre_len') THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_nombre_len CHECK (char_length(nombre) BETWEEN 2 AND 120);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_negocio_len') THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_negocio_len CHECK (char_length(negocio) BETWEEN 2 AND 200);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_notas_len') THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_notas_len CHECK (notas IS NULL OR char_length(notas) <= 2000);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_ua_len') THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_ua_len CHECK (user_agent IS NULL OR char_length(user_agent) <= 512);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_ref_len') THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_ref_len CHECK (referrer IS NULL OR char_length(referrer) <= 1024);
  END IF;
END $$;

-- 6. Companies — restrict INSERT and SELECT
DROP POLICY IF EXISTS companies_insert ON public.companies;
CREATE POLICY companies_insert ON public.companies FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND company_id IS NULL)
);

DROP POLICY IF EXISTS companies_select ON public.companies;
CREATE POLICY companies_select ON public.companies FOR SELECT TO authenticated, anon
USING (
  id = '50707999-f033-41c4-91c9-989966311972'::uuid
  OR id = public.user_company_id()
);

CREATE UNIQUE INDEX IF NOT EXISTS companies_ruc_unique
  ON public.companies (ruc) WHERE ruc IS NOT NULL;

-- 7. Profiles — drop hardcoded UUID, teammate visibility
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated, anon
USING (
  id = auth.uid()
  OR company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
  OR (
    auth.uid() IS NOT NULL
    AND company_id IS NOT NULL
    AND company_id = public.user_company_id()
  )
);

-- 8. Documents — scope select by role + file_path constraint
DROP POLICY IF EXISTS documents_select ON public.documents;

CREATE POLICY documents_select_authenticated ON public.documents FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.permits p
  WHERE p.id = documents.permit_id
    AND (
      p.company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
      OR p.company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    )
));

CREATE POLICY documents_select_anon_demo ON public.documents FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM public.permits p
  WHERE p.id = documents.permit_id
    AND p.company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
));

CREATE POLICY documents_select_anon_public_link ON public.documents FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM public.permits p
  JOIN public.public_links pl ON pl.company_id = p.company_id
  WHERE p.id = documents.permit_id
    AND p.is_active = true
    AND pl.is_active = true
    AND (pl.expires_at IS NULL OR pl.expires_at > now())
    AND (pl.location_id IS NULL OR pl.location_id = p.location_id)
));

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_file_path_matches_permit') THEN
    ALTER TABLE public.documents
      ADD CONSTRAINT documents_file_path_matches_permit
      CHECK (file_path IS NULL OR file_path LIKE 'permits/' || permit_id::text || '/%');
  END IF;
END $$;

-- 9. Notification logs — dedup index + lock down writes
CREATE UNIQUE INDEX IF NOT EXISTS uq_notification_logs_user_permit_type_day
  ON public.notification_logs (user_id, permit_id, notification_type, (sent_at::date));

REVOKE INSERT, UPDATE, DELETE ON public.notification_logs FROM authenticated, anon;

-- 10. Legal tables — drop duplicate permissive policies
DROP POLICY IF EXISTS "Legal references are viewable by everyone" ON public.legal_references;
DROP POLICY IF EXISTS "Legal sources are viewable by everyone" ON public.legal_sources;
DROP POLICY IF EXISTS "Legal consequences are viewable by everyone" ON public.legal_consequences;
DROP POLICY IF EXISTS "Legal required documents are viewable by everyone" ON public.legal_required_documents;
DROP POLICY IF EXISTS "Legal process steps are viewable by everyone" ON public.legal_process_steps;

-- 11. SECURITY DEFINER lockdown + new narrow RPC
REVOKE EXECUTE ON FUNCTION public.get_expiring_permits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_expiring_permits() TO service_role;

CREATE OR REPLACE FUNCTION public.get_public_permits(link_token text)
RETURNS TABLE(
  location_name text, address text, permit_type text, permit_number text,
  status text, issue_date date, expiry_date date, issuer text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
  SELECT l.name, l.address, p.type, p.permit_number, p.status, p.issue_date, p.expiry_date, p.issuer
  FROM permits p
  INNER JOIN locations l ON p.location_id = l.id
  INNER JOIN public_links pl ON pl.company_id = p.company_id
  WHERE pl.token = link_token
    AND pl.is_active = true
    AND (pl.expires_at IS NULL OR pl.expires_at > now())
    AND p.is_active = true
    AND p.status = 'vigente'
    AND (pl.location_id IS NULL OR p.location_id = pl.location_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_permits(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_permits(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_public_link_view(link_token text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  UPDATE public_links
  SET view_count = COALESCE(view_count, 0) + 1,
      last_viewed_at = now()
  WHERE token = link_token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_public_link_view(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_public_link_view(text) TO anon, authenticated;

-- 12. FK ON DELETE actions
DO $$
BEGIN
  ALTER TABLE public.notification_logs DROP CONSTRAINT IF EXISTS notification_logs_permit_id_fkey;
  ALTER TABLE public.notification_logs ADD CONSTRAINT notification_logs_permit_id_fkey
    FOREIGN KEY (permit_id) REFERENCES public.permits(id) ON DELETE CASCADE;

  ALTER TABLE public.notification_logs DROP CONSTRAINT IF EXISTS notification_logs_user_id_fkey;
  ALTER TABLE public.notification_logs ADD CONSTRAINT notification_logs_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

  ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_uploaded_by_fkey;
  ALTER TABLE public.documents ADD CONSTRAINT documents_uploaded_by_fkey
    FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;

  ALTER TABLE public.public_links DROP CONSTRAINT IF EXISTS public_links_created_by_fkey;
  ALTER TABLE public.public_links ADD CONSTRAINT public_links_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

  ALTER TABLE public.public_links DROP CONSTRAINT IF EXISTS public_links_location_id_fkey;
  ALTER TABLE public.public_links ADD CONSTRAINT public_links_location_id_fkey
    FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;

  ALTER TABLE public.permits DROP CONSTRAINT IF EXISTS permits_superseded_by_fkey;
  ALTER TABLE public.permits ADD CONSTRAINT permits_superseded_by_fkey
    FOREIGN KEY (superseded_by) REFERENCES public.permits(id) ON DELETE SET NULL;
END $$;

-- 13. Harden triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'member'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'create_default_notification_preferences failed for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_assign_company_to_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    UPDATE profiles
    SET company_id = NEW.id,
        role = 'admin',
        updated_at = NOW()
    WHERE id = auth.uid() AND company_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- 14. Fix dead cron — use net.http_post
SELECT cron.unschedule('send-expiry-alerts-daily');

SELECT cron.schedule(
  'send-expiry-alerts-daily',
  '0 8 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://zqaqhapxqwkvninnyqiu.supabase.co/functions/v1/send-expiry-alerts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.cron_secret', true)
    ),
    body := '{}'::jsonb
  );
  $cron$
);

-- NOTE: operator must set the secret once via:
--   ALTER DATABASE postgres SET app.cron_secret TO '<random-256-bit-secret>';
-- and set CRON_SECRET env var on the edge function to the same value.
