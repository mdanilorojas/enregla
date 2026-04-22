-- =============================================
-- Enable pg_cron Extension
-- Purpose: Schedule daily email notifications
-- =============================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant permissions to Supabase user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Comment
COMMENT ON EXTENSION pg_cron IS 'Cron-based job scheduler for PostgreSQL';
