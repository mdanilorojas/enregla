# Email Notifications System

## Overview

Sistema automatizado de notificaciones por email que alerta a los usuarios cuando permisos están próximos a vencer en 30, 15 o 7 días. Diseñado para reducir permisos vencidos del 15% → 5% mediante alertas proactivas.

**Estado**: ✅ Implementado (código completo, requiere deployment)

**Spec**: [`docs/superpowers/specs/2026-04-22-email-notifications-design.md`](../superpowers/specs/2026-04-22-email-notifications-design.md)

**Plan**: [`docs/superpowers/plans/2026-04-22-email-notifications-implementation.md`](../superpowers/plans/2026-04-22-email-notifications-implementation.md)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Supabase Cloud                          │
│                                                                 │
│  ┌──────────────┐     ┌─────────────────────────────────┐     │
│  │   pg_cron    │────▶│  Edge Function                  │     │
│  │ (8:00 AM UTC)│     │  send-expiry-alerts             │     │
│  └──────────────┘     │                                 │     │
│                       │  1. Query expiring permits       │     │
│  ┌──────────────┐     │  2. Group by company            │     │
│  │  PostgreSQL  │◀────│  3. Get users + preferences     │     │
│  │              │     │  4. Send emails (Resend API)    │     │
│  │ • permits    │     │  5. Log results                 │     │
│  │ • companies  │     └─────────────────┬───────────────┘     │
│  │ • profiles   │                       │                     │
│  │ • notif_logs │◀──────────────────────┘                     │
│  │ • notif_prefs│                                             │
│  └──────────────┘                                             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                      ┌──────────────────┐
                      │   Resend API     │
                      │  (Email Service) │
                      └──────────────────┘
                                │
                                ▼
                         📧 User Inboxes
```

### Components

- **Edge Function**: `send-expiry-alerts` (Deno runtime)
- **Scheduler**: `pg_cron` ejecuta diariamente a las 8:00 AM UTC
- **Email Provider**: Resend API con React Email templates
- **Database**: PostgreSQL con 2 nuevas tablas

---

## Database Schema

### `notification_logs`
Audit trail de todas las notificaciones enviadas.

```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  permit_id UUID REFERENCES permits(id) NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('expiry_30d', 'expiry_15d', 'expiry_7d')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  email_status TEXT NOT NULL CHECK (email_status IN ('sent', 'failed', 'bounced')),
  error_message TEXT,
  resend_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `idx_notification_logs_user_permit` (user_id, permit_id, notification_type)
- `idx_notification_logs_sent_at` (sent_at)
- `idx_notification_logs_failed` (email_status, sent_at) WHERE email_status IN ('failed', 'bounced')

**RLS**: Users can only read logs for permits in their company

---

### `notification_preferences`
Preferencias de usuario para recibir notificaciones.

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  email_enabled BOOLEAN DEFAULT TRUE,
  digest_enabled BOOLEAN DEFAULT TRUE,
  expiry_alerts_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Trigger**: Auto-creates preferences when new user signs up

**RLS**: Users can only manage their own preferences

---

### SQL Function: `get_expiring_permits()`

Retorna permisos que vencen exactamente en 30, 15 o 7 días.

```sql
CREATE OR REPLACE FUNCTION get_expiring_permits()
RETURNS TABLE (
  permit_id UUID,
  type TEXT,
  expiry_date DATE,
  location_name TEXT,
  notification_type TEXT,
  company_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as permit_id,
    p.type,
    p.expiry_date,
    l.name as location_name,
    CASE 
      WHEN (p.expiry_date - CURRENT_DATE) = 30 THEN 'expiry_30d'
      WHEN (p.expiry_date - CURRENT_DATE) = 15 THEN 'expiry_15d'
      WHEN (p.expiry_date - CURRENT_DATE) = 7 THEN 'expiry_7d'
    END::TEXT as notification_type,
    p.company_id
  FROM permits p
  JOIN locations l ON p.location_id = l.id
  WHERE p.is_active = true
    AND p.expiry_date IS NOT NULL
    AND (p.expiry_date - CURRENT_DATE) IN (30, 15, 7);
END;
$$ LANGUAGE plpgsql;
```

---

## Edge Function Structure

### File Structure

```
supabase/functions/send-expiry-alerts/
├── index.ts              # Main handler (orchestration)
├── types.ts              # TypeScript interfaces
├── queries.ts            # Database query wrappers
├── email-service.ts      # Resend integration + batch processing
└── templates/
    └── expiry-alert.tsx  # React Email template
```

### Flow

1. **Handler** receives cron trigger
2. **Queries** fetch expiring permits via `get_expiring_permits()`
3. **Groups** permits by company
4. **Fetches** company users and preferences
5. **Filters** users with notifications enabled
6. **Sends** emails in batches (10 at a time) via Resend
7. **Logs** all results to `notification_logs`
8. **Returns** summary (sent/failed/skipped counts)

