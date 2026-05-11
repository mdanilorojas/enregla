-- Fix: user_company_id() must be callable by anon and authenticated because
-- profiles_select and companies_select reference it. The SECURITY DEFINER
-- lockdown migration revoked it too broadly, breaking the demo-mode flow
-- (anon got a 403 when reading the demo profile, because the policy
-- crashed trying to call the function).
--
-- The function is SECURITY DEFINER and returns only the *caller's own*
-- company_id (via auth.uid()). For anon callers auth.uid() is null and
-- the function returns null — safe to expose.

GRANT EXECUTE ON FUNCTION public.user_company_id() TO anon, authenticated;
