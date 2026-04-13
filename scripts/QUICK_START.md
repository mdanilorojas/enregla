# Quick Start: Seed Demo Data

## TL;DR - Fastest Path

### 1. Create Demo User (2 minutes)

**Via Supabase Dashboard:**
1. Go to https://supabase.com/dashboard/project/zqaqhapxqwkvninnyqiu/auth/users
2. Click "Add user" → "Create new user"
3. Email: `demo@supermaxi.com`
4. Password: `Demo2026!`
5. Auto-confirm email: ✅ Yes
6. Click "Create user"
7. **Copy the UUID** (you'll need it in Step 3)

### 2. Run TypeScript Seed (30 seconds)

```bash
# In project root
npx tsx scripts/seed-demo.ts
```

This creates:
- ✅ Supermaxi Ecuador company
- ✅ 3 locations (El Bosque, Mall del Sol, Norte)
- ✅ 12 permits (4 per location)
- ✅ 1 public link (Mall del Sol)

### 3. Link User Profile (30 seconds)

The script will warn you if profile doesn't exist. Link it manually:

```sql
-- Run in Supabase SQL Editor
INSERT INTO profiles (id, company_id, full_name, role, is_active)
VALUES (
  'PASTE_USER_UUID_HERE',  -- From Step 1
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Demo User',
  'admin',
  true
);
```

### 4. Test Login

```bash
npm run dev
# Navigate to http://localhost:5173
# Login: demo@supermaxi.com / Demo2026!
```

**Expected Dashboard:**
- 🟢 Supermaxi El Bosque (bajo) - all good
- 🟡 Supermaxi Mall del Sol (medio) - 1 warning
- 🔴 Supermaxi Norte (alto) - 2 critical issues

### 5. Test Public Link (no auth needed)

Visit: http://localhost:5173/public/demo-mall-del-sol-2026

Should show Mall del Sol permits without login.

---

## Done! 🎉

Total time: ~3 minutes

Need more details? See [README.md](./README.md)

---

## Troubleshooting

**"User already exists"**
```bash
# Just get the existing user's UUID from Dashboard
# Then run Step 3
```

**"Profile already exists"**
```sql
-- Delete and recreate
DELETE FROM profiles WHERE id = 'USER_UUID';
-- Then run Step 3 again
```

**"Cannot login"**
```sql
-- Check user and profile
SELECT u.email, p.full_name, p.role, p.is_active
FROM auth.users u
JOIN profiles p ON p.id = u.id
WHERE u.email = 'demo@supermaxi.com';
```

If no results, profile is missing - run Step 3.

**"Seed script fails"**
```bash
# Clear existing data first
npx tsx scripts/seed-demo.ts
# Should auto-clear on start
```

---

## Alternative: SQL-Only Method

If you prefer SQL over TypeScript:

```bash
# 1. Create user in Dashboard (Step 1 above)

# 2. Edit supabase/seed.sql
#    - Replace 'DEMO_USER_AUTH_ID' with actual UUID
#    - Uncomment the profiles INSERT at bottom

# 3. Run seed
psql $DATABASE_URL -f supabase/seed.sql
```

---

## Data Reference

**Fixed UUIDs for testing:**
- Company: `f47ac10b-58cc-4372-a567-0e02b2c3d479`
- El Bosque: `550e8400-e29b-41d4-a716-446655440001`
- Mall del Sol: `550e8400-e29b-41d4-a716-446655440002`
- Norte: `550e8400-e29b-41d4-a716-446655440003`

**Public Link Token:**
```
demo-mall-del-sol-2026
```

**Test URLs:**
```
App:    http://localhost:5173
Login:  demo@supermaxi.com / Demo2026!
Public: http://localhost:5173/public/demo-mall-del-sol-2026
API:    https://zqaqhapxqwkvninnyqiu.supabase.co/rest/v1/rpc/get_public_permits?link_token=demo-mall-del-sol-2026
```
