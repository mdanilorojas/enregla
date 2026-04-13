# PermitOps V1 DEMO-GRADE Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a convincing demo-grade V1 of PermitOps for selling to Supermaxi Ecuador - a permit management system with onboarding, multi-location dashboard, permit renewal with versioning, and public verification via QR codes.

**Architecture:** React frontend with Supabase backend. Auth-gated internal app with role-based access (admin/operator/viewer) + public token-based verification view. Permit versioning via `is_active` flag and `superseded_by` foreign key. No complex state management - Zustand for minimal client cache, Supabase for source of truth.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Tailwind CSS 4, Supabase (PostgreSQL + Auth + Storage), qrcode.react, Framer Motion

**Timeline:** 4 weeks, organized by major feature delivery

---

## File Structure Overview

This plan will create/modify these files:

```
src/
├── lib/
│   ├── supabase.ts              # Supabase client + type definitions
│   └── api/
│       ├── auth.ts              # Login, register, logout, session
│       ├── permits.ts           # CRUD + renewPermit (versioning)
│       ├── locations.ts         # CRUD for sedes
│       ├── documents.ts         # Upload/download from Storage
│       ├── publicLinks.ts       # Generate tokens, track views
│       └── onboarding.ts        # Wizard logic, auto-generate permits
├── components/
│   ├── ui/
│   │   ├── Button.tsx           # Reusable button component
│   │   ├── Card.tsx             # Card wrapper with variants
│   │   ├── Modal.tsx            # Modal container
│   │   ├── Input.tsx            # Form input with validation
│   │   ├── Select.tsx           # Dropdown select
│   │   └── Badge.tsx            # Status badges
│   ├── auth/
│   │   ├── LoginForm.tsx        # Email/password login
│   │   └── ProtectedRoute.tsx   # Auth guard for routes
│   ├── onboarding/
│   │   ├── OnboardingWizard.tsx # Main wizard container
│   │   ├── Step1Company.tsx     # Datos de empresa
│   │   ├── Step2Regulatory.tsx  # Factores regulatorios
│   │   ├── Step3Locations.tsx   # Sedes iniciales
│   │   └── Step4Review.tsx      # Revisión y confirmación
│   ├── dashboard/
│   │   ├── DashboardView.tsx    # Main dashboard (ya existe, modificar)
│   │   ├── RiskOverview.tsx     # Hero card con risk level (ya existe, modificar)
│   │   ├── MetricsGrid.tsx      # 3 métricas (vigentes, por vencer, faltantes)
│   │   ├── SedeCard.tsx         # Card individual de sede
│   │   └── UpcomingRenewals.tsx # Timeline de vencimientos
│   ├── locations/
│   │   ├── LocationDetailView.tsx  # Vista detallada de sede
│   │   ├── PermitsTable.tsx        # Tabla de permisos de sede
│   │   └── PublicLinkBanner.tsx    # Banner de link público activo
│   ├── permits/
│   │   ├── RenewPermitModal.tsx    # Modal de renovación
│   │   ├── PermitHistory.tsx       # Historial de versiones
│   │   └── PermitDetailView.tsx    # Detalle completo de permiso
│   ├── publicLinks/
│   │   ├── GeneratePublicLinkModal.tsx  # Modal para generar link
│   │   ├── PublicLinkSuccessModal.tsx   # Modal con QR + opciones
│   │   └── PublicLinkQR.tsx             # Componente QR con download/print
│   └── public/
│       └── PublicVerificationView.tsx   # Vista pública sin auth
├── pages/
│   ├── Login.tsx                # Página de login
│   ├── Onboarding.tsx           # Página de onboarding
│   ├── Dashboard.tsx            # Página de dashboard
│   ├── LocationDetail.tsx       # Página de detalle de sede
│   └── PublicVerification.tsx   # Página pública /p/:token
├── hooks/
│   ├── useAuth.ts               # Hook para auth state
│   ├── usePermits.ts            # Hook para permisos
│   ├── useLocations.ts          # Hook para sedes
│   └── usePublicLink.ts         # Hook para links públicos
├── store/
│   └── authStore.ts             # Zustand store para auth cache
└── types/
    └── database.ts              # TypeScript types para DB

supabase/
├── migrations/
│   ├── 001_initial_schema.sql   # Schema completo
│   └── 002_rls_policies.sql     # Row Level Security
└── seed.sql                     # Seed data de Supermaxi

scripts/
└── seed-demo.ts                 # Script para cargar seed data
```

---

## WEEK 1: Foundation + Onboarding + Dashboard

### Task 1: Supabase Setup & Schema

**Goal:** Create Supabase project, execute schema, configure RLS

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `supabase/migrations/002_rls_policies.sql`
- Create: `supabase/seed.sql`
- Create: `.env.local`

- [ ] **Step 1: Create Supabase project**

1. Go to https://supabase.com
2. Create new project: `permitops-demo`
3. Region: South America (São Paulo)
4. Database password: Generate strong password, save it
5. Wait for provisioning (~2 minutes)

