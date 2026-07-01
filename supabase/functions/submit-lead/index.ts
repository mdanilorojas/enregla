/* eslint-disable no-console */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
// ALLOWED_ORIGINS comma-separated (https://enregla.ec,https://www.enregla.ec,https://app.enregla.ec)
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://enregla.ec,https://www.enregla.ec,https://app.enregla.ec').split(',').map(s => s.trim());
// Opcional: hCaptcha/Turnstile. Si HCAPTCHA_SECRET está seteado, se exige token en body.
const HCAPTCHA_SECRET = Deno.env.get('HCAPTCHA_SECRET');

function cors(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  };
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyHcaptcha(token: string, remoteIp: string): Promise<boolean> {
  if (!HCAPTCHA_SECRET) return true; // captcha disabled
  const body = new URLSearchParams({ secret: HCAPTCHA_SECRET, response: token, remoteip: remoteIp });
  const r = await fetch('https://hcaptcha.com/siteverify', { method: 'POST', body });
  const j = await r.json();
  return j.success === true;
}

function validLeadPayload(p: Record<string, unknown>): { ok: true; data: LeadBody } | { ok: false; error: string } {
  const nombre = String(p.nombre ?? '').trim();
  const negocio = String(p.negocio ?? '').trim();
  const email = String(p.email ?? '').trim().toLowerCase();
  const source = String(p.source ?? 'home');

  if (nombre.length < 2 || nombre.length > 120) return { ok: false, error: 'nombre invalido' };
  if (negocio.length < 2 || negocio.length > 200) return { ok: false, error: 'negocio invalido' };
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) return { ok: false, error: 'email invalido' };
  if (!['diagnostico','partners','home','sobre','otro'].includes(source)) return { ok: false, error: 'source invalido' };

  return {
    ok: true,
    data: {
      nombre,
      negocio,
      email,
      telefono: p.telefono ? String(p.telefono).slice(0, 30) : null,
      ciudad: p.ciudad ? String(p.ciudad).slice(0, 80) : null,
      num_sedes: typeof p.num_sedes === 'number' ? p.num_sedes : null,
      source,
      utm_source: p.utm_source ? String(p.utm_source).slice(0, 120) : null,
      utm_medium: p.utm_medium ? String(p.utm_medium).slice(0, 120) : null,
      utm_campaign: p.utm_campaign ? String(p.utm_campaign).slice(0, 120) : null,
      referrer: p.referrer ? String(p.referrer).slice(0, 1024) : null,
    },
  };
}

interface LeadBody {
  nombre: string;
  negocio: string;
  email: string;
  telefono: string | null;
  ciudad: string | null;
  num_sedes: number | null;
  source: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
}

serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(origin) });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers: cors(origin) });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers: cors(origin) }); }

  const captchaToken = typeof body.captcha_token === 'string' ? body.captcha_token : '';
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';

  // Captcha (si HCAPTCHA_SECRET configurado)
  if (HCAPTCHA_SECRET) {
    const ok = await verifyHcaptcha(captchaToken, ip);
    if (!ok) return new Response(JSON.stringify({ error: 'captcha_failed' }), { status: 403, headers: cors(origin) });
  }

  // Validación
  const v = validLeadPayload(body);
  if (!v.ok) return new Response(JSON.stringify({ error: v.error }), { status: 400, headers: cors(origin) });

  // Rate-limit por IP (hasheada para privacidad)
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const ipHash = await sha256Hex(ip);
  const { data: rateOk, error: rateErr } = await admin.rpc('check_lead_rate_limit', { p_ip_hash: ipHash });
  if (rateErr) {
    console.error('[submit-lead] rate-limit rpc error:', rateErr.message);
    return new Response(JSON.stringify({ error: 'rate_check_failed' }), { status: 500, headers: cors(origin) });
  }
  if (rateOk === false) {
    return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429, headers: cors(origin) });
  }

  // Insert
  const userAgent = (req.headers.get('user-agent') || '').slice(0, 512);
  const { error: insertErr } = await admin.from('leads').insert({ ...v.data, user_agent: userAgent });
  if (insertErr) {
    console.error('[submit-lead] insert error:', insertErr.message);
    return new Response(JSON.stringify({ error: 'insert_failed' }), { status: 500, headers: cors(origin) });
  }

  // Avisar al equipo (hola@enregla.ec) vía notify-lead. Best-effort: el lead ya
  // quedó guardado, así que un fallo de email no rompe la respuesta al cliente.
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/notify-lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
      body: JSON.stringify({
        nombre: v.data.nombre,
        negocio: v.data.negocio,
        email: v.data.email,
        telefono: v.data.telefono,
        ciudad: v.data.ciudad,
        source: v.data.source,
      }),
    });
  } catch (e) {
    console.error('[submit-lead] notify-lead failed (lead guardado igual):', e instanceof Error ? e.message : e);
  }

  return new Response(JSON.stringify({ ok: true }), { status: 201, headers: cors(origin) });
});
