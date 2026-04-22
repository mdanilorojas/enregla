-- Fix notification_preferences trigger to use SECURITY DEFINER
-- This allows the trigger to bypass RLS policies during user creation

CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.create_default_notification_preferences() IS 
'Auto-creates notification preferences for new users. Uses SECURITY DEFINER to bypass RLS during auth.users INSERT trigger.';
