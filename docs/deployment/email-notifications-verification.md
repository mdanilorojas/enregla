# Email Notifications — Deploy Verification

**Fecha:** 2026-05-06
**Rama:** `feature/atlassian-ds-migration`
**Proyecto Supabase:** `zqaqhapxqwkvninnyqiu`
**Status:** parcial — infra desplegada, cron job con bug crítico, secrets no verificables vía MCP

---

## Checklist

| Item | Status | Notas |
|---|---|---|
| Migrations aplicadas | ✅ | 19 migraciones aplicadas en remoto (ver abajo) |
| Tablas `notification_logs`, `notification_preferences` | ✅ | Ambas existen en schema `public` |
| Extensión `pg_cron` | ✅ | v1.6.4 habilitada |
| Edge Function `send-expiry-alerts` desplegada | ✅ | v7, status ACTIVE, `verify_jwt=false` |
| Secret `RESEND_API_KEY` | ⚠️ no verificable | No existe tool MCP para listar Edge Function secrets; requiere verificación manual |
| Secret `RESEND_FROM_EMAIL=alertas@enregla.ec` | ⚠️ no verificable | Ídem |
| Cron job diario 8AM UTC | ❌ **existe pero falla** | Ver sección "Bug crítico del cron" |
| Test manual | ⏸ pendiente | No ejecutado en esta sesión |

---

## Resumen

**Ya estaba desplegado antes de esta verificación:**

- Todas las migraciones del listado de referencia están aplicadas en remoto, aunque con nombres ligeramente diferentes (los nombres remotos reflejan los títulos reales de cada migración aplicada, no el nombre del archivo local).
- Tablas `notification_logs` y `notification_preferences` creadas.
- `pg_cron` habilitado (hay dos entradas `013_enable_pg_cron` en `supabase_migrations.schema_migrations` porque la migración se aplicó dos veces; no bloquea nada, pero conviene limpiar).
- Edge Function `send-expiry-alerts` versión 7, activa, sin `verify_jwt` (correcto para un cron interno).
- Cron job `send-expiry-alerts-daily` registrado con schedule `0 8 * * *` y `active=true`.
- `notification_preferences` backfilled: 4 filas, todas con `email_enabled=true`.

**No se aplicó nada en esta sesión** — la infra estaba deployada. Esta verificación **encontró un bug crítico** que impide que los emails salgan.

---

## Bug crítico del cron

El comando del cron job actual es:

```sql
SELECT net.http_post(
  url := 'https://zqaqhapxqwkvninnyqiu.supabase.co/functions/v1/send-expiry-alerts',
  headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb,
  body := '{}'::jsonb
);
```

**Problema:** `current_setting('app.settings.service_role_key', true)` devuelve `NULL` en Supabase hosted (ese GUC no está seteado), por lo que la concatenación produce `NULL`, y al castear a `jsonb` Postgres devuelve un error `invalid input syntax for type json`.

**Evidencia** (`cron.job_run_details`, últimas 5 corridas, todas `failed`):

```
runid 14 | 2026-05-06 08:00:00 UTC | ERROR: invalid input syntax for type json ... Token "\"}" is invalid
runid 13 | 2026-05-05 08:00:00 UTC | (mismo error)
runid 12 | 2026-05-04 08:00:00 UTC | (mismo error)
runid 11 | 2026-05-03 08:00:00 UTC | (mismo error)
runid 10 | 2026-05-02 08:00:00 UTC | (mismo error)
```

**Conclusión:** los emails de expiración **no se han enviado** al menos desde el 2 de mayo 2026. Muy probablemente nunca han salido en producción por este cron.

### Opciones para fix (no aplicadas en esta sesión — requieren decisión de usuario)

1. **Guardar el service role key en `vault.secrets` y leerlo desde el cron:**
   ```sql
   SELECT vault.create_secret('<service_role_key>', 'service_role_key');
   -- luego el cron usa:
   -- (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
   ```
