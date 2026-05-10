import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { PermitAlert, UserProfile, NotificationPreferences, NotificationLog } from './types.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Cache for auth email lookups — built once per function invocation.
let emailMapCache: Map<string, string> | null = null;

async function getEmailMap(): Promise<Map<string, string>> {
  if (emailMapCache) return emailMapCache;
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) {
    console.error('[queries] listUsers failed');
    throw new Error(`Auth error: ${error.message}`);
  }
  emailMapCache = new Map(data.users.map(u => [u.id, u.email ?? '']));
  return emailMapCache;
}

export async function getExpiringPermits(): Promise<PermitAlert[]> {
  const { data, error } = await supabase.rpc('get_expiring_permits');
  if (error) {
    console.error('[queries] get_expiring_permits failed');
    throw new Error(`Database error: ${error.message}`);
  }
  return data || [];
}

export async function getCompanyUsers(companyId: string): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, company_id')
    .eq('company_id', companyId)
    .eq('is_active', true);

  if (error) {
    console.error(`[queries] getCompanyUsers failed for ${companyId}`);
    throw new Error(`Database error: ${error.message}`);
  }

  if (!data || data.length === 0) return [];

  const emailMap = await getEmailMap();

  return data.map(row => ({
    user_id: row.id,
    email: emailMap.get(row.id) || '',
    full_name: row.full_name,
    company_id: row.company_id,
  }));
}

export async function getUserPreferences(userIds: string[]): Promise<NotificationPreferences[]> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('user_id, email_enabled, expiry_alerts_enabled')
    .in('user_id', userIds);

  if (error) {
    console.error('[queries] getUserPreferences failed');
    throw new Error(`Database error: ${error.message}`);
  }
  return data || [];
}

export async function getCompanyName(companyId: string): Promise<string> {
  const { data, error } = await supabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .maybeSingle();

  if (error) {
    console.error(`[queries] getCompanyName failed for ${companyId}`);
    return 'Tu empresa';
  }
  return data?.name || 'Tu empresa';
}

/**
 * Returns notification_logs entries already inserted today for any of the given users+permits.
 * Used to short-circuit duplicate sends when the cron runs more than once per day.
 */
export async function getAlreadySentLogsToday(
  userIds: string[],
  permitIds: string[],
): Promise<Array<{ user_id: string; permit_id: string; notification_type: string }>> {
  if (userIds.length === 0 || permitIds.length === 0) return [];
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('notification_logs')
    .select('user_id, permit_id, notification_type')
    .in('user_id', userIds)
    .in('permit_id', permitIds)
    .gte('sent_at', startOfDay.toISOString());

  if (error) {
    console.error('[queries] getAlreadySentLogsToday failed');
    return [];
  }
  return data || [];
}

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

  if (error && error.code !== '23505') {
    // 23505 = unique_violation, which is expected when the unique index catches a duplicate.
    console.error('[queries] logNotification failed:', error.code);
  }
}
