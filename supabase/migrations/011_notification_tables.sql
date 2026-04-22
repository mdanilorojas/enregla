-- =============================================
-- Notification System Tables
-- =============================================

-- Table: notification_logs
-- Purpose: Audit trail of all sent notifications
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  permit_id UUID REFERENCES permits(id) NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('expiry_30d', 'expiry_15d', 'expiry_7d')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  email_status TEXT NOT NULL CHECK (email_status IN ('sent', 'failed', 'bounced')),
  error_message TEXT,
  resend_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read logs for their own company's permits
CREATE POLICY "Users can read own company notification logs"
ON notification_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM permits
    WHERE permits.id = notification_logs.permit_id
    AND permits.company_id = public.user_company_id()
  )
);

-- Note: INSERT policy not needed - only system/background jobs should write to this table

-- Indexes for performance
CREATE INDEX idx_notification_logs_user_permit
  ON notification_logs(user_id, permit_id, notification_type);
CREATE INDEX idx_notification_logs_sent_at
  ON notification_logs(sent_at);

-- Partial index for failed notifications monitoring
CREATE INDEX idx_notification_logs_failed
  ON notification_logs(email_status, sent_at)
  WHERE email_status IN ('failed', 'bounced');

-- Comments
COMMENT ON TABLE notification_logs IS 'Audit trail of email notifications sent to users';
COMMENT ON COLUMN notification_logs.notification_type IS 'Type of alert: expiry_30d, expiry_15d, expiry_7d';
COMMENT ON COLUMN notification_logs.email_status IS 'Delivery status from Resend API';
COMMENT ON COLUMN notification_logs.resend_message_id IS 'Message ID from Resend for tracking';

-- =============================================
-- Table: notification_preferences
-- Purpose: User preferences for email notifications
-- =============================================
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  email_enabled BOOLEAN DEFAULT TRUE,
  digest_enabled BOOLEAN DEFAULT TRUE,
  expiry_alerts_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookup
CREATE INDEX idx_notification_preferences_user
  ON notification_preferences(user_id);

-- Enable Row Level Security
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read/update their own preferences
CREATE POLICY "Users can manage own notification preferences"
ON notification_preferences FOR ALL
USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE notification_preferences IS 'User notification preferences';
COMMENT ON COLUMN notification_preferences.email_enabled IS 'Global toggle for all email notifications';
COMMENT ON COLUMN notification_preferences.expiry_alerts_enabled IS 'Toggle for permit expiry alerts';
COMMENT ON COLUMN notification_preferences.digest_enabled IS 'Toggle for weekly digest (Phase 3)';

-- =============================================
-- Trigger: Auto-create preferences for new users
-- =============================================
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

COMMENT ON FUNCTION create_default_notification_preferences() IS 'Auto-creates notification preferences when user signs up';
