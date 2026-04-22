-- =============================================
-- Notification System Tables
-- =============================================

-- Table: notification_logs
-- Purpose: Audit trail of all sent notifications
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  permit_id UUID REFERENCES permits(id) NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('expiry_30d', 'expiry_15d', 'expiry_7d')),
  sent_at TIMESTAMP DEFAULT NOW(),
  email_status TEXT NOT NULL CHECK (email_status IN ('sent', 'failed', 'bounced')),
  error_message TEXT,
  resend_message_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_notification_logs_user_permit
  ON notification_logs(user_id, permit_id, notification_type);
CREATE INDEX idx_notification_logs_sent_at
  ON notification_logs(sent_at);

-- Comments
COMMENT ON TABLE notification_logs IS 'Audit trail of email notifications sent to users';
COMMENT ON COLUMN notification_logs.notification_type IS 'Type of alert: expiry_30d, expiry_15d, expiry_7d';
COMMENT ON COLUMN notification_logs.email_status IS 'Delivery status from Resend API';
COMMENT ON COLUMN notification_logs.resend_message_id IS 'Message ID from Resend for tracking';
