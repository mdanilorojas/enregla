-- Check for duplicate profiles
SELECT id, email, COUNT(*) as count
FROM profiles
GROUP BY id, email
HAVING COUNT(*) > 1;

-- Show all profiles
SELECT id, email, company_id, full_name, role, created_at
FROM profiles
ORDER BY created_at DESC;
