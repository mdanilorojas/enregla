# Ship summary 2026-05-13 · Fases C + A + B cerradas

## Qué se arregló

### Fase C · UX fixes visibles (11 items)
Todos los botones muertos y flujos rotos del frontend reportados en el mega-audit 2026-05-12:

- [x] Rename "PermitOps" → "EnRegla" (ProfileStep, IncrementalWizard, LoginView)
- [x] CompanyTab con 12 business types canonical (antes solo 4)
- [x] NotificationsTab reemplazado por NotificationPreferences funcional
- [x] ProfileTab: controlled inputs + handler Guardar real (antes botón sin onClick)
- [x] SecurityTab: detecta método auth real + "Cerrar todas las sesiones" wireado
- [x] "Nuevo Permiso" wired + ruta `/permisos/nuevo` + `PermitCreateView`
- [x] RenewPermitModal: trigger desde LocationDetailView + botón en PermitDetailView
- [x] Deep-link `?action=renew` auto-abre modal de renovación
- [x] `/forgot-password` + `/reset-password` routes + ResetPasswordView
- [x] Email template CTA → `/permisos/:id?action=renew` (antes `/dashboard`)
- [x] Uninstall 11 deps muertas (-64 packages)

### Fase A · DB + security + reliability (13 items)
- [x] `handle_new_user` fix: `role='member'` → `'admin'` (signup nuevo ahora funciona)
- [x] Normalizar `permits.type`: 18 valores legacy → 12 slugs + CHECK constraint
- [x] 4 permits `vigente` con `expiry_date=NULL` → `no_registrado` (dashboard honesto)
- [x] Backfill `permit_events` 'created' para 46 permits legacy
- [x] Dead-man switch para cron: `cron_heartbeats` + `check_cron_heartbeats` cada 2h
- [x] send-expiry-alerts v9 con `.ec` + deep-link + heartbeat
- [x] Tailwind 4 `@theme` con prefijo `--color-*` (9 utilities ahora emiten CSS)
- [x] Regenerar `database.ts` desde schema real (incluye cron_heartbeats, invitations)
- [x] `leads` INSERT: drop policy pública + edge fn `submit-lead` con rate-limit IP
- [x] Advisor hardening: REVOKE `user_company_id` / `user_role` de anon
- [x] useAuth: eliminar setTimeout(5000) que deslogueaba en red lenta
- [ ] **A1 PENDIENTE**: rotar JWT service_role + purgar git history (ver `2026-05-13-jwt-service-role-leak.md`)

### Fase B · Flujos de valor (7 items)
- [x] `renewPermit` RPC atómica: insert nuevo + archivar viejo en transacción + log event
- [x] Dashboard "Buzón de hoy": top 5 acciones por urgencia reemplazando metáfora clima
- [x] Marco Legal accionable: "Agregar a mis sedes" crea permits `no_registrado`
- [x] Onboarding "Pegar desde Excel" + "Duplicar última sede" (setup 45min → 3min)
- [x] Company invitations MVP: tabla + edge fn + tab Miembros + ruta aceptar

## Qué NO se hizo (out of scope)

- Multi-empresa real (`memberships` m:n + RLS migration) — diferido a follow-up
- hCaptcha en `submit-lead` — opcional (env `HCAPTCHA_SECRET` agrega guard)
- Leaked Password Protection (HIBP) — requiere toggle en Supabase dashboard
- Rotación JWT service_role — **requiere acción interactiva del founder**
- 36 `as any` en código — types regenerados pero limpiar los casts queda para PR dedicado

## Commits

```
feat(ship): fase C · quick wins UX del audit 2026-05-12
feat(ship): fase A · data integrity + security hardening
feat(ship): fase B · flujos nuevos de valor para usuario
```

## Verificación

- `npx tsc --noEmit` → 0 errors
- `npm run build` → pasa (bundle 1.25MB, warning code-split esperado)
- `npm run lint` → 0 errors, 4 warnings pre-existentes
- Supabase advisors: 8 WARN → 4 WARN (los 4 restantes son intencionales o dashboard-only)
- Dev server corriendo en http://localhost:5173/ con HMR funcionando

## Smoke test manual pendiente (user debe hacer)

Probar en dev server:
1. Signup con Google OAuth → crear profile (role='admin')
2. Completar onboarding → ver sidebar dice "EnRegla" no "PermitOps"
3. Crear permit via `/permisos/nuevo`
4. Renovar un permit → verifica nueva versión + evento en timeline
5. Desde `/marco-legal/bomberos` → "Agregar a mis sedes"
6. Settings → Miembros → invitar (revisar email llega)
7. Onboarding de power user: paste CSV → verifica sedes creadas
8. Dashboard → ver "Hoy" buzón con acciones por urgencia
9. Email alert (esperar cron 8am o trigger manual) → CTA lleva a `/permisos/:id?action=renew`

Si algo rompe, reportar con path:line y log del navegador.
