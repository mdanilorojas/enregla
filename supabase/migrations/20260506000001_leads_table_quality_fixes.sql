-- =============================================
-- Quality fixes for leads table
-- Applied after code review of 20260506000000_leads_table.sql
-- =============================================

-- Fix 1: Email format validation
ALTER TABLE leads ADD CONSTRAINT leads_email_format_check
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Fix 2: SECURITY DEFINER en trigger function
CREATE OR REPLACE FUNCTION public.update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix 3: GRANT explicito para anon key
GRANT INSERT ON leads TO anon;

-- Fix 4: Documentacion de rate limiting
COMMENT ON POLICY "Anyone can insert leads" ON leads IS
  'INSERT publico sin auth. Depende de rate limiting a nivel de plataforma
   Supabase (anon key limits). No aplicamos rate limiting en DB porque la IP
   del cliente no es accesible desde policies RLS. Monitorear volumen anomalo.';
