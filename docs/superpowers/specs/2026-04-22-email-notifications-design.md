# Email Notifications System - Design Specification

**Date**: 2026-04-22  
**Status**: Draft  
**Goal**: Implementar sistema de notificaciones por email para alertas de vencimiento de permisos

---

## 1. Executive Summary

Sistema de notificaciones automáticas que envía alertas por email a usuarios cuando permisos están próximos a vencer (30, 15, 7 días antes). Objetivo principal: reducir permisos vencidos del 15% al 5%.

**Decisiones clave**:
- ✅ Enfoque: Cron diario en Supabase Edge Function
- ✅ Email provider: Resend
- ✅ Destinatarios: Todos los usuarios de una empresa
- ✅ Umbrales: Fijos (30, 15, 7 días)
- ✅ Opt-out: Sí, con preferencias por usuario

---

## 2. Problem Statement

**Problema actual**: Los usuarios descubren permisos vencidos cuando ya es tarde (inspecciones, multas, operaciones bloqueadas).

**Impacto**: 
- 15% de permisos están vencidos en promedio
- Reactivación de permisos puede tomar 2-6 semanas
- Pérdidas operacionales y financieras

**Solución**: Sistema proactivo de alertas que notifica con suficiente anticipación para iniciar procesos de renovación.

---

## 3. Architecture Overview

### 3.1 Tech Stack

- **Backend**: Supabase Edge Functions (Deno runtime)
- **Scheduler**: `pg_cron` extension en PostgreSQL
- **Email provider**: Resend API
- **Templates**: React Email (JSX → HTML)
- **Database**: PostgreSQL (Supabase)

### 3.2 Components

1. **`send-expiry-alerts`** - Edge Function principal
2. **`notification_logs`** - Tabla de logs de envío
3. **`notification_preferences`** - Tabla de preferencias de usuario
4. **Email templates** - Templates con React Email
5. **NotificationPreferences** - Componente frontend de settings

### 3.3 Data Flow

```
[pg_cron trigger @ 08:00 daily]
    ↓
[send-expiry-alerts Edge Function]
    ↓
[Query: permits WHERE expiry_date IN (30, 15, 7 days)]
    ↓
[Group by company_id]
    ↓
[Query: profiles WHERE company_id = X AND notification_preferences.expiry_alerts_enabled = true]
    ↓
[For each user: render email template]
    ↓
[Resend API: send email]
    ↓
[INSERT notification_logs with status]
    ↓
[Return summary: {sent, failed, skipped}]
```

---

## 4. Database Schema

### 4.1 New Table: `notification_logs`

Registro de todas las notificaciones enviadas para audit trail y prevención de duplicados.

```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  permit_id UUID REFERENCES permits(id) NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('expiry_30d', 'expiry_15d', 'expiry_7d')),
  sent_at TIMESTAMP DEFAULT NOW(),
  email_status TEXT NOT NULL CHECK (email_status IN ('sent', 'failed', 'bounced')),
  error_message TEXT,
  resend_message_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notification_logs_user_permit ON notification_logs(user_id, permit_id, notification_type);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at);
```

**Campos clave**:
- `notification_type`: Tipo de alerta (30d, 15d, 7d)
- `email_status`: Estado del envío
- `resend_message_id`: ID de Resend para tracking
- `error_message`: Mensaje de error si falla

### 4.2 New Table: `notification_preferences`

Configuración de preferencias de notificación por usuario.

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  email_enabled BOOLEAN DEFAULT TRUE,
  digest_enabled BOOLEAN DEFAULT TRUE,
  expiry_alerts_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trigger para crear preferencias por defecto
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();
```

**Campos clave**:
- `email_enabled`: Toggle global de emails
- `expiry_alerts_enabled`: Específico para alertas de vencimiento
- `digest_enabled`: Para digest semanal (Phase 3)

### 4.3 Query Principal

Query que se ejecuta en la Edge Function para obtener permisos próximos a vencer:

```sql
SELECT 
  p.id as permit_id,
  p.type,
  p.expiry_date,
  p.company_id,
  l.name as location_name,
  CASE 
    WHEN (p.expiry_date - CURRENT_DATE) = 30 THEN 'expiry_30d'
    WHEN (p.expiry_date - CURRENT_DATE) = 15 THEN 'expiry_15d'
    WHEN (p.expiry_date - CURRENT_DATE) = 7 THEN 'expiry_7d'
  END as notification_type