### Email Template Urgency Levels

| Type | Days Until | Color | Icon | Subject Example |
|------|-----------|-------|------|-----------------|
| `expiry_30d` | 30 días | Blue | 📅 | "📅 2 permisos vencen próximamente - Empresa S.A." |
| `expiry_15d` | 15 días | Orange | ⚠️ | "⚠️ 2 permisos vencen en 2 semanas - Empresa S.A." |
| `expiry_7d` | 7 días | Red | 🚨 | "🚨 URGENTE: 2 permisos vencen en 7 días - Empresa S.A." |

---

## Frontend

### User Flow

1. Usuario navega a **Settings** → **Notificaciones** (`/settings/notifications`)
2. Ve 3 toggles:
   - **Email global** (habilita/deshabilita todo)
   - **Alertas de vencimiento** (específico para permisos)
   - **Resumen semanal** (deshabilitado, Phase 3)
3. Cambia preferencias → Toast de confirmación
4. Cambios se guardan en `notification_preferences` table

### Components

- **Hook**: `useNotificationPreferences` - Fetch/update preferences via Supabase
- **Component**: `NotificationPreferences` - UI con toggles y estados
- **View**: `SettingsView` - Container con placeholders para futuras settings
- **Routes**: `/settings` y `/settings/notifications`
- **Sidebar**: Menu item "Configuración" con ícono Settings

---

## Deployment Checklist

### ✅ Code Implemented (Complete)

- [x] Database migrations (4 files)
- [x] Edge Function (5 files)
- [x] Frontend (hook, component, routes, sidebar)
- [x] Git push to remote

### ⏳ Pending Manual Steps

#### 1. Resend Account Setup

1. Crear cuenta: https://resend.com/signup
2. Verificar dominio `enregla.app`:
   - Add DNS records (TXT, MX, CNAME)
   - Wait for verification (green checkmark)
3. Obtener API key:
   - Go to API Keys → Create API Key
   - Name: "EnRegla Production"
   - Copy key (starts with `re_`)

#### 2. Supabase Secrets Configuration

```bash
# Get your project ref from Supabase Dashboard URL
PROJECT_REF="your-project-ref"

# Set secrets
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxx --project-ref $PROJECT_REF
supabase secrets set APP_URL=https://enregla.app --project-ref $PROJECT_REF
```

#### 3. Deploy Edge Function

```bash
supabase functions deploy send-expiry-alerts --project-ref $PROJECT_REF
```

