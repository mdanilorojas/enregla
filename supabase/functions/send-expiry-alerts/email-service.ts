/* eslint-disable no-console -- Edge function runtime logs via console for Supabase observability */
import { Resend } from 'https://esm.sh/resend@3.2.0';
import { render } from 'https://esm.sh/@react-email/components@0.0.14';
import { ExpiryAlertEmail } from './templates/expiry-alert.tsx';
import type { UserAlerts, EmailSendResult } from './types.ts';

const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
const appUrl = Deno.env.get('APP_URL') || 'https://app.enregla.ec';
const fromAddress = Deno.env.get('RESEND_FROM') || 'EnRegla <onboarding@resend.dev>';

const resend = new Resend(resendApiKey);

/** Mask an email for log output. `foo@bar.com` → `f***@bar.com`. */
function maskEmail(email: string): string {
  if (!email) return '(no-email)';
  const [local, domain] = email.split('@');
  if (!domain) return '(invalid)';
  return `${local.charAt(0)}***@${domain}`;
}

/** Sanitize a string for use in an email subject (strip control chars, limit length). */
function sanitizeHeader(raw: string, max = 80): string {
  // Intentional control-char regex: strips header-injection payloads (CR/LF/NUL/DEL, etc.).
  // deno-lint-ignore no-control-regex
  // eslint-disable-next-line no-control-regex
  return raw.replace(/[\r\n\x00-\x1f\x7f]/g, '').slice(0, max);
}

function generateSubject(userAlerts: UserAlerts): string {
  const count = userAlerts.alerts.length;
  const type = userAlerts.alerts[0]?.notification_type || 'expiry_30d';
  const companyName = sanitizeHeader(userAlerts.company_name);

  const subjectMap = {
    expiry_30d: `📅 ${count} permiso${count > 1 ? 's' : ''} vence${count > 1 ? 'n' : ''} próximamente - ${companyName}`,
    expiry_15d: `⚠️ ${count} permiso${count > 1 ? 's' : ''} vence${count > 1 ? 'n' : ''} en 2 semanas - ${companyName}`,
    expiry_7d: `🚨 URGENTE: ${count} permiso${count > 1 ? 's' : ''} vence${count > 1 ? 'n' : ''} en 7 días - ${companyName}`,
  };

  return sanitizeHeader(subjectMap[type], 200);
}

export async function sendExpiryAlertEmail(userAlerts: UserAlerts): Promise<EmailSendResult> {
  const { user, alerts, company_name } = userAlerts;
  const maskedEmail = maskEmail(user.email);

  console.log(`[email-service] sending to ${maskedEmail} (${alerts.length} alerts)`);

  try {
    const html = render(
      ExpiryAlertEmail({
        userName: user.full_name || 'Usuario',
        companyName: company_name,
        alerts: alerts,
        appUrl: appUrl,
      })
    );

    const response = await resend.emails.send({
      from: fromAddress,
      to: user.email,
      subject: generateSubject(userAlerts),
      html: html,
    });

    if (response.error) {
      console.error(`[email-service] Resend error for user ${user.user_id}: ${response.error.message}`);
      return { user_id: user.user_id, success: false, error: response.error.message };
    }

    console.log(`[email-service] sent to ${maskedEmail} (user ${user.user_id})`);
    return { user_id: user.user_id, success: true, resend_message_id: response.data?.id };
  } catch (error) {
    console.error(`[email-service] exception for user ${user.user_id}:`, error instanceof Error ? error.message : error);
    return {
      user_id: user.user_id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function sendEmailsBatch(userAlertsList: UserAlerts[]): Promise<EmailSendResult[]> {
  const BATCH_SIZE = 10;
  const results: EmailSendResult[] = [];

  for (let i = 0; i < userAlertsList.length; i += BATCH_SIZE) {
    const batch = userAlertsList.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(userAlerts => sendExpiryAlertEmail(userAlerts))
    );
    results.push(...batchResults);

    if (i + BATCH_SIZE < userAlertsList.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}
