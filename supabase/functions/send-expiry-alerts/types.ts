/**
 * Core types for email notification system
 */

export interface PermitAlert {
  permit_id: string;
  type: string;
  expiry_date: string;
  location_name: string;
  notification_type: 'expiry_30d' | 'expiry_15d' | 'expiry_7d';
  company_id: string;
}

export interface UserProfile {
  user_id: string;
  email: string;
  full_name: string | null;
  company_id: string;
}

export interface NotificationPreferences {
  user_id: string;
  email_enabled: boolean;
  expiry_alerts_enabled: boolean;
}

export interface UserAlerts {
  user: UserProfile;
  preferences: NotificationPreferences;
  company_name: string;
  alerts: PermitAlert[];
}

export interface EmailSendResult {
  user_id: string;
  success: boolean;
  resend_message_id?: string;
  error?: string;
}

export interface SendResult {
  sent: number;
  failed: number;
  skipped: number;
  errors: Array<{user_id: string, error: string}>;
}

export interface NotificationLog {
  user_id: string;
  permit_id: string;
  notification_type: 'expiry_30d' | 'expiry_15d' | 'expiry_7d';
  email_status: 'sent' | 'failed' | 'bounced';
  error_message?: string;
  resend_message_id?: string;
}