- [ ] **Step 2: Copy credentials to .env.local**

Create `.env.local`:

```bash
VITE_SUPABASE_URL=https://[your-project-id].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- [ ] **Step 3: Write initial schema migration**

Create `supabase/migrations/001_initial_schema.sql`:

```sql
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

-- Permits table
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
  
  -- Versioning
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

-- Indexes for performance
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
```

- [ ] **Step 4: Write RLS policies migration**

Create `supabase/migrations/002_rls_policies.sql`:

```sql
-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's company_id
CREATE OR REPLACE FUNCTION auth.user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to get user's role
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
```

- [ ] **Step 5: Execute migrations in Supabase Dashboard**

1. Go to Supabase Dashboard → SQL Editor
2. Paste `001_initial_schema.sql` content
3. Click "Run"
4. Verify: Should see "Success" with no errors
5. Repeat for `002_rls_policies.sql`

- [ ] **Step 6: Create Storage bucket for documents**

1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `permit-documents`
4. Public: false (private)
5. Click "Create bucket"
6. Click bucket → Policies → New Policy
7. Policy name: "Authenticated users can upload"
8. Target roles: authenticated
9. Policy definition: `bucket_id = 'permit-documents'`
10. Allow: INSERT, SELECT

- [ ] **Step 7: Verify setup**

Run in SQL Editor:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected output:
```
companies
documents
locations
permits
profiles
public_links
```

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/ .env.local
git commit -m "feat: add Supabase schema and RLS policies

- Initial schema with companies, locations, permits, documents, public_links, profiles
- Permit versioning support (is_active, version, superseded_by)
- RLS policies for role-based access (admin, operator, viewer)
- Function for public permit viewing without auth
- Storage bucket for permit documents

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 2: Supabase Client & Type Definitions

**Goal:** Setup typed Supabase client with auto-generated types

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/types/database.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Supabase client**

```bash
npm install @supabase/supabase-js
```

- [ ] **Step 2: Create Supabase client**

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 3: Create database types**

Create `src/types/database.ts`:

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          business_type: string;
          city: string;
          location_count: number;
          regulatory_factors: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          business_type: string;
          city: string;
          location_count?: number;
          regulatory_factors?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          business_type?: string;
          city?: string;
          location_count?: number;
          regulatory_factors?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          address: string;
          status: 'operando' | 'en_preparacion' | 'cerrado';
          risk_level: 'bajo' | 'medio' | 'alto' | 'critico';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          address: string;
          status: 'operando' | 'en_preparacion' | 'cerrado';
          risk_level: 'bajo' | 'medio' | 'alto' | 'critico';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          address?: string;
          status?: 'operando' | 'en_preparacion' | 'cerrado';
          risk_level?: 'bajo' | 'medio' | 'alto' | 'critico';
          created_at?: string;
          updated_at?: string;
        };
      };
      permits: {
        Row: {
          id: string;
          company_id: string;
          location_id: string;
          type: string;
          status: 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite' | 'no_registrado';
          permit_number: string | null;
          issue_date: string | null;
          expiry_date: string | null;
          issuer: string | null;
          notes: string | null;
          is_active: boolean;
          version: number;
          superseded_by: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          location_id: string;
          type: string;
          status: 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite' | 'no_registrado';
          permit_number?: string | null;
          issue_date?: string | null;
          expiry_date?: string | null;
          issuer?: string | null;
          notes?: string | null;
          is_active?: boolean;
          version?: number;
          superseded_by?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          location_id?: string;
          type?: string;
          status?: 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite' | 'no_registrado';
          permit_number?: string | null;
          issue_date?: string | null;
          expiry_date?: string | null;
          issuer?: string | null;
          notes?: string | null;
          is_active?: boolean;
          version?: number;
          superseded_by?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          permit_id: string;
          file_path: string;
          file_name: string;
          file_size: number | null;
          file_type: string | null;
          uploaded_by: string | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          permit_id: string;
          file_path: string;
          file_name: string;
          file_size?: number | null;
          file_type?: string | null;
          uploaded_by?: string | null;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          permit_id?: string;
          file_path?: string;
          file_name?: string;
          file_size?: number | null;
          file_type?: string | null;
          uploaded_by?: string | null;
          uploaded_at?: string;
        };
      };
      public_links: {
        Row: {
          id: string;
          company_id: string;
          location_id: string | null;
          token: string;
          label: string;
          is_active: boolean;
          view_count: number;
          last_viewed_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          location_id?: string | null;
          token: string;
          label: string;
          is_active?: boolean;
          view_count?: number;
          last_viewed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          location_id?: string | null;
          token?: string;
          label?: string;
          is_active?: boolean;
          view_count?: number;
          last_viewed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          company_id: string;
          full_name: string;
          role: 'admin' | 'operator' | 'viewer';
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          company_id: string;
          full_name: string;
          role: 'admin' | 'operator' | 'viewer';
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          full_name?: string;
          role?: 'admin' | 'operator' | 'viewer';
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      get_public_permits: {
        Args: {
          link_token: string;
        };
        Returns: {
          location_name: string;
          location_address: string;
          permit_type: string;
          permit_number: string;
          status: string;
          issue_date: string;
          expiry_date: string;
          issuer: string;
        }[];
      };
    };
  };
}

// Helper types
export type Company = Database['public']['Tables']['companies']['Row'];
export type Location = Database['public']['Tables']['locations']['Row'];
export type Permit = Database['public']['Tables']['permits']['Row'];
export type Document = Database['public']['Tables']['documents']['Row'];
export type PublicLink = Database['public']['Tables']['public_links']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

export type PermitStatus = Permit['status'];
export type LocationStatus = Location['status'];
export type RiskLevel = Location['risk_level'];
export type UserRole = Profile['role'];
```