FROM permits p
JOIN locations l ON p.location_id = l.id
WHERE p.is_active = true
  AND p.expiry_date IS NOT NULL
  AND (p.expiry_date - CURRENT_DATE) IN (30, 15, 7);
```

---

## 5. Edge Function Logic

### 5.1 File Structure

```
supabase/functions/send-expiry-alerts/
├── index.ts              # Main function handler
├── types.ts              # TypeScript interfaces
├── queries.ts            # Database queries
├── email-service.ts      # Resend API integration
└── templates/
    └── expiry-alert.tsx  # React Email template
```

### 5.2 Core Interfaces

```typescript
interface PermitAlert {
  permit_id: string;
  type: string;
  expiry_date: string;
  location_name: string;
  notification_type: 'expiry_30d' | 'expiry_15d' | 'expiry_7d';
  company_id: string;
}

interface UserAlerts {
  user_id: string;
  email: string;
  full_name: string;
  company_name: string;
  alerts: PermitAlert[];
}

interface SendResult {
  sent: number;
  failed: number;
  skipped: number;
  errors: Array<{user_id: string, error: string}>;
}
```

### 5.3 Main Flow

1. **Query permisos próximos a vencer**
   - Obtener todos los permisos que vencen en 30, 15, o 7 días
   - Incluir información de sede

2. **Agrupar por empresa**
   - Identificar `company_id` únicos
   - Para cada empresa, obtener lista de usuarios

3. **Verificar preferencias**
   - Query `notification_preferences` por `user_id`
   - Filtrar usuarios con `expiry_alerts_enabled = true`

4. **Agrupar alertas por usuario**
   - Un usuario puede tener múltiples permisos del mismo tipo de alerta
   - Enviar 1 solo email con todos los permisos listados

5. **Enviar emails**
   - Renderizar template con React Email
   - Enviar via Resend API
   - Guardar resultado en `notification_logs`

6. **Return summary**
   - Total enviados, fallidos, omitidos
   - Lista de errores si los hay

### 5.4 Error Handling

| Error | Acción |
|-------|--------|
| Resend API down | Log error, continuar con siguiente usuario |
| Invalid email | Log `email_status: 'failed'`, continuar |
| Database error | Rollback transaction, retry función completa |
| Timeout | Procesar en batches de 50 usuarios |
| Rate limit exceeded | Pausar, reintentar en siguiente cron |

### 5.5 Rate Limiting

- **Resend free tier**: 100 emails/día
- **Batch processing**: Enviar de a 10 emails con `Promise.all()`
- **Expected volume**: < 30 emails/día (pocas empresas, pocos permisos)
- **Overflow**: Si excede límite, encolar para el día siguiente

---

## 6. Email Templates

### 6.1 Design Principles

- **Professional**: Acorde al brand de EnRegla (Preciso, Confiable, Protector)
- **Actionable**: CTA claro para ver permisos en la app
- **Scannable**: Tabla limpia, fácil de escanear
- **Responsive**: Mobile-friendly

### 6.2 Template Structure

**Header**:
- Logo de EnRegla
- Línea de separación

**Body**:
- Saludo personalizado: "Hola {user_name}"
- Mensaje según urgencia:
  - 30d: "Los siguientes permisos vencen en 1 mes"
  - 15d: "⚠️ Los siguientes permisos vencen en 2 semanas"
  - 7d: "🚨 URGENTE: Los siguientes permisos vencen en 7 días"
- Tabla de permisos:
  - Tipo de permiso
  - Sede
  - Fecha de vencimiento
  - Días restantes (badge con color)
- CTA button: "Ver en EnRegla" → link al dashboard

**Footer**:
- Unsubscribe link → `/settings/notifications`
- Información de contacto
- Dirección de EnRegla

### 6.3 Subject Lines

- **30 días**: "📅 {count} permisos vencen próximamente - {company_name}"
- **15 días**: "⚠️ {count} permisos vencen en 2 semanas - {company_name}"
- **7 días**: "🚨 URGENTE: {count} permisos vencen en 7 días - {company_name}"

### 6.4 Personalization

- **Agrupación inteligente**: Si un usuario tiene 5 permisos a 7 días, se envía 1 solo email
- **Color coding**:
  - 30d: Azul (informativo)
  - 15d: Amarillo/Naranja (preventivo)
  - 7d: Rojo (urgente)

### 6.5 Example Content

```
Subject: 🚨 URGENTE: 3 permisos vencen en 7 días - Comercial San Martín

Hola Mario,

