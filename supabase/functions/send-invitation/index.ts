/* eslint-disable no-console */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { Resend } from 'https://esm.sh/resend@3.2.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP_URL = Deno.env.get('APP_URL') || 'https://app.enregla.ec';
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? APP_URL;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
// Remitente único de EnRegla. Hardcodeado (ignora RESEND_FROM) → hola@enregla.ec.
const FROM_ADDRESS = 'EnRegla <hola@enregla.ec>';
const REPLY_TO = 'hola@enregla.ec';

const resend = new Resend(RESEND_API_KEY);

function cors(origin: string | null): Record<string, string> {
  const allow = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, authorization',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  };
}

function rand(n: number): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz';
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  let out = '';
  for (const b of arr) out += alphabet[b % alphabet.length];
  return out;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(origin) });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers: cors(origin) });

  const authHeader = req.headers.get('authorization') || '';
  const jwt = authHeader.replace('Bearer ', '');
  if (!jwt) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: cors(origin) });

  // Client con JWT del user para chequear identidad
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: cors(origin) });

  let body: { email?: string; role?: string };
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers: cors(origin) }); }

  const email = String(body.email || '').trim().toLowerCase();
  const role = String(body.role || 'operator');
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) return new Response(JSON.stringify({ error: 'email_invalid' }), { status: 400, headers: cors(origin) });
  if (!['admin', 'operator', 'viewer'].includes(role)) return new Response(JSON.stringify({ error: 'role_invalid' }), { status: 400, headers: cors(origin) });

  // Usar service role para insertar invitación (políticas validan admin)
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Obtener company_id y role del invitador
  const { data: profile, error: profileErr } = await admin.from('profiles').select('company_id, role, full_name').eq('id', user.id).maybeSingle();
  if (profileErr || !profile) return new Response(JSON.stringify({ error: 'profile_not_found' }), { status: 404, headers: cors(origin) });
  if (profile.role !== 'admin') return new Response(JSON.stringify({ error: 'not_admin' }), { status: 403, headers: cors(origin) });
  if (!profile.company_id) return new Response(JSON.stringify({ error: 'no_company' }), { status: 400, headers: cors(origin) });

  const { data: company } = await admin.from('companies').select('name').eq('id', profile.company_id).maybeSingle();
  const companyName = company?.name || 'tu empresa';

  const token = rand(32);
  const { data: inv, error: insErr } = await admin.from('company_invitations').insert({
    company_id: profile.company_id,
    email,
    role,
    token,
    invited_by: user.id,
  }).select().single();
  if (insErr) {
    console.error('[send-invitation] insert error:', insErr.message);
    return new Response(JSON.stringify({ error: 'insert_failed' }), { status: 500, headers: cors(origin) });
  }

  const acceptUrl = `${APP_URL}/aceptar-invitacion?token=${encodeURIComponent(token)}`;
  const subject = `${profile.full_name || 'Alguien'} te invitó a ${companyName} en EnRegla`;
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#0f265c;margin:0 0 16px">Te invitaron a ${companyName}</h2>
      <p style="color:#374151;font-size:15px;line-height:1.6">Hola,<br/><br/>
        <strong>${profile.full_name || 'Un administrador'}</strong> te invitó a unirte al equipo de <strong>${companyName}</strong> en EnRegla para gestionar permisos y cumplimiento.</p>
      <p style="margin:24px 0">
        <a href="${acceptUrl}" style="background:#0f265c;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">Aceptar invitación</a>
      </p>
      <p style="color:#6B7280;font-size:13px">Este enlace expira en 7 días. Si no esperabas esta invitación, puedes ignorar este mensaje.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
      <p style="color:#6B7280;font-size:12px">EnRegla · ${APP_URL}</p>
    </div>
  `;

  try {
    const r = await resend.emails.send({ from: FROM_ADDRESS, replyTo: REPLY_TO, to: email, subject, html });
    if (r.error) {
      console.error('[send-invitation] resend error:', r.error.message);
      return new Response(JSON.stringify({ ok: true, invitation_id: inv.id, token, email_sent: false, email_error: r.error.message }), { status: 201, headers: cors(origin) });
    }
  } catch (e) {
    console.error('[send-invitation] resend exception:', e);
  }

  return new Response(JSON.stringify({ ok: true, invitation_id: inv.id, token, email_sent: true }), { status: 201, headers: cors(origin) });
});