Verify deployment:
```bash
curl -X POST https://$PROJECT_REF.supabase.co/functions/v1/send-expiry-alerts \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

Expected: `{"sent": 0, "failed": 0, "skipped": 0}`

#### 4. Create Cron Job

Open Supabase Dashboard → SQL Editor, ejecutar:

```sql
SELECT cron.schedule(
  'send-expiry-alerts-daily',
  '0 8 * * *', -- 8:00 AM UTC every day
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-expiry-alerts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

Verify cron job created:
```sql
SELECT * FROM cron.job WHERE jobname = 'send-expiry-alerts-daily';
```

#### 5. Test End-to-End

**Create test permit:**
```sql
UPDATE permits
SET expiry_date = CURRENT_DATE + INTERVAL '30 days'
WHERE id = (SELECT id FROM permits LIMIT 1);
```

**Trigger function manually:**
```bash
curl -X POST https://$PROJECT_REF.supabase.co/functions/v1/send-expiry-alerts \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

**Check results:**
1. Email inbox (debe llegar email con subject "📅 1 permiso vence próximamente")
2. Notification logs:
   ```sql
   SELECT * FROM notification_logs ORDER BY created_at DESC LIMIT 10;
   ```
3. Test preferences toggle en `/settings/notifications`

---

## Monitoring & Operations

### View Recent Notifications

```sql
SELECT 
  nl.notification_type,
  nl.email_status,
  u.email,
  p.type as permit_type,
  nl.sent_at
FROM notification_logs nl
JOIN auth.users u ON nl.user_id = u.id
JOIN permits p ON nl.permit_id = p.id
ORDER BY nl.sent_at DESC
LIMIT 50;
```

### Check Notification Stats

```sql
SELECT 
  notification_type,
  email_status,
  COUNT(*) as count
FROM notification_logs
WHERE sent_at > NOW() - INTERVAL '7 days'
GROUP BY notification_type, email_status
ORDER BY notification_type, email_status;
```

### View Cron Job Execution History

```sql
SELECT 
  runid,
  jobid,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-expiry-alerts-daily')
ORDER BY start_time DESC
LIMIT 20;
```

### Edge Function Logs

```bash
# Real-time logs
supabase functions logs send-expiry-alerts --project-ref $PROJECT_REF

# Or in Supabase Dashboard → Edge Functions → send-expiry-alerts → Logs
```

### Resend Dashboard

- Deliveries: https://resend.com/emails
- Opens/Clicks tracking
- Bounce/Complaint reports
- API usage stats

---

## Troubleshooting

### Emails Not Sending

**Check 1: Edge Function logs**
```bash
supabase functions logs send-expiry-alerts
```
Look for errors in Resend API calls or database queries.

**Check 2: Resend API key**
```bash
supabase secrets list --project-ref $PROJECT_REF
```
Verify `RESEND_API_KEY` is set correctly.

**Check 3: User preferences**
```sql
SELECT 
  u.email,
  np.email_enabled,
  np.expiry_alerts_enabled
FROM auth.users u
LEFT JOIN notification_preferences np ON u.id = np.user_id;
```
Users may have opted out.

**Check 4: Domain verification**
In Resend Dashboard → Domains, verify `enregla.app` shows green checkmark.

---

### Cron Job Not Running

**Check 1: Verify job exists**
```sql
SELECT * FROM cron.job WHERE jobname = 'send-expiry-alerts-daily';
```

**Check 2: Check pg_cron extension**
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

**Check 3: View failed runs**
```sql
SELECT * FROM cron.job_run_details 
WHERE status = 'failed'
ORDER BY start_time DESC;
```

**Manual trigger for debugging:**
```bash
curl -X POST https://$PROJECT_REF.supabase.co/functions/v1/send-expiry-alerts \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -v
```

---

### Rate Limit Exceeded

**Resend free tier**: 100 emails/day

**Symptoms**: `email_status = 'failed'` with error "Rate limit exceeded"

**Solutions**:
1. Upgrade Resend plan
2. Reduce batch size in `email-service.ts` (currently 10)
3. Add longer delays between batches

---

### No Permits Expiring

**Expected**: If no permits match the 30/15/7 day thresholds, function returns:
```json
{"message": "No permits expiring today", "sent": 0, "failed": 0, "skipped": 0}
```

This is normal behavior. Test by creating test permits:
```sql
UPDATE permits 
SET expiry_date = CURRENT_DATE + INTERVAL '30 days'
WHERE id = 'some-permit-id';
```

---

## Performance & Scalability

### Current Implementation

- **Batch size**: 10 emails at a time
- **Batch delay**: 1 second between batches
- **Expected volume**: ~50 emails/day (pocas empresas, pocos permisos)

### Scaling Considerations

| Metric | Current | At Scale (100 companies) |
|--------|---------|--------------------------|
| Companies | 5-10 | 100 |
| Users | 10-20 | 500 |
| Permits/day | 10-20 | 200 |
| Emails/day | 10-50 | 500-1000 |

**Bottlenecks**:
1. Resend free tier (100 emails/day) → Upgrade to paid plan
2. Database queries scale linearly with companies
3. Edge Function timeout (default 150s) → Sufficient for 1000 emails

**Optimization if needed**:
- Add database indexes on `permits.expiry_date`
- Cache company names in memory
- Parallelize email sending (multiple batches concurrently)

---

## Future Enhancements (Phase 3+)

- [ ] **Weekly digest**: Resumen semanal de compliance por email
- [ ] **Configurable thresholds**: Admin puede cambiar 30/15/7 días
- [ ] **Role-based recipients**: Solo enviar a admins/managers, no todos los users
- [ ] **Multi-language**: Detectar idioma del usuario y enviar en su idioma
- [ ] **SMS notifications**: Integración con Twilio para alertas críticas
- [ ] **Email templates editor**: UI para customizar templates sin código
- [ ] **Notification history UI**: Ver historial de notificaciones en frontend
- [ ] **Webhook events**: Notificar sistemas externos cuando se envía alerta

---

## Related Documentation

- **Product Spec**: [`docs/superpowers/specs/2026-04-22-email-notifications-design.md`](../superpowers/specs/2026-04-22-email-notifications-design.md)
- **Implementation Plan**: [`docs/superpowers/plans/2026-04-22-email-notifications-implementation.md`](../superpowers/plans/2026-04-22-email-notifications-implementation.md)
- **Roadmap**: [`docs/core/ROADMAP.md`](../core/ROADMAP.md) - Phase 3: Smart Alerts & Notifications
- **Database Schema**: `supabase/migrations/011_notification_tables.sql`

---

## Support & Feedback

Para reportar issues o sugerir mejoras:
1. GitHub Issues: https://github.com/mdanilorojas/enregla/issues
2. Email interno del equipo
3. Slack channel: #enregla-notifications (if exists)

---

**Última actualización**: 2026-04-22  
**Autor**: Claude Sonnet 4.5 (Subagent-Driven Development)  
**Estado**: ✅ Código completo, ⏳ Pending deployment