Los siguientes permisos de tu empresa están por vencer:

┌─────────────────────────────────────────────────────────┐
│ Permiso de Bomberos                                     │
│ Sede: Local Centro • Vence: 29/04/2026 (7 días)        │
├─────────────────────────────────────────────────────────┤
│ Patente Municipal                                       │
│ Sede: Sucursal Norte • Vence: 29/04/2026 (7 días)      │
├─────────────────────────────────────────────────────────┤
│ Certificado Sanitario                                   │
│ Sede: Local Centro • Vence: 30/04/2026 (8 días)        │
└─────────────────────────────────────────────────────────┘

[Ver todos los permisos →]

---
Si no deseas recibir estas notificaciones, puedes desactivarlas en tu perfil.
EnRegla • https://enregla.app
```

---

## 7. Frontend - Notification Preferences

### 7.1 Component Location

- **Route**: `/settings/notifications`
- **File**: `src/features/settings/NotificationPreferences.tsx`
- **Menu**: Nueva sección "Configuración" en sidebar

### 7.2 UI Controls

1. **Toggle principal**:
   - Label: "Recibir notificaciones por email"
   - Description: "Habilita o deshabilita todas las notificaciones"
   - Default: ON

2. **Alertas de vencimiento**:
   - Checkbox: "Alertas de permisos por vencer (30, 15, 7 días)"
   - Description: "Recibe un email cuando un permiso está próximo a vencer"
   - Default: ON
   - Disabled if toggle principal está OFF

3. **Digest semanal** (preparado para Phase 3):
   - Checkbox: "Resumen semanal de compliance"
   - Description: "Recibe un resumen cada lunes con el estado general"
   - Default: ON
   - Disabled for now (coming soon badge)

### 7.3 API Integration

```typescript
// GET preferencias
const { data } = await supabase
  .from('notification_preferences')
  .select('*')
  .eq('user_id', userId)
  .single();

// UPDATE preferencias
const { error } = await supabase
  .from('notification_preferences')
  .update({
    email_enabled: value,
    expiry_alerts_enabled: value
  })
  .eq('user_id', userId);
