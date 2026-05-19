-- Bug fix: 20260513000006_advisor_hardening revoked anon EXECUTE on
-- user_company_id() and user_role(), but RLS policies on companies, profiles
-- and notification_logs still call those functions. Postgres evaluates them
-- regardless of OR short-circuit order, so anon (demo mode) hits
-- "permission denied for function user_company_id".
--
-- Re-grant EXECUTE to anon. The advisor warning was that these functions are
-- exposed via /rest/v1/rpc/*; that's still true, but they only return the
-- caller's own company_id/role (NULL for anon), which is not sensitive.

GRANT EXECUTE ON FUNCTION public.user_company_id() TO anon;
GRANT EXECUTE ON FUNCTION public.user_role() TO anon;
