-- SECURITY DEFINER functions ejecutables por anon/authenticated via /rest/v1/rpc/*.
-- Solo get_public_permits y increment_public_link_view deben ser ejecutables
-- por anon (página pública /p/:token). user_company_id/user_role dejan de ser
-- llamables como RPC pero siguen accesibles para policies (via GRANT a authenticated).

REVOKE EXECUTE ON FUNCTION public.user_company_id() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.user_role() FROM anon, public;

-- Authenticated mantiene EXECUTE porque las policies RLS (companies_select,
-- profiles_select, notification_logs) evalúan user_company_id() con el rol
-- del caller, no del owner. Sin este GRANT las queries normales rompen.
GRANT EXECUTE ON FUNCTION public.user_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_role() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_public_permits(text) FROM authenticated, public;
REVOKE EXECUTE ON FUNCTION public.increment_public_link_view(text) FROM authenticated, public;
GRANT EXECUTE ON FUNCTION public.get_public_permits(text) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_public_link_view(text) TO anon;
