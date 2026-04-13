# Seed Data Testing Checklist

Use this checklist to verify the seed data is working correctly before the demo.

## Pre-Flight Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Demo User in Supabase

**Method A: Supabase Dashboard (Recommended)**
1. Go to: https://supabase.com/dashboard/project/zqaqhapxqwkvninnyqiu/auth/users
2. Click "Add user" → "Create new user"
3. Fill in:
   - Email: `demo@supermaxi.com`
   - Password: `Demo2026!`
   - Auto-confirm email: ✅ **Yes**
4. Click "Create user"
5. **Copy the user UUID** (you'll need it)

**Method B: Supabase CLI**
```bash
supabase auth signup --email demo@supermaxi.com --password Demo2026!
```

### 3. Run Seed Script
```bash
npm run seed
```

Expected output:
```
🌱 Starting PermitOps V1 Demo Seed Script

🧹 Clearing existing demo data...
✅ Existing data cleared

📦 Seeding company...
✅ Company created: Supermaxi Ecuador
📍 Seeding locations...
✅ Created 3 locations
📋 Seeding permits...
✅ Created 12 permits
🔗 Seeding public link...
✅ Public link created: demo-mall-del-sol-2026

👤 Checking for demo user...
✅ Demo user exists: demo@supermaxi.com

✨ Seed completed successfully!
```

### 4. Link User Profile

If the seed script shows "⚠️ Demo user not found", manually link the profile:

```sql
-- Run in Supabase SQL Editor
INSERT INTO profiles (id, company_id, full_name, role, is_active)
VALUES (
  'YOUR_USER_UUID_HERE',  -- Replace with UUID from Step 2
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Demo User',
  'admin',
  true
);
```

---

## Testing Checklist

### ✅ Database Verification

Run these queries in Supabase SQL Editor:

**1. Verify Company**
```sql
SELECT name, business_type, city, location_count, regulatory_factors
FROM companies
WHERE id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
```
Expected: 1 row - Supermaxi Ecuador, Retail, Quito, 3 locations

**2. Verify Locations**
```sql
SELECT name, status, risk_level
FROM locations
WHERE company_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
ORDER BY name;
```
Expected: 3 rows
- Supermaxi El Bosque | operando | bajo
- Supermaxi Mall del Sol | operando | medio
- Supermaxi Norte | operando | alto

**3. Verify Permits**
```sql
SELECT
  l.name AS location,
  p.type,
  p.status,
  p.expiry_date
FROM permits p
JOIN locations l ON p.location_id = l.id
WHERE p.company_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  AND p.is_active = true
ORDER BY l.name, p.type;
```
Expected: 12 rows (4 per location)

**4. Verify Public Link**
```sql
SELECT token, label, is_active, view_count, last_viewed_at
FROM public_links
WHERE token = 'demo-mall-del-sol-2026';
```
Expected: 1 row, is_active = true, view_count = 3

**5. Verify Demo User Profile**
```sql
SELECT
  u.email,
  p.full_name,
  p.role,
  p.is_active,
  c.name AS company_name
FROM auth.users u
JOIN profiles p ON p.id = u.id
JOIN companies c ON c.id = p.company_id
WHERE u.email = 'demo@supermaxi.com';
```
Expected: 1 row - demo@supermaxi.com, Demo User, admin, Supermaxi Ecuador

---

### ✅ Login Flow

**Test 1: Login with Demo Credentials**
```bash
npm run dev
# Navigate to http://localhost:5173
```

1. ⬜ Login page loads
2. ⬜ Enter email: `demo@supermaxi.com`
3. ⬜ Enter password: `Demo2026!`
4. ⬜ Click "Iniciar Sesión"
5. ⬜ Redirects to dashboard (or onboarding if first time)

**Expected:** Successful login, no errors in console

---

### ✅ Dashboard Display

After login, verify dashboard shows:

**Header**
- ⬜ Company name: "Supermaxi Ecuador"
- ⬜ User name: "Demo User"
- ⬜ Logout button visible

**Location Cards (should show 3)**

**Card 1: Supermaxi El Bosque**
- ⬜ Name: "Supermaxi El Bosque"
- ⬜ Address: "Av. Eloy Alfaro N39-123, Quito"
- ⬜ Status: "Operando"
- ⬜ Risk badge: **BAJO** (green)
- ⬜ Permit count: 4
- ⬜ No alerts or warnings

**Card 2: Supermaxi Mall del Sol**
- ⬜ Name: "Supermaxi Mall del Sol"
- ⬜ Address: "Av. Naciones Unidas 234, Quito"
- ⬜ Status: "Operando"
- ⬜ Risk badge: **MEDIO** (yellow/orange)
- ⬜ Permit count: 4
- ⬜ Shows 1 warning/alert (permit expiring soon)

**Card 3: Supermaxi Norte**
- ⬜ Name: "Supermaxi Norte"
- ⬜ Address: "Av. 6 de Diciembre N35-45, Quito"
- ⬜ Status: "Operando"
- ⬜ Risk badge: **ALTO** (red)
- ⬜ Permit count: 4
- ⬜ Shows 2 critical alerts (vencido + no_registrado)

---

### ✅ Location Detail Views

Click on each location card to view details:

**El Bosque Detail Page**
- ⬜ Shows 4 permits in table
- ⬜ All permits have status "vigente" (green)
- ⬜ No warnings or alerts
- ⬜ All expiry dates in future
- ⬜ Permit types: Patente Municipal, RUC, Permiso Sanitario (ARCSA), Permiso de Alcohol (SCPM)

**Mall del Sol Detail Page**
- ⬜ Shows 4 permits in table
- ⬜ 3 permits "vigente" (green)
- ⬜ 1 permit "por_vencer" (yellow) - Permiso de Alcohol
- ⬜ Alert banner shows expiration warning (15 days)
- ⬜ Public link indicator/button visible

**Norte Detail Page**
- ⬜ Shows 4 permits in table
- ⬜ 2 permits "vigente" (green)
- ⬜ 1 permit "vencido" (red) - Permiso Sanitario
- ⬜ 1 permit "no_registrado" (gray) - Permiso de Alcohol
- ⬜ Multiple alert banners showing critical issues

---

### ✅ Public Link (No Authentication)

**Test 1: Direct API Call**
```bash
curl "https://zqaqhapxqwkvninnyqiu.supabase.co/rest/v1/rpc/get_public_permits?link_token=demo-mall-del-sol-2026" \
  -H "apikey: YOUR_ANON_KEY"
```

Expected:
- ⬜ Returns JSON array
- ⬜ Shows only vigente permits (3 out of 4)
- ⬜ No authentication required
- ⬜ Includes location name and address

**Test 2: App Public View (if implemented)**
```
http://localhost:5173/public/demo-mall-del-sol-2026
```

Expected:
- ⬜ Page loads without login
- ⬜ Shows "Supermaxi Mall del Sol" header
- ⬜ Shows only vigente permits (hides por_vencer)
- ⬜ Clean, inspector-friendly layout
- ⬜ View count increments (check database)

**Test 3: Verify View Count Increments**
```sql
SELECT view_count, last_viewed_at
FROM public_links
WHERE token = 'demo-mall-del-sol-2026';
```

Expected:
- ⬜ view_count increased after accessing public link
- ⬜ last_viewed_at timestamp updated

---

### ✅ Permit Details

For each location, verify permit details are correct:

**El Bosque Permits**
- ⬜ PM-2026-EB-001234 | Patente Municipal | vigente | 2026-12-31
- ⬜ 1791234567001 | RUC | vigente | 2030-03-10
- ⬜ ARCSA-2026-EB-45678 | Permiso Sanitario | vigente | 2027-01-31
- ⬜ SCPM-2026-EB-89012 | Permiso de Alcohol | vigente | 2026-12-31

**Mall del Sol Permits**
- ⬜ PM-2026-MS-002345 | Patente Municipal | vigente | 2026-12-31
- ⬜ 1791234567001 | RUC | vigente | 2030-03-10
- ⬜ ARCSA-2026-MS-56789 | Permiso Sanitario | vigente | 2027-01-24
- ⬜ SCPM-2025-MS-78901 | Permiso de Alcohol | **por_vencer** | ~15 days from now

**Norte Permits**
- ⬜ PM-2026-NT-003456 | Patente Municipal | vigente | 2026-12-31
- ⬜ 1791234567001 | RUC | vigente | 2030-03-10
- ⬜ ARCSA-2025-NT-67890 | Permiso Sanitario | **vencido** | ~10 days ago
- ⬜ NULL | Permiso de Alcohol | **no_registrado** | NULL

---

### ✅ Regulatory Factors

**Verify Permit Types Match Regulatory Factors**

Company regulatory_factors:
```json
{
  "alimentos": true,
  "alcohol": true,
  "salud": false,
  "quimicos": false
}
```

Expected permits at each location:
- ⬜ Patente Municipal (always required)
- ⬜ RUC (always required)
- ⬜ Permiso Sanitario ARCSA (because alimentos = true)
- ⬜ Permiso de Alcohol SCPM (because alcohol = true)
- ⬜ NO health permits (salud = false)
- ⬜ NO chemical permits (quimicos = false)

---

## Common Issues & Fixes

### Issue: "Cannot login"
**Cause:** Profile not linked to auth user

**Fix:**
```sql
-- Check if profile exists
SELECT * FROM profiles WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'demo@supermaxi.com'
);

-- If no results, create profile (see Step 4 above)
```

### Issue: "No locations showing"
**Cause:** Seed data not inserted or RLS blocking access

**Fix:**
```bash
# Re-run seed
npm run seed

# Check RLS policies allow user access
```

### Issue: "Public link returns 401"
**Cause:** RLS policy blocking public access

**Fix:**
```sql
-- Verify SECURITY DEFINER function exists
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_name = 'get_public_permits';

-- Should show: DEFINER
```

### Issue: "Permits have wrong status"
**Cause:** Dates calculated incorrectly

**Fix:**
```sql
-- Check current dates vs expiry dates
SELECT type, status, expiry_date, (expiry_date < CURRENT_DATE) as is_expired
FROM permits
WHERE company_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
ORDER BY location_id, type;
```

---

## Reset & Re-Seed

If you need to start fresh:

```bash
# Clear all demo data
npm run seed

# Or manually clear:
# DELETE FROM public_links WHERE company_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
# DELETE FROM permits WHERE company_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
# DELETE FROM locations WHERE company_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
# DELETE FROM profiles WHERE company_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
# DELETE FROM companies WHERE id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

# Re-run seed
npm run seed
```

---

## Final Demo Checklist

Before presenting:

- ⬜ All 12 tests in this checklist pass
- ⬜ Login takes < 2 seconds
- ⬜ Dashboard loads instantly
- ⬜ 3 location cards visible with correct risk levels
- ⬜ Public link accessible without auth
- ⬜ No console errors
- ⬜ All dates are realistic (not in past unless intentional)
- ⬜ Notes and alerts display correctly
- ⬜ Risk level colors match severity (green/yellow/red)

---

## Success Criteria

✅ **PASS:** All items checked
⚠️ **PARTIAL:** 80%+ items checked, minor issues documented
❌ **FAIL:** <80% checked or critical issues present

---

**Last Updated:** 2026-04-13
**Demo Ready:** [ ] Yes [ ] No
**Blocker Issues:** _____________________________________________
