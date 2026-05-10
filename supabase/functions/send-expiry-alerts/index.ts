import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  getExpiringPermits,
  getCompanyUsers,
  getUserPreferences,
  getCompanyName,
  logNotification,
  getAlreadySentLogsToday,
} from './queries.ts';
import { sendEmailsBatch } from './email-service.ts';
import type { SendResult, UserAlerts, PermitAlert } from './types.ts';

const CRON_SECRET = Deno.env.get('CRON_SECRET');
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'https://app.enregla.se';

function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, x-cron-secret',
    'Vary': 'Origin',
  };
}

serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405, headers: corsHeaders(origin) });
  }

  if (!CRON_SECRET) {
    console.error('[send-expiry-alerts] CRON_SECRET env var not set — refusing to run');
    return new Response('server misconfigured', { status: 500, headers: corsHeaders(origin) });
  }

  if (req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('unauthorized', { status: 401, headers: corsHeaders(origin) });
  }

  try {
    const expiringPermits = await getExpiringPermits();
    console.log(`[send-expiry-alerts] ${expiringPermits.length} expiring permits`);

    if (expiringPermits.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No permits expiring today', sent: 0, failed: 0, skipped: 0 }),
        { headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    const permitsByCompany = expiringPermits.reduce((acc, permit) => {
      (acc[permit.company_id] ??= []).push(permit);
      return acc;
    }, {} as Record<string, PermitAlert[]>);

    const companyIds = Object.keys(permitsByCompany);
    console.log(`[send-expiry-alerts] processing ${companyIds.length} companies`);

    const userAlertsList: UserAlerts[] = [];
    let skipped = 0;

    for (const companyId of companyIds) {
      const companyPermits = permitsByCompany[companyId];
      const users = await getCompanyUsers(companyId);
      if (users.length === 0) continue;

      const userIds = users.map(u => u.user_id);
      const preferences = await getUserPreferences(userIds);
      const prefsMap = new Map(preferences.map(p => [p.user_id, p]));
      const companyName = await getCompanyName(companyId);

      const enabledUsers = users.filter(user => {
        const prefs = prefsMap.get(user.user_id);
        return prefs?.email_enabled && prefs?.expiry_alerts_enabled;
      });

      // Idempotency guard: filter permits already logged today for each user
      const permitIds = companyPermits.map(p => p.permit_id);
      const alreadySent = await getAlreadySentLogsToday(userIds, permitIds);
      const sentKey = (u: string, p: string, t: string) => `${u}|${p}|${t}`;
      const sentSet = new Set(alreadySent.map(l => sentKey(l.user_id, l.permit_id, l.notification_type)));

      for (const user of enabledUsers) {
        const prefs = prefsMap.get(user.user_id)!;
        const userPermits = companyPermits.filter(p => !sentSet.has(sentKey(user.user_id, p.permit_id, p.notification_type)));
        skipped += companyPermits.length - userPermits.length;
        if (userPermits.length === 0) continue;

        userAlertsList.push({
          user,
          preferences: prefs,
          company_name: companyName,
          alerts: userPermits,
        });
      }
    }

    console.log(`[send-expiry-alerts] sending to ${userAlertsList.length} users (skipped ${skipped} already-sent alerts)`);

    const emailResults = await sendEmailsBatch(userAlertsList);

    const result: SendResult = { sent: 0, failed: 0, skipped, errors: [] };

    for (const emailResult of emailResults) {
      const userAlerts = userAlertsList.find(ua => ua.user.user_id === emailResult.user_id)!;

      if (emailResult.success) {
        result.sent++;
        for (const alert of userAlerts.alerts) {
          await logNotification({
            user_id: emailResult.user_id,
            permit_id: alert.permit_id,
            notification_type: alert.notification_type,
            email_status: 'sent',
            resend_message_id: emailResult.resend_message_id,
          });
        }
      } else {
        result.failed++;
        result.errors.push({ user_id: emailResult.user_id, error: emailResult.error || 'Unknown error' });
        for (const alert of userAlerts.alerts) {
          await logNotification({
            user_id: emailResult.user_id,
            permit_id: alert.permit_id,
            notification_type: alert.notification_type,
            email_status: 'failed',
            error_message: emailResult.error,
          });
        }
      }
    }

    console.log(`[send-expiry-alerts] done: ${result.sent} sent, ${result.failed} failed, ${result.skipped} skipped`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[send-expiry-alerts] fatal error:', error instanceof Error ? error.message : error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
