import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  getExpiringPermits,
  getCompanyUsers,
  getUserPreferences,
  getCompanyName,
  logNotification,
} from './queries.ts';
import { sendEmailsBatch } from './email-service.ts';
import type { SendResult, UserAlerts, PermitAlert } from './types.ts';

console.log('[send-expiry-alerts] Function initialized');

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    console.log('[send-expiry-alerts] Starting notification process');

    // Step 1: Get all expiring permits
    const expiringPermits = await getExpiringPermits();
    console.log(`[send-expiry-alerts] Found ${expiringPermits.length} expiring permits`);

    if (expiringPermits.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No permits expiring today', sent: 0, failed: 0, skipped: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Group permits by company
    const permitsByCompany = expiringPermits.reduce((acc, permit) => {
      if (!acc[permit.company_id]) {
        acc[permit.company_id] = [];
      }
      acc[permit.company_id].push(permit);
      return acc;
    }, {} as Record<string, PermitAlert[]>);

    const companyIds = Object.keys(permitsByCompany);
    console.log(`[send-expiry-alerts] Processing ${companyIds.length} companies`);

    // Step 3: Build user alerts list
    const userAlertsList: UserAlerts[] = [];

    for (const companyId of companyIds) {
      const companyPermits = permitsByCompany[companyId];

      // Get company users
      const users = await getCompanyUsers(companyId);
      if (users.length === 0) {
        console.warn(`[send-expiry-alerts] No users found for company ${companyId}`);
        continue;
      }

      // Get user preferences
      const userIds = users.map(u => u.user_id);
      const preferences = await getUserPreferences(userIds);
      const prefsMap = new Map(preferences.map(p => [p.user_id, p]));

      // Get company name
      const companyName = await getCompanyName(companyId);

      // Filter users with notifications enabled
      const enabledUsers = users.filter(user => {
        const prefs = prefsMap.get(user.user_id);
        return prefs?.email_enabled && prefs?.expiry_alerts_enabled;
      });

      console.log(`[send-expiry-alerts] Company ${companyId}: ${enabledUsers.length}/${users.length} users have notifications enabled`);

      // Create UserAlerts for each enabled user
      for (const user of enabledUsers) {
        const prefs = prefsMap.get(user.user_id)!;
        userAlertsList.push({
          user,
          preferences: prefs,
          company_name: companyName,
          alerts: companyPermits,
        });
      }
    }

    console.log(`[send-expiry-alerts] Sending emails to ${userAlertsList.length} users`);

    // Step 4: Send emails
    const emailResults = await sendEmailsBatch(userAlertsList);

    // Step 5: Log results
    const result: SendResult = {
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    for (const emailResult of emailResults) {
      const userAlerts = userAlertsList.find(ua => ua.user.user_id === emailResult.user_id)!;

      if (emailResult.success) {
        result.sent++;

        // Log each permit notification
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
        result.errors.push({
          user_id: emailResult.user_id,
          error: emailResult.error || 'Unknown error',
        });

        // Log failure
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

    console.log(`[send-expiry-alerts] Process complete: ${result.sent} sent, ${result.failed} failed`);

    return new Response(
      JSON.stringify(result),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('[send-expiry-alerts] Fatal error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
