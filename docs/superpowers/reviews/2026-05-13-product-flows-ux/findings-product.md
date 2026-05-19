# Hallazgos — Funcionamiento del producto

**Fecha:** 2026-05-13 · **Agente:** auditor producto
**Scope:** features end-to-end, data layer, integraciones, edge cases, tests

Ver tabla consolidada en sección 3 del [FINAL-REPORT.md](./FINAL-REPORT.md).

## 17 findings nuevos

### P0 (5)
1. **P-1 Data coherence `permit.type`** — 22 valores mixtos, solo 5/22 matchean `permit_requirements.permit_type` slugs. Dashboard joina por casing exacto → 13/22 permits no suman costo/multa al rollup. `DashboardView.tsx:81-99`, `ComplianceInvoiceCard.tsx`
2. **P-2 Data coherence expiry_date** — 4 permits `status='vigente'` con `expiry_date IS NULL`; 24/46 permits activos sin fecha. Cron nunca alerta; RenewalGridView oculta; Dashboard cuenta como vigentes → % compliance inflado
3. **P-3 Event log legacy no backfilled** — Trigger `permits_log_event` deployed post-seed. 2 eventos totales para 46 permits. `PermitEventsTimeline` y `LocationHistoryTab` muestran historial vacío 96%
4. **P-4 React Query half-migrated** — Solo 3/11 hooks TanStack (`useCompany`, `usePermitEvents`, `AssigneePicker`). Resto useState+useEffect. `AssigneePicker.onChange` invalida key `['permits']` que no existe. Datos congelados hasta reload
5. **P-5 renewPermit() sin transacción** — 3 operaciones secuenciales (INSERT nuevo → UPDATE old → upload doc). Fallo paso 3 → `console.error` solamente. Usuario ve "renovación exitosa"; permit nuevo sin documento. `permits.ts:132-206`

### P1 (5)
6. **P-6 Hidden submit button anti-pattern** — `IncrementalWizard` usa `document.querySelector('form')` + button `className="hidden"`. Cualquier form futuro intercepta
7. **P-7 Login CTAs muertos** — "¿Olvidaste…?" y "Solicita acceso" `<a href="#">`. Distinto a `/reset-password`: aquí sin apuntar a ruta
8. **P-8 Tabs vacías permanentes** — `LocationDocumentsTab` EmptyState fijo. `LocationHistoryTab` recibe `events=[]` default sin carga
9. **P-9 Responsable hardcoded '-'** — Dato existe en DB; `PermitListView.tsx:44` pone `responsible: '-'`. Listado inútil
10. **P-10 Icono edit decorativo** — `PermitTable.tsx:83-85` navega `/permisos/:id?edit=true`. `PermitDetailView` sin `useSearchParams`

### P2 (7)
11. **P-11 Signed URLs infinite spinner** — `getDocumentUrl` retorna `null`. `DocumentPanelWithDoc.tsx:507-514` renderiza "Cargando..." sin timeout
12. **P-12 Cron 5 días fallido sin backfill** — `send-expiry-alerts-daily` 2026-05-04, 05, 06, 08, 09, 10 por `extensions.http_post does not exist` + JSON syntax. Arreglado 2026-05-11 sin backfill
13. **P-13 Tests thin** — 4 archivos `.test` totales. Ninguno cubre hooks de fetch, mutations, permits/dashboard
14. **P-14 Lint-silence as any** — 25+ archivos con `// casting due to stale generated types`. 8 en `permits.ts`
15. **P-15 SecurityTab miente** — "Tu cuenta está protegida con autenticación de Google" aunque login acepta email+password
16. **P-16 tsconfig false-security** — `tsc --noEmit` exit=0 pero `as any` desactiva runtime safety del API layer
17. **P-17 renewPermit() orphaned** — API 100 LOC sin un solo llamador. Código muerto crítico

## Funciona bien
- `PermitUploadForm` rollback real al Storage
- `signInWithGoogle` + PKCE post-`c493222`
- `permit_events` triggers SECURITY DEFINER + REVOKE
- `useCompany` staleTime 10min

## Root cause patterns
1. Half-migrated data layer (useState↔TanStack)
2. Schema sin enum (type/status freestyle)
3. Stub-first feature design (5 tabs placeholder)
4. `as any` escape hatch (types no regenerados)
5. Hidden submit button anti-pattern

## Archivos clave
```
src/hooks/usePermits.ts                              # no-TanStack, bypass cache
src/lib/api/permits.ts:132-206                       # renewPermit sin transacción
src/features/dashboard/DashboardView.tsx:81-99       # join broken por casing
src/features/permits/PermitListView.tsx:44           # responsible hardcoded '-'
src/features/locations/LocationDocumentsTab.tsx      # stub permanente
src/features/locations/LocationHistoryTab.tsx:15     # stub permanente
src/features/onboarding-incremental/IncrementalWizard.tsx:144-149  # querySelector('form')
src/features/onboarding-incremental/IncrementalWizard.tsx:156-162  # PermitOps branding leak
src/features/auth/LoginView.tsx:188-193,252-254      # dead # links
src/features/settings/SecurityTab.tsx:14             # miente sobre auth method
supabase/migrations/20260511000005_permit_events.sql # triggers ok pero data legacy
```
