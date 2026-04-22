import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { PermitAlert, UserProfile, NotificationPreferences, NotificationLog } from './types.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Get all permits expiring in 30, 15, or 7 days
 */
export async function getExpiringPermits(): Promise<PermitAlert[]> {
  const { data, error } = await supabase.rpc('get_expiring_permits');

  if (error) {
    console.error('[queries] Error fetching expiring permits:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all users for a specific company
 */
export async function getCompanyUsers(companyId: string): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, company_id')
    .eq('company_id', companyId)
    .eq('is_active', true);

  if (error) {
    console.error(`[queries] Error fetching users for company ${companyId}:`, error);
    throw new Error(`Database error: ${error.message}`);
  }

  return (data || []).map(row => ({
    user_id: row.id,
    email: row.email,
    full_name: row.full_name,
    company_id: row.company_id,
  }));
}

/**
 * Get notification preferences for specific users
 */
export async function getUserPreferences(userIds: string[]): Promise<NotificationPreferences[]> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('user_id, email_enabled, expiry_alerts_enabled')
    .in('user_id', userIds);

  if (error) {
    console.error('[queries] Error fetching user preferences:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  return data || [];
}

/**
 * Get company name by ID
 */
export async function getCompanyName(companyId: string): Promise<string> {
  const { data, error } = await supabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single();

  if (error) {
    console.error(`[queries] Error fetching company name for ${companyId}:`, error);
    return 'Tu empresa';
  }

  return data?.name || 'Tu empresa';
}

/**
 * Log notification send result
 */
export async function logNotification(log: NotificationLog): Promise<void> {
  const { error } = await supabase
    .from('notification_logs')
    .insert({
      user_id: log.user_id,
      permit_id: log.permit_id,
      notification_type: log.notification_type,
      email_status: log.email_status,
      error_message: log.error_message,
      resend_message_id: log.resend_message_id,
    });

  if (error) {
    console.error('[queries] Error logging notification:', error);
    // Don't throw - logging failure shouldn't stop the process
  }
}
