import { Resend } from 'https://esm.sh/resend@3.2.0';
import { render } from 'https://esm.sh/@react-email/components@0.0.14';
import { ExpiryAlertEmail } from './templates/expiry-alert.tsx';
import type { UserAlerts, EmailSendResult } from './types.ts';

const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
const appUrl = Deno.env.get('APP_URL') || 'https://app.enregla.ec';

const resend = new Resend(resendApiKey);

/**
 * Generate email subject line based on alert type
 */
function generateSubject(userAlerts: UserAlerts): string {
  const count = userAlerts.alerts.length;
  const type = userAlerts.alerts[0]?.notification_type || 'expiry_30d';
  const companyName = userAlerts.company_name;

  const subjectMap = {
    expiry_30d: `📅 ${count} permiso${count > 1 ? 's' : ''} vence${count > 1 ? 'n' : ''} próximamente - ${companyName}`,
    expiry_15d: `⚠️ ${count} permiso${count > 1 ? 's' : ''} vence${count > 1 ? 'n' : ''} en 2 semanas - ${companyName}`,
    expiry_7d: `🚨 URGENTE: ${count} permiso${count > 1 ? 's' : ''} vence${count > 1 ? 'n' : ''} en 7 días - ${companyName}`,
  };

  return subjectMap[type];
}

/**
 * Send expiry alert email to a user
 */
export async function sendExpiryAlertEmail(userAlerts: UserAlerts): Promise<EmailSendResult> {
  const { user, alerts, company_name } = userAlerts;

  console.log(`[email-service] Sending email to ${user.email} with ${alerts.length} alerts`);

  try {
    // Render email template
    const html = render(
      ExpiryAlertEmail({
        userName: user.full_name || 'Usuario',
        companyName: company_name,
        alerts: alerts,
        appUrl: appUrl,
      })
    );

    // Send via Resend (using temporary domain for testing)
    const response = await resend.emails.send({
      from: 'EnRegla <onboarding@resend.dev>',
      to: user.email,
      subject: generateSubject(userAlerts),
      html: html,
    });

    if (response.error) {
      console.error(`[email-service] Resend API error for ${user.email}:`, response.error);
      return {
        user_id: user.user_id,
        success: false,
        error: response.error.message,
      };
    }

    console.log(`[email-service] Email sent successfully to ${user.email}, message_id: ${response.data?.id}`);

    return {
      user_id: user.user_id,
      success: true,
      resend_message_id: response.data?.id,
    };
  } catch (error) {
    console.error(`[email-service] Error sending email to ${user.email}:`, error);
    return {
      user_id: user.user_id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send emails in batches to avoid rate limits
 */
export async function sendEmailsBatch(userAlertsList: UserAlerts[]): Promise<EmailSendResult[]> {
  const BATCH_SIZE = 10;
  const results: EmailSendResult[] = [];

  console.log(`[email-service] Sending ${userAlertsList.length} emails in batches of ${BATCH_SIZE}`);

  for (let i = 0; i < userAlertsList.length; i += BATCH_SIZE) {
    const batch = userAlertsList.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(userAlerts => sendExpiryAlertEmail(userAlerts))
    );
    results.push(...batchResults);

    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < userAlertsList.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}