- [ ] **Step 4: Test Supabase connection**

Run in browser console after starting dev server:

```typescript
import { supabase } from './lib/supabase';
const { data, error } = await supabase.from('companies').select('count');
console.log({ data, error });
```

Expected: `{ data: [{ count: 0 }], error: null }`

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase.ts src/types/database.ts package.json package-lock.json
git commit -m "feat: add Supabase client with TypeScript types

- Typed Supabase client with Database type
- Helper types for all tables
- Environment variable validation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 3: Auth API Layer

**Goal:** Implement authentication functions (login, register, logout, session management)

**Files:**
- Create: `src/lib/api/auth.ts`
- Create: `src/hooks/useAuth.ts`
- Create: `src/store/authStore.ts`

- [ ] **Step 1: Install Zustand**

```bash
npm install zustand
```

- [ ] **Step 2: Create auth API functions**

Create `src/lib/api/auth.ts`:

```typescript
import { supabase } from '../supabase';
import type { Profile } from '@/types/database';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  companyId: string;
  role: 'admin' | 'operator' | 'viewer';
}

export async function login(credentials: LoginCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });
  
  if (error) throw error;
  
  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();
  
  if (profileError) throw profileError;
  
  return {
    user: data.user,
    profile,
  };
}

export async function register(data: RegisterData) {
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });
  
  if (authError) throw authError;
  if (!authData.user) throw new Error('No user returned from signup');
  
  // Create profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      company_id: data.companyId,
      full_name: data.fullName,
      role: data.role,
    })
    .select()
    .single();
  
  if (profileError) throw profileError;
  
  return {
    user: authData.user,
    profile,
  };
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) throw userError;
  if (!user) return null;
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (profileError) throw profileError;
  
  return {
    user,
    profile,
  };
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}
```

- [ ] **Step 3: Create auth store**

Create `src/store/authStore.ts`:

```typescript
import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  setAuth: (user: User | null, profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  setAuth: (user, profile) => set({ user, profile, loading: false }),
  setLoading: (loading) => set({ loading }),
  clear: () => set({ user: null, profile: null, loading: false }),
}));
```

- [ ] **Step 4: Create useAuth hook**

Create `src/hooks/useAuth.ts`:

```typescript
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getCurrentUser } from '@/lib/api/auth';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const { user, profile, loading, setAuth, setLoading, clear } = useAuthStore();
  
  useEffect(() => {
    // Check current session
    getCurrentUser()
      .then((data) => {
        if (data) {
          setAuth(data.user, data.profile);
        } else {
          clear();
        }
      })
      .catch(() => {
        clear();
      });
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const userData = await getCurrentUser();
          if (userData) {
            setAuth(userData.user, userData.profile);
          }
        } else if (event === 'SIGNED_OUT') {
          clear();
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [setAuth, setLoading, clear]);
  
  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    role: profile?.role,
    companyId: profile?.company_id,
  };
}
```

- [ ] **Step 5: Test auth flow manually**

In browser console:

```typescript
import { login, register, logout } from './lib/api/auth';

// Test register
await register({
  email: 'test@supermaxi.com',
  password: 'Test1234!',
  fullName: 'Test User',
  companyId: 'some-uuid',
  role: 'admin'
});

// Test login
await login({ email: 'test@supermaxi.com', password: 'Test1234!' });

// Test logout
await logout();
```

Expected: No errors, user created in Supabase Auth dashboard

- [ ] **Step 6: Commit**

```bash
git add src/lib/api/auth.ts src/hooks/useAuth.ts src/store/authStore.ts package.json package-lock.json
git commit -m "feat: add authentication API layer

- Login, register, logout functions
- getCurrentUser with profile fetch
- Zustand store for auth state
- useAuth hook with auth state change listener

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 4: Login Page & Protected Routes

**Goal:** Build login UI and route protection

**Files:**
- Create: `src/components/auth/LoginForm.tsx`
- Create: `src/components/auth/ProtectedRoute.tsx`
- Create: `src/pages/Login.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create LoginForm component**

