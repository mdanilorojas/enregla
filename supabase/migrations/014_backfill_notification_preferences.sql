-- =============================================
-- Backfill notification_preferences for Existing Users
-- Purpose: Ensure all existing users have preferences
-- =============================================

INSERT INTO notification_preferences (
  user_id,
  email_enabled,
  expiry_alerts_enabled,
  digest_enabled
)
SELECT
  id,
  true,
  true,
  true
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Log result
DO $$
DECLARE
  inserted_count INT;
BEGIN
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % users with default notification preferences', inserted_count;
END $$;
