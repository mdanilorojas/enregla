-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION auth.user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Companies policies
CREATE POLICY "Users can read own company"
ON companies FOR SELECT
USING (id = auth.user_company_id());

CREATE POLICY "Admins can update own company"
ON companies FOR UPDATE
USING (id = auth.user_company_id() AND auth.user_role() = 'admin');

-- Locations policies
CREATE POLICY "Users can read own company locations"
ON locations FOR SELECT
USING (company_id = auth.user_company_id());

CREATE POLICY "Admins and operators can manage locations"
ON locations FOR ALL
USING (company_id = auth.user_company_id() AND auth.user_role() IN ('admin', 'operator'));

-- Permits policies
CREATE POLICY "Users can read own company permits"
ON permits FOR SELECT
USING (company_id = auth.user_company_id());

CREATE POLICY "Admins and operators can manage permits"
ON permits FOR ALL
USING (company_id = auth.user_company_id() AND auth.user_role() IN ('admin', 'operator'));

-- Documents policies
CREATE POLICY "Users can read documents"
ON documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM permits
    WHERE permits.id = documents.permit_id
    AND permits.company_id = auth.user_company_id()
  )
);

CREATE POLICY "Admins and operators can manage documents"
ON documents FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM permits
    WHERE permits.id = documents.permit_id
    AND permits.company_id = auth.user_company_id()
    AND auth.user_role() IN ('admin', 'operator')
  )
);

-- Public links policies
CREATE POLICY "Users can read own company links"
ON public_links FOR SELECT
USING (company_id = auth.user_company_id());

CREATE POLICY "Admins can manage public links"
ON public_links FOR ALL
USING (company_id = auth.user_company_id() AND auth.user_role() = 'admin');

-- Profiles policies
CREATE POLICY "Users can read own company profiles"
ON profiles FOR SELECT
USING (company_id = auth.user_company_id());

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "Admins can manage profiles"
ON profiles FOR ALL
USING (company_id = auth.user_company_id() AND auth.user_role() = 'admin');
