# PermitOps V1 Seed Scripts

This directory contains seed scripts for populating the database with demo data.

## Demo Data Overview

**Company:** Supermaxi Ecuador (Retail - Supermarket chain)
- 3 locations in Quito
- 12 permits total (4 per location)
- 1 public verification link

**Demo User Credentials:**
- Email: `demo@supermaxi.com`
- Password: `Demo2026!`
- Role: Admin

## Locations

### 1. Supermaxi El Bosque (Risk: Bajo ✅)
- Address: Av. Eloy Alfaro N39-123, Quito
- Status: All 4 permits vigente
- All compliance OK

### 2. Supermaxi Mall del Sol (Risk: Medio ⚠️)
- Address: Av. Naciones Unidas 234, Quito
- Status: 3 vigente, 1 por vencer (expires in 15 days)
- Has active public link for inspectors

### 3. Supermaxi Norte (Risk: Alto 🔴)
- Address: Av. 6 de Diciembre N35-45, Quito
- Status: 2 vigente, 1 vencido, 1 no_registrado
- Multiple compliance issues

## Permit Types (4 per location)

1. **Patente Municipal** - Municipal business license
2. **RUC** - Tax registration number (SRI)
3. **Permiso Sanitario (ARCSA)** - Health permit (food handling)
4. **Permiso de Alcohol (SCPM)** - Alcohol sales permit

## Usage

### Option 1: SQL Seed (Recommended for Production)

**Step 1: Create Demo User in Supabase Dashboard**
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Email: `demo@supermaxi.com`
4. Password: `Demo2026!`
5. Confirm email automatically
6. Copy the user's UUID

**Step 2: Apply SQL Seed**

Using Supabase CLI:
```bash
cd supabase
supabase db reset  # WARNING: Clears all data
# OR apply just the seed:
psql $DATABASE_URL -f seed.sql
```

Using Management API:
```bash
# Read and execute seed.sql via Supabase API
curl -X POST "https://api.supabase.com/v1/projects/zqaqhapxqwkvninnyqiu/database/query" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  --data-binary @supabase/seed.sql
```

**Step 3: Link Demo User Profile**

Edit `supabase/seed.sql` and uncomment the profile INSERT at the bottom:
```sql
INSERT INTO profiles (id, company_id, full_name, role, is_active)
VALUES (
  'YOUR_USER_UUID_HERE',  -- Replace with actual UUID from Step 1
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Demo User',
  'admin',
  true
);
```

### Option 2: TypeScript Seed (Recommended for Development)

**Prerequisites:**
```bash
npm install @supabase/supabase-js tsx
```

**Environment Setup:**
Create `.env` file:
```env
VITE_SUPABASE_URL=https://zqaqhapxqwkvninnyqiu.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
# OR for full access (create user + profile):
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Run Seed:**
```bash
npx tsx scripts/seed-demo.ts
```

**Note:** The TypeScript seed will:
- Clear existing demo data
- Create company, locations, permits, public link
- Check for demo user (if service role key provided)
- Create user profile if user exists

**Create Demo User Manually (if needed):**
```bash
# Using Supabase CLI
supabase auth signup --email demo@supermaxi.com --password Demo2026!

# Or via Dashboard (see Option 1)
```

## Testing the Seed

### 1. Test Login
```bash
# Start dev server
npm run dev

# Navigate to http://localhost:5173
# Login with: demo@supermaxi.com / Demo2026!
```

Expected results:
- Login successful
- Dashboard shows 3 location cards
- El Bosque: Green badge (bajo risk)
- Mall del Sol: Yellow badge (medio risk, 1 alert)
- Norte: Red badge (alto risk, 2 issues)

### 2. Test Public Link

**Public verification URL:**
```
https://zqaqhapxqwkvninnyqiu.supabase.co/rest/v1/rpc/get_public_permits?link_token=demo-mall-del-sol-2026
```

Or in your app:
```
http://localhost:5173/public/demo-mall-del-sol-2026
```

Expected results:
- No authentication required
- Shows Mall del Sol location info
- Shows only vigente permits (3 out of 4)
- View count increments on each access

### 3. Verify Database

```sql
-- Check company
SELECT * FROM companies WHERE id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- Check locations (should be 3)
SELECT name, risk_level FROM locations 
WHERE company_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- Check permits (should be 12)
SELECT l.name, p.type, p.status 
FROM permits p
JOIN locations l ON p.location_id = l.id
WHERE p.company_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
ORDER BY l.name, p.type;

-- Check public link
SELECT * FROM public_links 
WHERE token = 'demo-mall-del-sol-2026';

-- Check demo user profile
SELECT p.*, u.email 
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'demo@supermaxi.com';
```

## Demo Scenarios

### Scenario 1: All Good (El Bosque)
- All 4 permits are vigente
- No alerts or warnings
- Risk level: bajo
- Green status indicators

### Scenario 2: Warning (Mall del Sol)
- 3 permits vigente
- 1 permit por_vencer (expires in 15 days)
- Risk level: medio
- Yellow status with 1 alert
- Public link active for inspectors

### Scenario 3: Critical Issues (Norte)
- 2 permits vigente
- 1 permit vencido (expired 10 days ago)
- 1 permit no_registrado (missing)
- Risk level: alto
- Red status with multiple alerts

## Troubleshooting

### Issue: "Profile already exists"
```sql
-- Delete existing profile
DELETE FROM profiles WHERE id = 'USER_UUID';
-- Then re-run seed
```

### Issue: "Foreign key violation"
```sql
-- Clear all data and start fresh
DELETE FROM public_links WHERE company_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
DELETE FROM permits WHERE company_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
DELETE FROM locations WHERE company_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
DELETE FROM profiles WHERE company_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
DELETE FROM companies WHERE id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
```

### Issue: "Cannot login with demo user"
Check that:
1. User exists in auth.users
2. Email is confirmed
3. Profile exists and is_active = true
4. Profile.company_id matches company ID

### Issue: "Public link not working"
Check that:
1. Token is correct: `demo-mall-del-sol-2026`
2. Link is_active = true
3. RLS policies allow public access to `get_public_permits()` function

## Data IDs Reference

For debugging and testing:

```typescript
COMPANY_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

LOCATION_IDS = {
  el_bosque:    '550e8400-e29b-41d4-a716-446655440001',
  mall_del_sol: '550e8400-e29b-41d4-a716-446655440002',
  norte:        '550e8400-e29b-41d4-a716-446655440003',
}

PUBLIC_LINK_TOKEN = 'demo-mall-del-sol-2026'
```

## Next Steps

After seeding:
1. ✅ Login with demo credentials
2. ✅ Verify dashboard displays correctly
3. ✅ Test public link access (no auth)
4. ✅ Verify risk levels and alerts
5. ✅ Proceed to Task 10: Dashboard Metrics

## Support

Issues? Check:
- Supabase logs in Dashboard
- Browser console for errors
- RLS policies are enabled
- Migration files applied correctly