```

### 7.4 UX Details

- **Auto-save**: Cambios se guardan automáticamente al hacer toggle/check
- **Toast notification**: "Preferencias actualizadas" al guardar
- **Info message**: "Las alertas se envían diariamente a las 8:00 AM"
- **Help link**: "¿Cómo funcionan las alertas?" → modal o docs

---

## 8. Deployment & Configuration

### 8.1 Supabase Setup

**1. Enable pg_cron extension**:
```sql
-- Migration: 011_enable_pg_cron.sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
GRANT USAGE ON SCHEMA cron TO postgres;
```

**2. Create cron job**:
```sql
-- Ejecutar en SQL Editor de Supabase Dashboard
SELECT cron.schedule(
  'send-expiry-alerts-daily',
  '0 8 * * *', -- 8:00 AM todos los días (timezone UTC)
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-expiry-alerts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

**3. Verify cron job**:
```sql
SELECT * FROM cron.job;
```

### 8.2 Resend Configuration

**1. Create account**: https://resend.com/signup
**2. Verify domain**: enregla.app
**3. Get API key**: Settings → API Keys → Create
**4. Configure sender**: `noreply@enregla.app`

### 8.3 Environment Variables

```bash
# supabase/functions/send-expiry-alerts/.env
RESEND_API_KEY=re_xxxxxxxxxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
APP_URL=https://enregla.app
```

### 8.4 Deployment Checklist

- [ ] Crear cuenta en Resend
- [ ] Verificar dominio enregla.app en Resend
- [ ] Obtener API key de Resend
- [ ] Deploy Edge Function: `supabase functions deploy send-expiry-alerts`
- [ ] Configurar secrets: `supabase secrets set RESEND_API_KEY=xxx`
- [ ] Aplicar migrations (tablas + pg_cron)
- [ ] Crear cron job en Supabase Dashboard
- [ ] Test manual: invocar función via HTTP
- [ ] Monitorear logs: `supabase functions logs send-expiry-alerts`
- [ ] Crear migration para `notification_preferences` default values en usuarios existentes

### 8.5 Testing Strategy

**Local testing**:
```bash
# Start local Supabase
supabase start

# Serve function locally
supabase functions serve send-expiry-alerts

# Test with curl
curl -X POST http://localhost:54321/functions/v1/send-expiry-alerts \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

**Staging testing**:
- Modificar cron a cada 5 minutos para testing rápido
- Usar emails de prueba (test@enregla.app)
- Verificar que emails lleguen y se vean bien

**Production testing**:
- Cron diario a las 8:00 AM
- Monitorear logs las primeras semanas
- Setup alertas en Supabase si función falla

---

## 9. Success Metrics

**Primary KPI**: Reducir permisos vencidos del 15% al 5%

**Secondary metrics**:
- Email open rate > 40%
- Click-through rate > 20%
- Opt-out rate < 5%
- Email delivery rate > 95%
- Permisos renovados a tiempo (antes de expiry_date)

**Tracking**:
- Resend dashboard: open rates, clicks, bounces
- `notification_logs`: Total enviados, failed rate
- Analytics: Permisos vencidos over time

---

## 10. Future Enhancements (Phase 3+)

**Not in scope for this phase**, but prepared for:

1. **Digest semanal de compliance**
   - Resumen cada lunes del estado general
   - Gráficos de tendencia
   - Top 5 acciones pendientes

2. **SMS alerts** (via Twilio)
   - Alertas urgentes (7 días) vía SMS
   - Opt-in por usuario
   - Solo para permisos críticos

3. **In-app notification center**
   - Bell icon en topbar
   - Lista de notificaciones no leídas
   - Mark as read functionality

4. **Configuración avanzada**
   - Umbrales personalizados por empresa
   - Umbrales por tipo de permiso
   - Horario preferido de envío

5. **Webhooks**
   - Notificar a sistemas externos
   - Integración con Slack, MS Teams

---

## 11. Migration Plan

### 11.1 Para usuarios existentes

Cuando se deploya el sistema, usuarios existentes no tienen preferencias. Necesitamos:

```sql
-- Migration: 012_backfill_notification_preferences.sql
INSERT INTO notification_preferences (user_id, email_enabled, expiry_alerts_enabled)
SELECT id, true, true
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM notification_preferences);
```

### 11.2 Rollout plan

1. **Week 1**: Deploy con cron deshabilitado, solo UI de preferencias
2. **Week 2**: Habilitar cron en staging, enviar a test users
3. **Week 3**: Habilitar cron en production
4. **Week 4**: Monitorear metrics, ajustar templates si es necesario

---

## 12. Security & Privacy

**Data protection**:
- Emails contienen solo información que el usuario ya tiene acceso
- No se exponen detalles sensibles (passwords, API keys)
- Links a la app requieren autenticación

**Unsubscribe compliance**:
- Todo email tiene link de unsubscribe
- Opt-out es inmediato (no requiere confirmación)
- Cumple con CAN-SPAM Act y GDPR

**Rate limiting**:
- Edge Function tiene timeout de 60s
- Máximo 100 emails/día (Resend free tier)
- No se permite SPAM (cron fijo, no user-triggered)

**Audit trail**:
- `notification_logs` guarda todos los envíos
- Logs disponibles para troubleshooting
- Retention: 90 días

---

## 13. Open Questions

- ✅ **RESOLVED**: ¿Destinatarios? → Todos los usuarios de la empresa
- ✅ **RESOLVED**: ¿Umbrales configurables? → Fijos: 30, 15, 7 días
- ✅ **RESOLVED**: ¿Opt-out? → Sí, con preferencias por usuario
- ✅ **RESOLVED**: ¿Email provider? → Resend
- ✅ **RESOLVED**: ¿Cron frequency? → Diario a las 8:00 AM

---

## 14. Dependencies

**External services**:
- Resend account + verified domain
- Supabase pg_cron enabled

**Internal**:
- Tablas: `permits`, `locations`, `profiles`
- Auth: `auth.users` table

**New dependencies**:
- `@react-email/components` (npm package)
- `resend` (npm package for Deno)

---

## 15. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Resend API down | High - No emails sent | Implement retry logic, fallback to Supabase SMTP |
| Email bounces (invalid addresses) | Medium - Users don't get notified | Log bounces, surface in admin UI for correction |
| Rate limit exceeded | Low - Some emails delayed | Volume is low (< 30/day), unlikely to hit 100/day limit |
| Spam complaints | High - Domain reputation | Clear unsubscribe, relevant content only, low frequency |
| Timezone confusion | Low - Emails at wrong time | Cron en UTC, documentar claramente |

---

## Approval

**Design approved by**: [Pending]  
**Date**: [Pending]  
**Next step**: Create implementation plan with superpowers:writing-plans
