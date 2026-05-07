# Database Audit — Diseño de Subsanación

**Fecha:** 2026-05-07
**Branch:** `feature/database-audit`
**Autor:** Danilo + Claude
**Estado:** In-progress ejecución

---

## Contexto

La base de datos de EnRegla está en producción pero con múltiples problemas acumulados de 23 migraciones previas. Análisis con Supabase advisors encontró:

- 13 warnings de seguridad (RLS mal configurado, search_path mutable, SECURITY DEFINER expuesto a anon, bucket público con listing, password leak protection off)
- 30+ warnings de performance (FKs sin indexes, policies RLS re-evaluando auth por fila, policies duplicadas, indexes sin uso)
- Bug crítico observado: SELECT a `companies` retorna **403** para users con `company_id=null` durante onboarding

El trigger de esta sesión: error `403` en `/rest/v1/companies?select=*` al intentar guardar company desde onboarding.

## Objetivo

Dejar la DB production-ready con:
- Cero RLS policies ambiguas o rotas
- Cero SECURITY DEFINER innecesariamente expuestas
- Policies optimizadas para performance (cacheo de auth.uid)
- Indexes correctos en todas las FK
- Data legal poblada (marco legal Ecuador)
- Cliente 0 = la empresa de Danilo, sin data de prueba

## Arquitectura — 4 Olas

Cada ola es una migration atómica aplicada vía `mcp__supabase__apply_migration`. Si algo falla, rollback automático por la transacción.

### Ola 1: Fix bugs RLS que rompen la app (CRÍTICO)

1. **Policy SELECT de `companies`** reescrita sin el OR `NOT EXISTS` catastrófico. Nueva lógica:
   - Company demo (hardcoded): accesible por todos
   - Company del usuario (via `profiles.company_id`): accesible por el usuario
   - Durante INSERT de company: la fila recién creada es visible (usando RETURNING, no requiere SELECT separado post-insert si el cliente usa `.insert(...).select().single()`)

2. **Onboarding transaccional** — Trigger que asigna `profiles.company_id` automáticamente cuando un user crea su primera company. Esto elimina la ventana de inconsistencia entre "insert company" y "update profile.company_id".

3. **Policies de `permit_requirements`** — Tabla con RLS habilitado pero 0 policies (data muerta). Agregar SELECT público (es data maestra no sensible de requerimientos de permisos).

### Ola 2: Seguridad

4. **`search_path` fijo** en 7 funciones: `get_legal_reference`, `auto_create_location_permits`, `update_notification_preferences_updated_at`, `get_expiring_permits`, `get_public_permits`, `user_company_id`, `user_role`. Agregar `SET search_path = public, pg_catalog` a cada una.

5. **Revocar EXECUTE** en funciones SECURITY DEFINER al rol `anon` y `authenticated` donde no es intencional. Las que SÍ deben quedar expuestas (via `/rest/v1/rpc/*`) son explícitamente: `get_public_permits` (para la verificación pública). El resto van restringidas.

6. **Mover `pg_net`** del schema `public` a schema `extensions` dedicado.

7. **Reemplazar `WITH CHECK (true)` permisivos**:
   - `companies.Users can create company`: validar que el user autenticado no tiene ya una company asignada
   - `leads.Anyone can insert leads`: dejar `true` pero agregar rate limiting a nivel de Supabase platform (ya explicado en el comentario de esa policy)

8. **Bucket `permit-documents`** — restringir listing, mantener acceso a URL directa.

9. **Leaked password protection** — habilitar via dashboard (paso manual documentado).

### Ola 3: Performance

10. **Indexes para 9 FKs**:
    - `idx_documents_permit_id`, `idx_documents_uploaded_by`
    - `idx_leads_assigned_to`
    - `idx_notification_logs_permit_id`
    - `idx_partners_assigned_to`
    - `idx_permits_superseded_by`
    - `idx_profiles_company_id`
    - `idx_public_links_created_by`, `idx_public_links_location_id`

11. **Reescribir 20 policies RLS** con `(select auth.uid())` en vez de `auth.uid()` directo. Esto cachea la evaluación por query en vez de re-evaluar por fila.

12. **Consolidar policies duplicadas**:
    - `locations`: fusionar "Allow all operations on demo company locations" + "Users can ..." en una sola policy que use un OR
    - `permits`: igual que locations
    - `public_links`: fusionar "Admins can manage public links" + "Users can read own company links"

13. **Eliminar 10 indexes sin uso**: todos los `idx_legal_*` (tablas vacías), `idx_permit_requirements_permit_type`, `idx_leads_status`, `idx_partners_status`, `idx_partners_proxima_accion`, `idx_notification_logs_failed`.

### Ola 4: Housekeeping + limpieza data

14. Eliminar migration duplicada `013_enable_pg_cron` en `supabase_migrations.schema_migrations`.

15. **Borrar data de prueba**:
    - `DELETE FROM leads WHERE email LIKE '%@donpollo.ec' OR email LIKE '%@gmail.com' OR email LIKE '%@riveraconsultores.ec'`
    - `DELETE FROM partners WHERE nombre_negocio IN ('ContaPlus Asesores', 'Trámites Express Quito', 'Consultoría Sanitaria RR')`

16. **Poblar `legal_references` + tablas hijas** con data real Ecuador:
    - LUAE (Licencia Única de Actividades Económicas) — Quito
    - Permiso Sanitario ARCSA
    - Permiso de Bomberos
    - Tasa de Habilitación
    - Patente Municipal
    - Uso de Suelo
    - Permiso Ambiental

    (Si el contenido es denso, en Ola 4 dejo la estructura lista y en sesión separada pobla el contenido específico con fuentes oficiales).

17. **Regenerar types TypeScript** — `src/types/database.ts` con el schema actualizado.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Migration rompe producción | Cada migration en transacción via MCP, rollback automático si falla |
| Usuarios logueados pierden acceso | Probar policy nueva con user real de Danilo antes de Ola 2 |
| Data legal mal poblada causa confusión | Solo estructura lista en Ola 4; data específica en sesión dedicada |
| Cambios rompen CRM interno | El CRM vive en branch separada aún no mergeada con producto; sus tablas no se tocan estructuralmente |

## Éxito

- ✅ Advisors de Supabase: 0 warnings críticos (WARN → INFO o resueltos)
- ✅ SELECT a `companies` funciona con user en onboarding
- ✅ Onboarding flow completo sin errores
- ✅ DB vacía de data de prueba
- ✅ Tipos TS actualizados
- ✅ Producto sigue andando sin regresiones

---

## Post-audit (fuera de scope)

- Poblar data legal con contenido real Ecuador (sesión separada)
- Decidir si el CRM interno (`leads` + `partners` tables) se queda o migra a repo externo
- Setup CI/CD para que advisors se ejecuten automáticamente cada PR