Create `src/components/auth/LoginForm.tsx`:

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '@/lib/api/auth';
import { useAuthStore } from '@/store/authStore';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const data = await login({ email, password });
      setAuth(data.user, data.profile);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="tu@email.com"
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="••••••••"
        />
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Create ProtectedRoute component**

Create `src/components/auth/ProtectedRoute.tsx`:

```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}
```

- [ ] **Step 3: Create Login page**

Create `src/pages/Login.tsx`:

```typescript
import { LoginForm } from '@/components/auth/LoginForm';

export function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            PermitOps
          </h1>
          <p className="text-gray-600">
            Sistema de Gestión de Permisos
          </p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update App.tsx with routes**

Modify `src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 5: Create placeholder Dashboard page**

Create `src/pages/Dashboard.tsx`:

```typescript
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/lib/api/auth';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Bienvenido, {profile?.full_name} ({profile?.role})
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Cerrar Sesión
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600">Dashboard content will go here...</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Test login flow**

1. Start dev server: `npm run dev`
2. Go to http://localhost:5173
3. Should redirect to /login
4. Try to login (will fail - no users yet)
5. Create user manually in Supabase Auth dashboard
6. Login with created user
7. Should see Dashboard with user name
8. Click "Cerrar Sesión"
9. Should redirect to /login

Expected: All flows work without errors

- [ ] **Step 7: Commit**

```bash
git add src/components/auth/ src/pages/Login.tsx src/pages/Dashboard.tsx src/App.tsx
git commit -m "feat: add login page and protected routes

- LoginForm with email/password authentication
- ProtectedRoute component with loading state
- Login page with PermitOps branding
- Placeholder Dashboard page
- Route protection in App.tsx

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

---

### Task 5: Onboarding Wizard - Step 1 (Company Data)

**Goal:** Build first step of onboarding (company info capture)

**Files:**
- Create: `src/components/onboarding/OnboardingWizard.tsx` - Main wizard container with stepper
- Create: `src/components/onboarding/Step1Company.tsx` - Company data form
- Create: `src/pages/Onboarding.tsx` - Onboarding page route

**Key Implementation:**
- Form with: name, RUC, city dropdown (Quito/Guayaquil/Cuenca), business_type dropdown
- Form validation (required fields, RUC format)
- State management for wizard (current step, form data)
- Stepper UI showing "Paso 1 de 4"

**Acceptance Criteria:**
- [ ] Form validates required fields
- [ ] Can't proceed without filling all fields
- [ ] Data stored in wizard state
- [ ] "Siguiente" button navigates to Step 2

---

### Task 6: Onboarding Wizard - Step 2 (Regulatory Factors)

**Goal:** Capture regulatory factors (food, alcohol, health, chemicals)

**Files:**
- Create: `src/components/onboarding/Step2Regulatory.tsx` - Toggle checkboxes for factors
- Modify: `src/components/onboarding/OnboardingWizard.tsx` - Add step 2 routing

**Key Implementation:**
- 4 toggle checkboxes with descriptions
- Store as `regulatory_factors` JSON object
- "Atrás" button to go back to Step 1
- Data persists when going back/forward

**Acceptance Criteria:**
- [ ] Toggles work correctly
- [ ] Can go back to Step 1 without losing data
- [ ] "Siguiente" proceeds to Step 3

---

### Task 7: Onboarding Wizard - Step 3 (Initial Locations)

**Goal:** Add initial sedes with dynamic form

**Files:**
- Create: `src/components/onboarding/Step3Locations.tsx` - Dynamic location form
- Create: `src/lib/api/onboarding.ts` - Onboarding API functions

**Key Implementation:**
- Input for number of locations (1-10)
- Dynamic form: name, address, status dropdown per location
- "Agregar otra sede" button
- Validation: at least 1 location required

**Acceptance Criteria:**
- [ ] Can add multiple locations
- [ ] Can remove added locations
- [ ] Form validates each location
- [ ] "Siguiente" proceeds to Step 4

---

### Task 8: Onboarding Wizard - Step 4 (Review & Complete)

**Goal:** Review summary and create company + locations + auto-generate permits

**Files:**
- Create: `src/components/onboarding/Step4Review.tsx` - Review summary
- Modify: `src/lib/api/onboarding.ts` - Add `completeOnboarding` function

**Key Implementation:**
- Display summary of all entered data
- Preview of permits to be generated based on regulatory factors
- "Activar Sistema" button calls API to:
  1. Create company record
  2. Create location records
  3. Auto-generate permits with status `no_registrado`
  4. Calculate initial risk_level per location
  5. Create profile for user
  6. Navigate to dashboard

**Acceptance Criteria:**
- [ ] Summary displays all data correctly
- [ ] "Activar Sistema" creates all records
- [ ] Redirects to dashboard after completion
- [ ] User sees their newly created company/sedes

---

### Task 9: Seed Data Script

**Goal:** Create seed script for demo data (Supermaxi Ecuador)

