-- =============================================
-- Enable pg_cron Extension
-- Purpose: Schedule daily email notifications
-- Note: Cron jobs must be created via Supabase Dashboard SQL Editor
--       See: docs/superpowers/specs/2026-04-22-email-notifications-design.md §8.1
-- =============================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Comment
COMMENT ON EXTENSION pg_cron IS 'Cron-based job scheduler for PostgreSQL';

-- Verification (run after migration):
-- SELECT * FROM pg_extension WHERE extname = 'pg_cron';
-- Expected: 1 row returned
