-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  city TEXT NOT NULL,
  location_count INT DEFAULT 0,
  regulatory_factors JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Locations table
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('operando', 'en_preparacion', 'cerrado')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('bajo', 'medio', 'alto', 'critico')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Permits table (with versioning)
CREATE TABLE permits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('vigente', 'por_vencer', 'vencido', 'en_tramite', 'no_registrado')),
  permit_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  issuer TEXT,
  notes TEXT,

  -- Versioning fields
  is_active BOOLEAN DEFAULT TRUE,
  version INT DEFAULT 1,
  superseded_by UUID REFERENCES permits(id),
  archived_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  permit_id UUID REFERENCES permits(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INT,
  file_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Public links table
CREATE TABLE public_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id),
  token TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  view_count INT DEFAULT 0,
  last_viewed_at TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator', 'viewer')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_permits_active ON permits(company_id, is_active);
CREATE INDEX idx_permits_expiry ON permits(expiry_date) WHERE is_active = true;
CREATE INDEX idx_permits_location ON permits(location_id);
CREATE INDEX idx_public_links_token ON public_links(token);
CREATE INDEX idx_public_links_company ON public_links(company_id, is_active);
CREATE INDEX idx_locations_company ON locations(company_id);

-- Function for public permit viewing
CREATE OR REPLACE FUNCTION get_public_permits(link_token TEXT)
RETURNS TABLE (
  location_name TEXT,
  location_address TEXT,
  permit_type TEXT,
  permit_number TEXT,
  status TEXT,
  issue_date DATE,
  expiry_date DATE,
  issuer TEXT
)
SECURITY DEFINER
AS $$
BEGIN
  -- Increment view count
  UPDATE public_links
  SET
    view_count = view_count + 1,
    last_viewed_at = NOW()
  WHERE token = link_token AND is_active = true;

  -- Return vigente permits only
  RETURN QUERY
  SELECT
    l.name,
    l.address,
    p.type,
    p.permit_number,
    p.status,
    p.issue_date,
    p.expiry_date,
    p.issuer
  FROM permits p
  INNER JOIN locations l ON p.location_id = l.id
  INNER JOIN public_links pl ON pl.company_id = p.company_id
  WHERE pl.token = link_token
    AND pl.is_active = true
    AND p.is_active = true
    AND p.status = 'vigente'
    AND (pl.location_id IS NULL OR p.location_id = pl.location_id);
END;
$$ LANGUAGE plpgsql;
