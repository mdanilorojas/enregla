/* eslint-disable no-console -- Edge function logs via console for Supabase observability */
// Avisa al equipo (hola@enregla.ec) cuando entra un lead: onboarding "lo
// sacamos por ti" o formulario de la landing. FROM y TO = hola@enregla.ec;
// reply-to = email del cliente, así "Responder" le escribe directo a él.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { Resend } from 'https://esm.sh/resend@3.2.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY')!);
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://enregla.ec,https://www.enregla.ec,https://app.enregla.ec').split(',').map((s) => s.trim());
const TEAM_INBOX = 'hola@enregla.ec';
const FROM = 'EnRegla <hola@enregla.ec>';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function clean(s: unknown, max = 200): string {
  return String(s ?? '')
    // deno-lint-ignore no-control-regex
    .replace(/[\r\n\x00-\x1f\x7f]/g, ' ')
    .trim()
    .slice(0, max);
}

function cors(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, authorization',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  };
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(origin) });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers: cors(origin) });

  // Auth: acepta service-role (server-to-server, ej. submit-lead) o un usuario
  // autenticado real. El anon key suelto (getUser → sin usuario) queda rechazado,
  // cerrando el relay de email abierto.
  const authHeader = req.headers.get('authorization') || '';
  const jwt = authHeader.replace('Bearer ', '').trim();
  if (!jwt) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: cors(origin) });
  if (jwt !== SUPABASE_SERVICE_ROLE_KEY) {
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: cors(origin) });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers: cors(origin) }); }

  const nombre = clean(body.nombre, 120);
  const email = clean(body.email, 160);
  if (!nombre || !email) return new Response(JSON.stringify({ error: 'missing_fields' }), { status: 400, headers: cors(origin) });

  const negocio = clean(body.negocio, 200);
  const telefono = clean(body.telefono, 40);
  const ciudad = clean(body.ciudad, 80);
  const permiso = clean(body.permitType ?? body.permiso, 120);
  const source = clean(body.source, 40) || 'onboarding';

  const subject = permiso
    ? `🔔 Nuevo lead — ${permiso}: ${nombre}`
    : `🔔 Nuevo lead: ${nombre}`;

  const rows: Array<[string, string]> = [
    ['Nombre', nombre],
    ['Negocio', negocio],
    ['Email', email],
    ['Teléfono', telefono],
    ['Ciudad', ciudad],
    ['Permiso solicitado', permiso],
    ['Origen', source],
  ].filter(([, v]) => v) as Array<[string, string]>;

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#0f265c">Nuevo cliente quiere que lo contactes</h2>
      <table style="border-collapse:collapse;width:100%">
        ${rows.map(([k, v]) => `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6B7280;width:160px">${k}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#111827"><strong>${escapeHtml(v)}</strong></td>
        </tr>`).join('')}
      </table>
      <p style="color:#6B7280;font-size:13px;margin-top:16px">Respondé a este correo para escribirle directo al cliente (${escapeHtml(email)}).</p>
    </div>`;

  try {
    const r = await resend.emails.send({
      from: FROM,
      to: TEAM_INBOX,
      replyTo: email,
      subject,
      html,
    });
    if (r.error) {
      console.error('[notify-lead] resend error:', r.error.message);
      return new Response(JSON.stringify({ error: r.error.message }), { status: 502, headers: cors(origin) });
    }
    return new Response(JSON.stringify({ ok: true, id: r.data?.id }), { status: 200, headers: cors(origin) });
  } catch (e) {
    console.error('[notify-lead] exception:', e instanceof Error ? e.message : e);
    return new Response(JSON.stringify({ error: 'send_failed' }), { status: 500, headers: cors(origin) });
  }
});