**Files:**
- Create: `supabase/seed.sql` - SQL seed data
- Create: `scripts/seed-demo.ts` - TypeScript seed script (alternative)

**Key Implementation:**
- Company: Supermaxi Ecuador
- 3 Locations: El Bosque (todo OK), Mall del Sol (1 por vencer), Norte (alto riesgo)
- 12 Permits total with realistic data
- 1 Public link for Mall del Sol with view_count=3
- Admin user: demo@supermaxi.com / Demo2026!

**Acceptance Criteria:**
- [ ] Running seed script populates DB
- [ ] Can login with demo user
- [ ] Dashboard shows 3 sedes with correct data
- [ ] Mall del Sol has link público activo

---

### Task 10: Dashboard Metrics & Risk Overview

**Goal:** Build dashboard with real data from Supabase

**Files:**
- Modify: `src/components/dashboard/DashboardView.tsx` - Connect to real data
- Modify: `src/components/dashboard/RiskOverview.tsx` - Calculate from permits
- Create: `src/components/dashboard/MetricsGrid.tsx` - Vigentes/Por vencer/Faltantes
- Create: `src/lib/api/permits.ts` - Permit CRUD functions
- Create: `src/lib/api/locations.ts` - Location CRUD functions
- Create: `src/hooks/usePermits.ts` - Hook for permits data
- Create: `src/hooks/useLocations.ts` - Hook for locations data

**Key Implementation:**
- Fetch all locations and permits for company
- Calculate metrics:
  - Vigentes: `status='vigente' AND is_active=true`
  - Por vencer: `status='por_vencer' AND is_active=true`
  - Faltantes: `status='no_registrado' AND is_active=true`
  - Compliance %: `(vigentes / total) * 100`
- Display risk level with color coding
- Metrics grid with 3 cards

**Acceptance Criteria:**
- [ ] Dashboard loads data from Supabase
- [ ] Metrics calculate correctly
- [ ] Risk overview shows correct level
- [ ] Loading state while fetching

---

### Task 11: Dashboard - Sede Cards & Upcoming Renewals

**Goal:** Complete dashboard with sede cards and renewal timeline

**Files:**
- Create: `src/components/dashboard/SedeCard.tsx` - Individual sede card
- Create: `src/components/dashboard/UpcomingRenewals.tsx` - Timeline of vencimientos
- Modify: `src/components/dashboard/DashboardView.tsx` - Add both components

**Key Implementation:**
- Sede cards grid (3 columns on desktop)
- Each card shows: name, status, risk level, permits count, quick action button
- Upcoming renewals timeline (next 5 permits by expiry_date)
- Click sede card → navigate to `/sedes/:locationId`
- Click renewal → navigate to permit detail

**Acceptance Criteria:**
- [ ] 3 sede cards display correctly
- [ ] Risk levels color-coded (green/yellow/red)
- [ ] Click sede → navigates to detail
- [ ] Timeline shows próximos vencimientos ordered by date

---

## WEEK 2: Location Detail + Permit Renewal

### Task 12: Location Detail View - Layout & Permits Table

**Goal:** Build sede detail page with permits table

**Files:**
- Create: `src/pages/LocationDetail.tsx` - Location detail page
- Create: `src/components/locations/LocationDetailView.tsx` - Main layout
- Create: `src/components/locations/PermitsTable.tsx` - Table of permits
- Modify: `src/App.tsx` - Add `/sedes/:locationId` route

**Key Implementation:**
- Header: sede name, address, status badge, risk indicator
- Resumen: permisos vigentes count, próximo vencimiento
- Permits table: tipo, estado, fecha vencimiento, acciones
- "Renovar" button for `por_vencer` permits
- "Agregar" button for `no_registrado` permits
- Action buttons only visible for operator/admin roles

**Acceptance Criteria:**
- [ ] Location detail page loads sede data
- [ ] Permits table shows all permits for sede
- [ ] Status badges color-coded
- [ ] "Renovar" button only on por_vencer permits
- [ ] Viewer role doesn't see action buttons

---

### Task 13: Renew Permit Modal - UI & Form

**Goal:** Build renewal modal with form

**Files:**
- Create: `src/components/permits/RenewPermitModal.tsx` - Modal component
- Install: `npm install qrcode.react` (for later QR task)

**Key Implementation:**
- Modal triggered by "Renovar" button
- Shows current permit info (version, dates)
- Form fields: permit_number, issue_date, expiry_date, document upload
- Info text explaining versioning
- "Cancelar" and "Renovar Permiso" buttons
- File upload for new document (PDF/PNG)

**Acceptance Criteria:**
- [ ] Modal opens when clicking "Renovar"
- [ ] Displays current permit info
- [ ] Form validates required fields
- [ ] Can upload document file
- [ ] "Cancelar" closes modal without saving

---

### Task 14: Renew Permit - API & Versioning Logic

**Goal:** Implement permit renewal with versioning

