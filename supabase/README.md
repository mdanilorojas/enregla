# PermitOps V1 - Supabase Setup

This directory contains database migrations, RLS policies, and seed data for the PermitOps V1 demo application.

## Project Configuration

**Supabase Project:** fiyamttuuubjwhrbucxd
**Dashboard:** https://supabase.com/dashboard/project/fiyamttuuubjwhrbucxd
**Region:** Configured
**Status:** Ready for migration execution

## Directory Structure

```
supabase/
├── migrations/
│   ├── 001_initial_schema.sql    # Core database schema with tables and indexes
│   └── 002_rls_policies.sql      # Row Level Security policies for multi-tenancy
├── seed.sql                       # Demo seed data (run after auth setup)
└── README.md                      # This file
```

## Migration Files

### 001_initial_schema.sql

Creates the core database schema:

- **UUID extension** for primary keys
- **Tables:**
  - `companies` - Client organizations
  - `locations` - Physical locations (sedes)
  - `permits` - Regulatory permits with versioning support
  - `documents` - Permit document attachments
  - `public_links` - Shareable public verification links
  - `profiles` - User profiles extending auth.users
- **Indexes** for query performance
- **Function:** `get_public_permits(link_token)` for public verification

**Key Features:**
- Permit versioning with `is_active`, `version`, `superseded_by` fields
- Cascade deletes to maintain referential integrity
- JSONB support for flexible metadata storage

### 002_rls_policies.sql

Implements Row Level Security for multi-tenant access control:

- **Helper functions:**
  - `auth.user_company_id()` - Get current user's company
  - `auth.user_role()` - Get current user's role
- **Policies per table** based on roles:
  - **Admin:** Full access to company data
  - **Operator:** Manage locations, permits, documents
  - **Viewer:** Read-only access

## Execution Instructions

### Step 1: Navigate to SQL Editor

1. Go to https://supabase.com/dashboard/project/fiyamttuuubjwhrbucxd
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Execute Initial Schema

1. Copy the entire contents of `migrations/001_initial_schema.sql`
2. Paste into the SQL Editor
3. Click **Run** (or press Ctrl+Enter)
4. Wait for completion (~5 seconds)
5. **Expected result:** "Success. No rows returned"

### Step 3: Verify Schema Creation

Run this verification query:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected tables:**
- companies
- documents
- locations
- permits
- profiles
- public_links

### Step 4: Execute RLS Policies

1. Create a new query in SQL Editor
2. Copy the entire contents of `migrations/002_rls_policies.sql`
3. Paste into the SQL Editor
4. Click **Run**
5. Wait for completion (~3 seconds)
6. **Expected result:** "Success. No rows returned"

### Step 5: Verify RLS Policies

Run this verification query:

```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected:** Multiple policies for each table (companies, locations, permits, documents, public_links, profiles)

### Step 6: Create Storage Bucket

1. Go to **Storage** in the left sidebar
2. Click **New bucket**
3. Name: `permit-documents`
4. **Public bucket:** OFF (keep private)
5. Click **Create bucket**

### Step 7: Configure Storage Policy

1. Click on the `permit-documents` bucket
2. Go to **Policies** tab
3. Click **New policy**
4. Select **For full customization**
5. Add policy:

**Policy name:** Authenticated users can upload and view documents

**Target roles:** `authenticated`

**Policy definition:**
```sql
(
  bucket_id = 'permit-documents' 
  AND auth.role() = 'authenticated'
)
```

**Allowed operations:** SELECT, INSERT

6. Click **Review** and **Save policy**

### Step 8: Verify Complete Setup

Run this comprehensive verification:

```sql
-- Check tables
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public';
-- Expected: 6

-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
-- Expected: All tables should have rowsecurity = true

-- Check functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;
-- Expected: get_public_permits

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY indexname;
-- Expected: 6+ indexes
```

## Database Schema Overview

### Companies Table
Multi-tenant isolation root. Each company is independent.

### Locations Table
Physical locations (sedes) belonging to a company.

### Permits Table
Regulatory permits with versioning:
- `is_active = TRUE` → Current version
- `is_active = FALSE` → Archived version
- `superseded_by` → Points to renewal

### Documents Table
File metadata stored in Supabase Storage bucket.

### Public Links Table
Shareable tokens for public verification without authentication.

### Profiles Table
Extends `auth.users` with company association and role.

## Security Model

**Row Level Security (RLS):** Enabled on all tables
**Multi-tenancy:** Enforced via `company_id` filtering
**Role-based access:** Admin > Operator > Viewer

## Next Steps

After successful migration execution:

1. ✅ Schema created
2. ✅ RLS policies active
3. ✅ Storage bucket configured
4. ⏳ Create demo users (Task 4)
5. ⏳ Create Supabase client (Task 2)
6. ⏳ Seed demo data (Task 9)

## Troubleshooting

**Error: "extension uuid-ossp does not exist"**
- Solution: Extensions are auto-enabled in Supabase. Refresh and retry.

**Error: "relation already exists"**
- Solution: Tables already created. Skip schema or drop tables first.

**Error: "permission denied for schema auth"**
- Solution: Helper functions use `SECURITY DEFINER`. This is expected and safe.

**RLS policies not working:**
- Solution: Ensure user has a profile with `company_id` set in `profiles` table.

## Environment Variables

Already configured in `.env.local`:

```bash
VITE_SUPABASE_URL=https://fiyamttuuubjwhrbucxd.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_5gBYF4ULCXW1JyHw2hbIiw_6g3KJa4i
```

## Resources

- [Supabase Dashboard](https://supabase.com/dashboard/project/fiyamttuuubjwhrbucxd)
- [Supabase Docs - Database](https://supabase.com/docs/guides/database)
- [Supabase Docs - RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Docs - Storage](https://supabase.com/docs/guides/storage)