2. **Setear el GUC a nivel de DB:** `ALTER DATABASE postgres SET app.settings.service_role_key = '...'` — simple pero guarda el secret en el catálogo.
3. **Quitar el `verify_jwt` check y eliminar el header Authorization del cron** — la Edge Function ya tiene `verify_jwt=false`, así que el header es innecesario. Esta es la opción más limpia:
   ```sql
   SELECT cron.unschedule('send-expiry-alerts-daily');
   SELECT cron.schedule(
     'send-expiry-alerts-daily',
     '0 8 * * *',
     $$
     SELECT net.http_post(
       url := 'https://zqaqhapxqwkvninnyqiu.supabase.co/functions/v1/send-expiry-alerts',
       headers := '{"Content-Type": "application/json"}'::jsonb,
       body := '{}'::jsonb
     );
     $$
   );
   ```

Recomendación: opción 3 porque la Edge Function ya está configurada sin `verify_jwt`.

---

## Migraciones aplicadas (remoto)

```
20260415025204  fix_documents_rls
20260415025923  fix_storage_rls_policies
20260415171352  007_public_storage_policy
20260415171801  007_public_storage_policy_fix
20260415213020  008_legal_references
20260416004302  permit_requirements
20260416004421  add_permit_trigger
20260422173618  notification_tables
20260422173942  update_notification_tables_rls
20260422174449  012_fix_notification_trigger_name
20260422174626  013_enable_pg_cron
20260422174931  013_enable_pg_cron          -- duplicada
20260422175148  014_backfill_notification_preferences
20260422175523  add_get_expiring_permits_function
20260423184107  allow_demo_user_operations
20260423185433  allow_demo_profile_access
20260423194337  allow_demo_documents_operations
20260423194425  simplify_documents_rls_for_demo
20260423205202  create_permit_documents_bucket
```

Las migraciones tempranas (`001_initial_schema`..`011_notification_tables`) están presentes en el repo local pero el proyecto remoto fue creado con snapshots ya consolidados; no hay gaps funcionales (tablas, RLS, triggers, etc. verificados presentes).

---

## Pendientes manuales

1. **Verificar secrets en Supabase Dashboard → Project Settings → Edge Functions → Secrets:**
   - `RESEND_API_KEY` debe existir y empezar con `re_`
   - `RESEND_FROM_EMAIL` debe ser exactamente `alertas@enregla.ec` (ojo: `.ec`, no `.com`, no `.app`)
   - Si no existen, configurarlos. Los valores a usar están en el brief original de la tarea.

2. **Reparar el cron job** usando una de las 3 opciones de la sección "Bug crítico del cron" (opción 3 recomendada).

3. **Test manual** — disparar la Edge Function a mano y verificar:
   ```bash
   curl -X POST \
     'https://zqaqhapxqwkvninnyqiu.supabase.co/functions/v1/send-expiry-alerts' \
     -H 'Content-Type: application/json' \
     -d '{}'
   ```
   Después revisar:
   - `notification_logs` para ver si registró intentos
   - Dashboard de Resend para ver emails enviados
   - Inbox del destinatario

4. **Limpiar migración duplicada** `013_enable_pg_cron` en `supabase_migrations.schema_migrations` (cosmético, no urgente).

---

## Comandos de verificación

```sql
-- Estado del cron job y últimas corridas
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'send-expiry-alerts-daily';
SELECT jobid, runid, status, return_message, start_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-expiry-alerts-daily')
ORDER BY start_time DESC LIMIT 10;

-- Tablas de notificaciones
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('notification_logs', 'notification_preferences');

-- Extensiones
SELECT extname, extversion FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');

-- Preferences backfill
SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE email_enabled) AS email_enabled
FROM notification_preferences;

-- Logs recientes de envíos
SELECT created_at, recipient, status, error_message
FROM notification_logs
ORDER BY created_at DESC LIMIT 20;
```