**Files:**
- Modify: `src/lib/api/permits.ts` - Add `renewPermit` function
- Create: `src/lib/api/documents.ts` - Document upload functions

**Key Implementation:**
```typescript
async function renewPermit(permitId: string, data: RenewData) {
  // 1. Get old permit
  const oldPermit = await getPermitById(permitId);
  
  // 2. Create new version
  const newPermit = {
    ...oldPermit,
    id: undefined, // generate new
    version: oldPermit.version + 1,
    permit_number: data.permit_number,
    issue_date: data.issue_date,
    expiry_date: data.expiry_date,
    status: 'vigente',
    is_active: true,
  };
  const created = await supabase.from('permits').insert(newPermit).select().single();
  
  // 3. Archive old permit
  await supabase.from('permits').update({
    is_active: false,
    superseded_by: created.id,
    archived_at: NOW(),
  }).eq('id', permitId);
  
  // 4. Upload document if provided
  if (data.document) {
    await uploadDocument(created.id, data.document);
  }
  
  return created;
}
```

**Acceptance Criteria:**
- [ ] renewPermit creates new version
- [ ] Old permit marked as archived
- [ ] superseded_by points to new permit
- [ ] Document uploads to Supabase Storage
- [ ] Modal closes and shows success toast

---

### Task 15: Permit Detail View with Version History

**Goal:** Show permit detail with full version history

**Files:**
- Create: `src/pages/PermitDetail.tsx` - Permit detail page
- Create: `src/components/permits/PermitDetailView.tsx` - Main layout
- Create: `src/components/permits/PermitHistory.tsx` - Version history component
- Modify: `src/App.tsx` - Add `/permisos/:permitId` route

**Key Implementation:**
- Display full permit information
- Show current version (v1, v2, etc.)
- History section showing all versions in reverse chronological order
- Each history item shows: version, status at that time, dates, documents
- Archived versions clearly marked
- "Renovar" button on current version if por_vencer

**Acceptance Criteria:**
- [ ] Detail page shows complete permit info
- [ ] History displays all versions
- [ ] Current version highlighted
- [ ] Archived versions show "Archivada" badge
- [ ] Can see superseded_by relationship

---

### Task 16: Documents Upload & List

**Goal:** Implement document upload and listing

**Files:**
- Create: `src/components/documents/DocumentUpload.tsx` - Upload component
- Create: `src/components/documents/DocumentList.tsx` - List of documents
- Modify: `src/lib/api/documents.ts` - Complete CRUD functions

**Key Implementation:**
- Drag & drop file upload (PDF, PNG, JPG)
- File size validation (max 5MB)
- Upload to Supabase Storage: `permit-documents/{company_id}/permits/{permit_id}/{filename}`
- List documents with: filename, size, upload date, download button
- Delete document (operator/admin only)

**Acceptance Criteria:**
- [ ] Can drag & drop files
- [ ] Upload shows progress
- [ ] Files stored in correct Storage path
- [ ] Document list shows all files for permit
- [ ] Can download documents
- [ ] Viewer role can download but not delete

---

## WEEK 3: Public Links + QR + Public View

### Task 17: Generate Public Link - Modal & Token Creation

**Goal:** Build modal to generate public verification link

**Files:**
- Create: `src/components/publicLinks/GeneratePublicLinkModal.tsx` - Modal
- Create: `src/lib/api/publicLinks.ts` - Public links API

**Key Implementation:**
- Modal with options:
  - Radio: Toda la empresa / Solo esta sede
  - Input: Label (e.g., "Inspector Municipal 2026")
- Generate UUID token with `crypto.randomUUID()`
- Insert into `public_links` table
- Return public URL: `https://enregla.ec/p/{token}`

**Acceptance Criteria:**
- [ ] Modal opens from dashboard or sede detail
- [ ] Can choose scope (empresa/sede)
- [ ] Token generated is unique
- [ ] Link saved to database
- [ ] Shows success modal with URL

---

### Task 18: Public Link Success Modal with QR

**Goal:** Show generated link with QR code

**Files:**
- Create: `src/components/publicLinks/PublicLinkSuccessModal.tsx` - Success modal
- Create: `src/components/publicLinks/PublicLinkQR.tsx` - QR component

**Key Implementation:**
- Use `qrcode.react` to generate QR
- Display QR code (256x256)
- Show full URL below QR
- Buttons:
  - "Copiar Link" - copy to clipboard
  - "Descargar QR" - download as PNG (512x512)
  - "Imprimir QR" - open print window with QR
- Tip text about printing and posting QR

**Acceptance Criteria:**
- [ ] QR displays correctly
- [ ] Copy link works (clipboard API)
- [ ] Download QR saves PNG file
- [ ] Print QR opens print-friendly layout
- [ ] All buttons functional

---

### Task 19: Public Link Banner in Location Detail

**Goal:** Show active public link status in sede view

**Files:**
- Create: `src/components/locations/PublicLinkBanner.tsx` - Banner component
- Modify: `src/components/locations/LocationDetailView.tsx` - Add banner

**Key Implementation:**
- Query `public_links` for active link for this location
- If exists, show banner with:
  - Mini QR code
  - Token (abbreviated): "...abc123"
  - Label: "Inspector Municipal 2026"
  - View count: "Vistas: 3"
  - Last viewed: "Último acceso: hace 2 horas"
  - Buttons: "Copiar Link", "Ver QR", "Desactivar"
- If not exists, don't show banner

**Acceptance Criteria:**
- [ ] Banner shows if link exists
- [ ] Displays view_count and last_viewed_at
- [ ] "Ver QR" opens modal with large QR
- [ ] "Desactivar" marks link as inactive
- [ ] Updates in real-time after link created

---

### Task 20: Public Verification View - No Auth

**Goal:** Build public view without authentication

**Files:**
- Create: `src/pages/PublicVerification.tsx` - Public page
- Create: `src/components/public/PublicVerificationView.tsx` - Main component
- Modify: `src/App.tsx` - Add `/p/:token` route (NO ProtectedRoute)

**Key Implementation:**
- Route accessible without login
- Call `get_public_permits(token)` Supabase function
- Display:
  - Company name + location name
  - Address
  - "Esta sede mantiene todos sus permisos vigentes" banner
  - List of vigente permits only (cards, not table)
  - Each permit: tipo, número, emisor, vigencia dates
- Footer: "Powered by PermitOps"
- Different styling from internal app (public-facing, branded)

**Acceptance Criteria:**
- [ ] Can access `/p/:token` without login
- [ ] Shows only vigente permits
- [ ] Does NOT show vencidos, faltantes, archivados
- [ ] view_count increments on page load
- [ ] last_viewed_at updates
- [ ] Invalid token shows error page

---

### Task 21: Track View Count & Last Access

**Goal:** Display access tracking in internal view

**Files:**
- Modify: `src/components/locations/PublicLinkBanner.tsx` - Add tracking display
- Modify: `supabase/migrations/001_initial_schema.sql` - Verify function increments

**Key Implementation:**
- When public view loads, `get_public_permits` function auto-increments `view_count`
- Fetch updated view_count and last_viewed_at when returning to internal view
- Display in banner:
  - "Vistas: 5" (real-time count)
  - "Último acceso: hace 30 minutos" (relative time)
- Polling or manual refresh to update (no real-time subscriptions in V1)

**Acceptance Criteria:**
- [ ] View count increments when public page accessed
- [ ] Last viewed timestamp updates
- [ ] Banner shows current count after refresh
- [ ] Relative time display ("hace X horas")

---

## WEEK 4: Roles + Polish + Demo Ready

### Task 22: Role-Based UI Adaptation

**Goal:** Adapt UI based on user role (admin/operator/viewer)

**Files:**
- Modify: `src/components/dashboard/DashboardView.tsx` - Hide actions for viewer
- Modify: `src/components/locations/LocationDetailView.tsx` - Hide actions for viewer
- Modify: `src/components/locations/PermitsTable.tsx` - Conditional buttons
- Create: `src/hooks/usePermissions.ts` - Helper hook for permissions

**Key Implementation:**
```typescript
function usePermissions() {
  const { role } = useAuth();
  return {
    canEdit: role === 'admin' || role === 'operator',
    canDelete: role === 'admin',
    canGeneratePublicLink: role === 'admin',
    canViewOnly: role === 'viewer',
  };
}
```
- Hide "Acciones Rápidas" section for viewer
- Hide "Renovar", "Agregar", "Editar" buttons for viewer
- Hide "Generar Link Público" button for non-admin
- Show read-only badges instead of action buttons

**Acceptance Criteria:**
- [ ] Viewer sees no action buttons
- [ ] Operator sees all CRUD buttons
- [ ] Admin sees everything including user management
- [ ] RLS enforces permissions at DB level
- [ ] UI matches backend permissions

---

### Task 23: Loading States & Empty States

**Goal:** Add loading skeletons and empty state messages

**Files:**
- Create: `src/components/ui/Skeleton.tsx` - Skeleton loader component
- Create: `src/components/ui/EmptyState.tsx` - Empty state component
- Modify: All views to show loading/empty states

**Key Implementation:**
- Loading skeleton for dashboard cards (shimmer effect)
- Empty state for sede with no permits: "No hay permisos registrados. Agrega el primer permiso →"
- Empty state for location with no documents: "No hay documentos. Sube el primer documento →"
- Empty state for dashboard with no sedes: "Completa el onboarding para empezar →"
- Consistent styling across all empty states

**Acceptance Criteria:**
- [ ] Dashboard shows skeleton while loading
- [ ] Empty states have helpful text + action button
- [ ] No blank screens or loading text only
- [ ] Skeletons match final layout structure

---

### Task 24: UI Polish & Transitions

**Goal:** Premium UI polish with Framer Motion transitions

**Files:**
- Install: `npm install framer-motion`
- Modify: Multiple components - Add transitions
- Create: `src/components/ui/transitions.ts` - Reusable motion variants

**Key Implementation:**
- Fade in animations for page loads
- Slide up for modals
- Smooth transitions for status badge changes
- Hover effects on cards (scale 1.02)
- Button states (loading spinner, disabled opacity)
- Toast notifications for actions (success/error)
- Consistent spacing (Tailwind spacing scale)
- Premium color palette (not generic grays)

**Acceptance Criteria:**
- [ ] All pages fade in smoothly
- [ ] Modals slide up from bottom
- [ ] Cards have subtle hover effect
- [ ] Buttons show loading state
- [ ] Toasts appear for all actions
- [ ] UI feels premium and polished

---

### Task 25: Demo Rehearsal & Final Adjustments

**Goal:** Ensure 5-minute demo narrative works perfectly

**Files:**
- Create: `docs/DEMO_SCRIPT.md` - Step-by-step demo script
- Modify: Any components with demo blockers

**Demo Script:**
```markdown
1. CONTEXTO (30s)
   - Show onboarding wizard
   - Select: Retail, Alimentos ✓, Alcohol ✓
   - 3 sedes
   - Result: 12 permisos generados

2. GLOBAL (1min)
   - Dashboard: 10/12 vigentes, 2 alertas
   - 3 sede cards with different risk levels
   - Click "Supermaxi Mall del Sol"

3. DETALLE (1min)
   - Sede detail: 3/4 permisos
   - Bomberos por vencer (15 días)
   - Link público banner: "3 vistas, hace 2 horas"

4. RENOVACIÓN (1.5min)
   - Click "Renovar" en Bomberos
   - Fill form: new dates, upload doc
   - Confirm → v2 created, v1 archived
   - Show history: v1 (archivada), v2 (actual)

5. TRANSPARENCIA (1min)
   - Click "Ver QR" in banner
   - Show QR modal with download/print options
   - Open public link in new tab
   - Show: only vigentes, clean UI
   - Back to internal: "4 vistas, hace 1 minuto"

CLOSE (30s)
"Control + Trazabilidad + Transparencia.
Reemplaza carpetas y Excel con esto."
```

**Checklist:**
- [ ] Seed data loaded correctly
- [ ] Demo user can login
- [ ] All flows work without errors
- [ ] No loading delays >2 seconds
- [ ] UI looks premium on projector/screen share
- [ ] Demo script rehearsed and timed

---

## Execution Notes

### Development Commands

```bash
# Start dev server
npm run dev

# Run type checking
npm run build

# Seed demo data (after schema setup)
npm run seed-demo

# Clear DB and reseed (for testing)
# In Supabase Dashboard: Truncate all tables, then re-run seed
```

### Testing Checklist Per Task

Each task should verify:
- [ ] TypeScript compiles without errors
- [ ] UI renders without console errors
- [ ] Data fetches/saves correctly to Supabase
- [ ] RLS policies work (test as different roles)
- [ ] Mobile responsive (test in DevTools)
- [ ] Git commit with descriptive message

### Git Commit Convention

```
feat: add [feature]
fix: resolve [bug]
refactor: improve [component]
docs: update [documentation]
chore: [maintenance task]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Self-Review Results

**Spec Coverage Check:**
- ✅ Onboarding wizard (4 steps): Tasks 5-8
- ✅ Dashboard with metrics: Tasks 9-11
- ✅ Location detail: Task 12
- ✅ Permit renewal with versioning: Tasks 13-15
- ✅ Document management: Task 16
- ✅ Public links generation: Tasks 17-18
- ✅ QR code support: Task 18
- ✅ Public view without auth: Task 20
- ✅ View tracking: Task 19, 21
- ✅ Role-based access: Task 22
- ✅ UI polish: Tasks 23-24
- ✅ Demo readiness: Task 25
- ✅ 3 roles (admin/operator/viewer): Task 22
- ✅ Seed data (Supermaxi): Task 9

**No spec requirements missing.**

**Placeholder Scan:**
- ✅ No "TBD" or "TODO" markers
- ✅ All file paths specified
- ✅ Key code examples provided for complex logic (renewPermit, get_public_permits)
- ✅ Acceptance criteria clear and testable

**Type Consistency:**
- ✅ Database types match schema (Task 2)
- ✅ Permit status types consistent across tasks
- ✅ Location/Role enums consistent

**Plan ready for execution.**

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-13-permitops-v1-implementation.md`.

**Two execution options:**

**1. Subagent-Driven Development (RECOMMENDED)**
- Fresh subagent per task
- Two-stage review between tasks
- Fast iteration with context isolation
- **Use:** `superpowers:subagent-driven-development`

**2. Inline Execution**
- Execute tasks in this session
- Batch execution with checkpoints
- **Use:** `superpowers:executing-plans`

**Which approach do you prefer?**