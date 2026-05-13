# EnRegla — Audit 2026-05-13 · Producto · UX · Flujos

**Branch:** `feat/dominio-v2` (29 commits ahead main, sin push ni PR)
**Método:** 3 agentes verification del mega-audit + 3 agentes findings nuevos
**Principio:** verify behavior, not shape

---

## 0 · Resumen ejecutivo

Mega-audit 2026-05-12 no cerrado. Verificados 40 findings; 1 FIXED, 6 PARTIAL, 33 BROKEN. Único P0 resuelto: OAuth callback PKCE + `.ec` (`c493222`). Branch dedicó esfuerzo a refactor de dominio (business_types, permit_requirements, marco legal DB-driven), no a ship-blockers.

Audit nuevo suma **22 hallazgos** no documentados:
- 5 P0 (data coherence + renovación sin transacción + cron alerts perdidas 5 días)
- 10 P1 (UX, copy, branding, seguridad, hooks cache)
- 7 P2 (hygiene)

5 flujos missing críticos: multi-empresa, invitar miembros, billing, import CSV, reset password.

Producto listo para demo. **No listo para producción**.

---

## 1 · Verificación mega-audit 2026-05-12

### 1A · DB / Security / Auth (13 verificados)

| ID | Hallazgo | Status | Evidencia |
|---|---|---|---|
| DB-1 | `handle_new_user` inserta `role='member'` fuera del CHECK | **BROKEN** | `pg_proc.prosrc` contiene literal `'member'` en prod |
| DB-2 | `permits.type` 18 valores duplicados sin CHECK | **BROKEN** | 18 tipos: `bomberos`/`Bomberos`, `arcsa`/`Sanitario`/`Permiso Sanitario (ARCSA)`, `patente_municipal`/`Patente Municipal`, `ruc`/`RUC`, `uso_suelo`/`Uso de Suelo`. Solo `permits_status_check` existe, no `type` CHECK |
| DB-3 | Trigger `auto_create_location_permits` no popula `issuer_id` | **BROKEN** | `pg_get_functiondef` INSERT omite `issuer_id`. 46 permits, 5 con `issuer_id` (11%) |
| DB-4 | Stale types + `as any` | **BROKEN** | `database.ts` 920 líneas stale; `database.types.ts` 28 líneas placeholder; 36 `as any` en 19 archivos |
| SEC-1 | JWT service_role en git público | **BROKEN** | `docs/superpowers/plans/2026-04-14-incremental-onboarding-implementation.md:1266` aún contiene JWT `eyJ...Ugp946o...`. Role `service_role`, exp 2091. **No purgado**; rotación no verificable desde MCP |
| SEC-2 | `leads` INSERT `WITH CHECK (true)` público | **BROKEN** | `pg_policies`: policy `"Anyone can insert leads"` roles `{public}` with_check `true`. Advisor `rls_policy_always_true` WARN |
| SEC-3 | Edge fn v8 con `.se` | **BROKEN** | `send-expiry-alerts` v8. `index.ts:14` `ALLOWED_ORIGIN ?? 'https://app.enregla.se'`. `email-service.ts:7` `APP_URL \|\| 'https://app.enregla.se'`. Actualizada 2026-05-06 pero defaults aún `.se` |
| SEC-4 | public-link RLS sin token-binding | **PARTIAL** | `documents_select_anon` no valida token específico. `permits_select` es `TO public` sin referenciar `public_links` en absoluto. Scoping real solo por `company_id+location_id` |
| `user_company_id()` EXECUTE anon | Restore commit `046b578` | **BROKEN** | `has_function_privilege('anon','user_company_id()','EXECUTE')=true`. Advisor `anon_security_definer_function_executable` WARN |
| EMAIL-1 | Resend fallback `onboarding@resend.dev` | **BROKEN (code) / UNVERIFIED (secret)** | `email-service.ts:8` `RESEND_FROM \|\| 'EnRegla <onboarding@resend.dev>'` |
| AUTH callback | PKCE + `.ec` | **FIXED** | `AuthCallback.tsx:32-35` usa `exchangeCodeForSession`. Sin `.se` hardcoded. Único `.se` prod: `src/lib/demo.ts:28` (detección host bidireccional, OK) |
| useAuth 5s timeout | Mata sesión red lenta | **BROKEN** | `src/hooks/useAuth.ts:84-88` sigue con `setTimeout(...,5000)` que dispara `setAuth(null,null)` |
| Advisors | 8 security WARN + 13 perf INFO | **BROKEN** | `rls_policy_always_true` (leads); 3× `anon_security_definer_function_executable` (`get_public_permits`, `increment_public_link_view`, `user_company_id`); 3× `authenticated_…`; `auth_leaked_password_protection` disabled; 13× `unused_index` |

### 1B · Frontend / UX (12 verificados)

| ID | Hallazgo | Status | Evidencia |
|---|---|---|---|
| UX-1 | "Nuevo Permiso" muerto ×3 | **BROKEN** | `PermitListView.tsx:85-87` `<Button variant="default"><Plus/>Nuevo Permiso</Button>` sin onClick. Mismo `:112-115`. Sin ruta `/permisos/nuevo` ni componente. `LocationPermitsTab.tsx:30-33` redirige a lista |
| UX-2 | NotificationsTab sin persistencia | **BROKEN** | `SettingsView.tsx:22` importa `NotificationsTab`. `NotificationPreferences.tsx` funcional existe sin montar |
| UX-3 | ProfileTab/SecurityTab botones sin onClick | **BROKEN** | `ProfileTab.tsx:17,30`; `SecurityTab.tsx:23` |
| UX-4 | CompanyTab 4 giros vs DB 12 | **BROKEN** | `CompanyTab.tsx:11-16` array local de 4. No importa `BUSINESS_TYPES` canonical (12). CompanyStep sí importa canonical — asimetría onboarding vs settings |
| UX-5 | RenewPermitModal trigger nunca llamado | **BROKEN** | `LocationDetailView.tsx:25-27` estado; `:151-159` modal montado. Nunca `setRenewModalOpen(true)` ni `setSelectedPermit(...)`. Solo close handler se usa |
| UX-6 | Copy "PermitOps" | **BROKEN** | `ProfileStep.tsx:24` "Bienvenido a PermitOps"; `IncrementalWizard.tsx:157` logo "PM"; `:160` "PermitOps" sidebar |
| UX-7 | CRM interno sin ruta | **PARTIAL** | `App.tsx` sin `/leads` ni `/partners`. `LeadsTable.tsx`, `PartnerScorecard.tsx` existen dead code. Sin landing activa con captura anon → no riesgo inmediato |
| DATA-OBS | Hooks descartan `error` | **PARTIAL** | `DashboardView.tsx:63-64`, `PermitListView.tsx:19-20`, `PermitDetailView.tsx:46-47` descartan `error`. Solo `LocationsGrid.tsx:28-29` lo recibe. Ningún view renderiza estado de error |
| PUBLIC-RPC | `/p/:token` usa PostgREST vs RPC | **BROKEN** | `PublicVerificationPage.tsx:25` llama `getPublicLinkData(token)` de `@/lib/api/publicLinks`. Sin `supabase.rpc('get_public_permits'…)` en árbol. RPC huérfana |
| WIN-OPEN | noopener,noreferrer | **PARTIAL** | `DocumentList.tsx:35` y `PermitDetailView.tsx:557` sin flags. `ShareLocationModal.tsx:123` correctos |
| ROUTE-RESET | `/reset-password` | **BROKEN** | `lib/auth.ts:61` redirect a `/reset-password`; `App.tsx` sin ruta → fallback `*` → `Navigate to="/"`. Recuperación rompe |
| DS-COLOR | DesignSystemView stock vs brand | **BROKEN** | `DesignSystemView.tsx:83,112` aún `#1e3a8a` con label "Color principal de marca" |

### 1C · Design System / Build / Deps / Observability (15 verificados)

| ID | Hallazgo | Status | Evidencia |
|---|---|---|---|
| DS-1 | `@theme` sin prefijo `--color-*` | **BROKEN** | `src/index.css:16-44` todos los tokens `--primary`, `--secondary`, etc. sin `--color-` prefix. Tailwind 4 no emite utilities |
| DS-2 | DesignSystemView stock vs brand | **BROKEN** | `DesignSystemView.tsx:83` `blue-900, #1e3a8a, primary: true`; `:112` "Azul profundo (#1e3a8a / blue-900) - Color principal de marca" |
| DS-3 | `--ds-orange-700/800/900` rojos | **BROKEN** | `atlassian-tokens.css:32-34` → `#f44336`, `#e53935`, `#d32f2f`. `--ds-risk-alto-text` y `--ds-status-por-vencer-text` apuntan a `--ds-orange-700` = rojo. Colisiona con vencido |
| DS-4 | `@custom-variant dark` borrar | **BROKEN** | `src/index.css:14` sigue presente |
| tsconfig | strict/strictNullChecks/noImplicitAny | **BROKEN** | `config/tsconfig.app.json` ninguna flag presente |
| CI | lint/tsc/test/build/coverage/audit/budget | **PARTIAL** | `.github/workflows/ci.yml` corre lint+tsc+build+test. Falta coverage, `npm audit`, bundle-budget, Lighthouse |
| esbuild.drop console | vite.config | **BROKEN** | `config/vite.config.ts` 17 líneas, sin `esbuild.drop` |
| Deps muertas (11) | Removidas | **BROKEN** | Las 11 siguen: `recharts`, `jspdf`, `html2canvas`, `framer-motion`, `d3-force`, `sonner`, `@tanstack/react-virtual`, `react-hook-form`, `zod`, `@hookform/resolvers`, `@tanstack/react-query-devtools` |
| Code-splitting `/p/:token` | Lazy routes | **BROKEN** | `App.tsx:1-21` todos los imports estáticos. `lazy(` → 0 matches |
| Sentry | Wireado | **BROKEN** | Solo en docs. `package.json` sin dep. `main.tsx` sin `Sentry.init()` |
| console.* en src | Cantidad | **BROKEN** | **103 matches** en 26 archivos. Worst: `useAuth.ts` (38) |
| ErrorBoundary prod | Sentry/telemetry | **BROKEN** | `ErrorBoundary.tsx:19-23` solo `console.error` bajo `import.meta.env.DEV`. Errores prod se pierden |
| PermitTable sort a11y | Keyboard | **BROKEN** | `PermitTable.tsx:111-121` `<th onClick>` sin button/tabIndex/role/aria-sort |
| ShareLocationModal focus trap | Escape | **BROKEN** | `:128-134` tiene `role="dialog"`/`aria-modal` sin trap, sin librería focus-trap, sin keydown Escape |
| Archivos muertos | Eliminados | **PARTIAL** | `.deprecated/` FIXED. `src/data/mock/index.ts`, `src/data/classification-rules.ts`, `src/data/legal-references.ts` siguen |

### 1D · Riesgos nuevos descubiertos durante verificación

1. `permits_select` RLS `TO public` sin referenciar `public_links` — peor que SEC-4 original
2. `get_public_permits` + `increment_public_link_view` SECURITY DEFINER accesibles a `anon` sin validar token
3. Auth Leaked Password Protection (HIBP) **disabled**
4. `lucide-react@^1.14.0`, `typescript@~6.0.2`, `vite@^8` versiones sospechosas (canarias/fork)
5. Layout no-convencional: `config/vite.config.ts` en vez de root — puede romper Vercel/Sentry plugins
6. `DesignSystemShowcase` + `DesignSystemView` duplicados en prod
7. `--ds-orange-*` rojos anclados en `DashboardSedeCard.tsx:14`, `DashboardWidget.tsx:44`, `SedeNode.tsx:19`

### 1E · Veredicto

**1 FIXED, 6 PARTIAL, 33 BROKEN de 40 findings P0/P1 verificados.**

Mega-audit sigue abierto. Rama no está lista para merge a main.

---

## 2 · Audit nuevo · Funcionamiento del producto

17 findings nuevos (no duplican mega-audit).

### 2A · Tabla hallazgos

| # | Sev | Área | Hallazgo | Evidencia | Impacto usuario |
|---|---|---|---|---|---|
| P-1 | P0 | Data coherence | `permit.type` 22 valores mixtos en DB. Solo 5/22 matchean `permit_requirements.permit_type` slugs | DB query + `DashboardView.tsx:81-99` joina por `req.permit_type === p.type` | Dashboard miente. `ComplianceInvoiceCard` sub-estima multa 60%+ por 13/22 permits sin match |
| P-2 | P0 | Data coherence | 4 permits `status='vigente'` con `expiry_date IS NULL`; 24/46 permits activos sin `expiry_date` | SQL: `no_expiry=24, vigente_without_expiry=4` | Cron nunca alerta; RenewalGridView oculta; Dashboard cuenta como vigentes → % compliance inflado |
| P-3 | P0 | Event log | Trigger `permits_log_event` funciona pero legacy seed (46 permits) predata deploy del trigger (`20260511000005`). DB tiene **2 eventos para 46 permits** | `SELECT COUNT(*) FROM permit_events` vs `permits` | `PermitEventsTimeline` y `LocationHistoryTab` muestran historial vacío 96%. Trazabilidad que vende la app no existe para data legacy |
| P-4 | P0 | React Query | Solo 3/11 hooks usan TanStack Query (`useCompany`, `usePermitEvents`, `AssigneePicker`). Resto useState+useEffect. `AssigneePicker.onChange` invalida key `['permits']` que no existe | `useAuth.ts:189-190`, `AssigneePicker.tsx:61`, `usePermits.ts` | Asignar responsable no refleja en lista/detalle. Editar empresa no actualiza header. Datos congelados hasta reload |
| P-5 | P0 | Renovación | `renewPermit()` 3 operaciones secuenciales (INSERT nuevo → UPDATE old.is_active=false → upload doc) **sin transacción**. Fallo paso 3 → `console.error` | `src/lib/api/permits.ts:132-206` (194-202) | Usuario ve "renovación exitosa", permit renovado sin documento. Inconsistencia permanente |
| P-6 | P1 | Onboarding | `IncrementalWizard.handleSubmitForm()` usa `document.querySelector('form')` para disparar submit. Botón interno del step `className="hidden"` | `IncrementalWizard.tsx:144-149`, `LocationsStep.tsx:177` | Cualquier form adicional (autocomplete, search, modal) intercepta "Siguiente". Bomba de tiempo |
| P-7 | P1 | Login UX | "¿Olvidaste tu contraseña?" y "Solicita acceso" son `<a href="#">` sin handler | `LoginView.tsx:188-193,252-254` | Dos CTAs críticas muertas. Distinto a `/reset-password`: aquí ni siquiera apunta a ruta |
| P-8 | P1 | Location detail | `LocationDocumentsTab` es EmptyState permanente. `LocationHistoryTab` recibe `events=[]` default, nunca carga | `LocationDocumentsTab.tsx:10`, `LocationHistoryTab.tsx:15` | Dos tabs que el usuario abre sin resultado. Promesa rota de "historial de sede" |
| P-9 | P1 | Permit list | Columna "Responsable" muestra `'-'` para todos. `usePermits` sin join `assigned_to_profile_id` | `PermitListView.tsx:44` (`responsible: '-'`) | Dato existe en DB (AssigneePicker escribe) pero PermitTable nunca lo trae. Listado inútil para saber owner |
| P-10 | P1 | Permit edit | Icono "✏ Edit" navega `/permisos/${id}?edit=true` pero `PermitDetailView` ignora query param | `PermitTable.tsx:83-85` vs `PermitDetailView.tsx` (sin `useSearchParams`) | Icono edit decorativo. Mismo destino que icono ver |
| P-11 | P2 | Signed URLs | `getDocumentUrl` retorna `null` en error sin estado. `DocumentPanelWithDoc.tsx:507-514` renderiza "Cargando documento..." infinito | `src/lib/api/documents.ts:89-98` | Si signed URL expira (TTL=300s) o RLS falla → spinner infinito sin mensaje |
| P-12 | P2 | Cron history | Cron `send-expiry-alerts-daily` falló 5 días seguidos (2026-05-04 al 06 y 08 al 10) por `extensions.http_post does not exist` + JSON syntax. Arreglado 2026-05-11 sin backfill | `cron.job_run_details` | Permisos que vencieron entre 4-10 mayo **no dispararon alerta**. Dato perdido |
| P-13 | P2 | Tests | 4 archivos `.test.{ts,tsx}` total. Ninguno cubre hooks de fetch, mutations, ni permits/dashboard | `dashboard-metrics.test.ts`, `queryClient.test.ts`, `business-types.test.ts`, `PartnerScorecard.test.tsx` | Sin red de seguridad. Refactors rompen silenciosamente |
| P-14 | P2 | Lint-silence | 25+ archivos con `// casting due to stale generated types` + `eslint-disable @typescript-eslint/no-explicit-any`. 8 ocurrencias solo en `permits.ts` | Grep en `src/` | Types generados nunca regenerados post-v2. Schema drift = runtime silent failure |
| P-15 | P2 | Settings miente | `SecurityTab` dice "Tu cuenta está protegida con autenticación de Google" aunque login acepta email+password | `SecurityTab.tsx:14` | User signup email+password ve "protegida con Google" |
| P-16 | P2 | tsconfig false-security | `npx tsc --noEmit` exit=0 pero `as any` desactiva runtime-type-safety del API layer | — | "Tests pass" tranquilizador falso: `any` oculta drift |
| P-17 | P2 | `renewPermit()` orphaned | API 100 LOC sin un solo llamador | `src/lib/api/permits.ts:132` | Código muerto crítico. Flujo principal del producto |

### 2B · Funciona bien (no todo negativo)

1. `PermitUploadForm` con rollback real: si DB insert falla tras upload, borra del Storage. Production-grade raro
2. `signInWithGoogle` + `AuthCallback` PKCE sólido post-`c493222`. `onAuthStateChange` limpia QueryClient al signout (`useAuth.ts:189-190`)
3. `permit_events` triggers bien diseñados. SECURITY DEFINER + REVOKE writes a anon/authenticated. Diseño correcto; ejecución incompleta (legacy sin backfill)
4. `useCompany` con `staleTime: 10min`. Único fetch con budget de cache sensato. Patrón a replicar

### 2C · Root cause patterns

1. **Half-migrated data layer** — codebase a mitad de transición useState+useEffect → TanStack Query. Mutations en hooks viejos (`usePermits.updatePermit`) llaman `refetch()` manual local, otros (`AssigneePicker`) asumen QueryClient global. Cache nunca coherente. Fix: migrar 8 hooks restantes + convención `queryKey` (`['permits', companyId]`)
2. **Schema sin enum** — `permits.type`/`permits.status` sin CHECK. Valores legacy capitalized; seed nuevo slugs snake_case. Joins fallan para mayoría del dataset. Fix: migración normalización + CHECK + FK a `permit_requirements.permit_type`
3. **Stub-first feature design** — `LocationDocumentsTab`, `LocationHistoryTab`, `SecurityTab`, `NotificationsTab`, `ProfileTab` son placeholders nunca completados. Tab aparece, user abre, empty/toggle sin guardar. Distinto de botón sin onClick: la promesa llega a render completo con diseño final
4. **`as any` escape hatch** — types Supabase sin regenerar post-v2. Resuelto con `// casting due to stale generated types` en ~25 sitios. TS ya no protege schema drift. Fix: `npx supabase gen types typescript` + quitar todos los `as any`
5. **"Hidden submit button" anti-pattern** — `LocationsStep` tiene `<Button className="hidden">` + `document.querySelector('form').requestSubmit()`. Funciona hoy; bomba cuando otro form se monte

---

## 3 · Audit nuevo · Experiencia de usuario

20 findings UX nuevos (no duplican mega-audit).

### 3A · Tabla hallazgos

| # | Sev | Área | Hallazgo | Evidencia | Impacto |
|---|---|---|---|---|---|
| UX-A1 | Alta | Voz / copy | Voseo (Arg/Uy) mezclado con tuteo castellano. Ecuador usa tuteo o usted, no voseo. "Subí el permiso", "Arrastrá el archivo", "Probá con otras palabras" vs "Comencemos", "¿Cómo te llamas?" | `PermitDetailView.tsx:467-470`, `LegalIndexView.tsx:213` vs `ProfileStep.tsx:27,33` | Rompe "Profesionalismo accesible". Cliente nota que app no fue escrita para Ecuador |
| UX-A2 | Alta | Feedback | 3 patrones coexisten: `react-hot-toast`, `<Banner>` inline, `window.confirm`/`window.alert`. Diálogos nativos rompen estética corporativa | `PermitDetailView.tsx:568`, `CreateLocationModal.tsx:142`, `DocumentList.tsx:46` | Rompe "Consistencia multi-contexto" y "Confianza visual" |
| UX-A3 | Alta | Jerarquía / Brand | Dashboard primera impresión es metáfora "clima" (`ComplianceWeatherCard` 642 LOC). Nubes, rayos, partículas. Contradice "preciso, confiable, protector". Copy "te pueden clausurar el local en cualquier momento" = sensacionalista | `DashboardView.tsx:23-51`, `ComplianceWeatherCard.tsx:1-642` | Top-of-page. Rompe identidad brand |
| UX-A4 | Alta | Design tokens | `ComplianceWeatherCard` y `ComplianceInvoiceCard` bypass total DS: `<style>{CSS}</style>` con hex hardcoded (`#6ab0ff`, `#0f265c`, `#16a34a`), border-radius `16px` fijo | `ComplianceInvoiceCard.tsx:92-222`, `ComplianceWeatherCard.tsx:383+` | Mantenibilidad; futuro dark-mode/theming imposible |
| UX-A5 | Alta | Estados iniciales | 3 tipos empty state distintos: componente `<EmptyState>` DS; `DocumentList.tsx:67-80` hardcoded (`bg-gray-50`, `text-[13px]`); `LegalIndexView.tsx:196-221` tercer local. `LocationDocumentsTab` es solo empty permanente — la tab no debería existir | ver arriba | Incumple "Consistencia multi-contexto"; confunde usuario día 1 |
| UX-A6 | Alta | Onboarding | Sin skip, sin "guardar y salir", sin "podés volver luego". 3 pasos obligatorios. Recompensa tras wizard: dashboard vacío con empty-state si no cargó permits | `IncrementalWizard.tsx:20-259`, `DashboardView.tsx:125-145` | Razón principal churn onboarding |
| UX-A7 | Alta | Brand leak | "PermitOps" en onboarding + "Compliance" en login (inglés) + logo "PM" | `LoginView.tsx:79,143`, `IncrementalWizard.tsx:160`, `ProfileStep.tsx:24` | Inglés + nombre viejo + "Compliance" en audiencia PYMES EC. Suena a producto gringo |
| UX-A8 | Media | Info arquitectura | "Mapa Interactivo" y "Sedes" casi lo mismo. Dos entradas sidebar mismo nivel | `AppLayout.tsx:26-35`, `NetworkMapPage.tsx:1-57` | Sobrecarga navegación |
| UX-A9 | Media | Copy / tono | Dashboard headline: "Vas bien, Acme", "se te están acumulando los papeles", "Ponte las pilas antes que te caiga una multa". Funciona marketing landing, no dashboard para gerentes/consultores | `DashboardView.tsx:23-50` | Rompe "Profesionalismo accesible". Pierde perfil consultor-legal |
| UX-A10 | Media | ProfileTab stub | `defaultValue` (uncontrolled) en full_name; botón "Guardar cambios" sin onClick; "Cambiar foto" sin onClick | `ProfileTab.tsx:11-34` | Mockup visual sin funcionalidad |
| UX-A11 | Media | Números i18n | `ComplianceInvoiceCard` formatea con `toLocaleString('en-US').replace(/,/g, ' ')` → espacios como separador miles. EC usa `.` | `ComplianceInvoiceCard.tsx:21-23` | Feeling extranjero en card de dinero |
| UX-A12 | Media | Dates i18n | Dos formatos coexisten: `date-fns` `"d 'de' MMM, yyyy"` ("3 de may, 2026") y `toLocaleDateString('es-EC')` ("3/5/2026") | `PermitTable.tsx:62`, `LocationHistoryTab.tsx:33`, `RenewPermitModal.tsx:84` | Misma vista ambos estilos |
| UX-A13 | Media | Iconos ambiguos | `Building2` es logo + sede. `FileText` es permiso + documento. `MapPin` es sedes (menu) + geoloc | — | Micro-pérdida precisión |
| UX-A14 | Media | Tipografía | `PermitTable` `text-[var(--ds-font-size-050)]` (~11px) headers + `050` celdas. En tablet 1024px celdas "por_vencer" rompen línea. Columna "Responsable" hardcoded `'-'` | `PermitListView.tsx:44-46`, `PermitTable.tsx:66-74,114` | Columna inútil; tabla no aguanta tablet horizontal |
| UX-A15 | Media | Marco Legal | Matriz usa `bg-green-600`, `bg-blue-400`, `bg-amber-500` (Tailwind crudo) en vez de tokens de riesgo. Códigos "R/O/T" sin leyenda visual | `LegalMatrixView.tsx:38-49,54-59` | Rompe sistema colores riesgo; accesibilidad semántica |
| UX-A16 | Baja | Mobile | Sidebar oculto <lg sin burger en login. Toggle dashboard usa `Menu` en mobile y `Building2` en desktop (mismo botón cambia ícono por breakpoint) | `AppLayout.tsx:234-241` | Confusión a11y + consistencia |
| UX-A17 | Baja | Dashboard jerarquía | "Permisos X de Y" + "Locales N" (métrica más importante) visualmente subordinada a porcentaje 96px y nube animada | `ComplianceWeatherCard.tsx:361-375` | Rompe "Jerarquía funcional sobre decoración" |
| UX-A18 | Baja | Copy legal | `LegalIndexView` dice "referencia de normativa ecuatoriana" pero matriz habla solo de Quito | `LegalMatrixView.tsx:55`, `LegalIndexView.tsx:116` | Pérdida confianza. User de Cuenca/Guayaquil no sabe si aplica |
| UX-A19 | Baja | Dead-end UX | "Valores aproximados según tarifa municipal. Los exactos los ves en cada permiso" — sin CTA "Ver detalle" | `ComplianceInvoiceCard.tsx:41` | Dead-end |
| UX-A20 | Baja | Ciudades | Onboarding hardcodea 6 ciudades (Quito, Guayaquil, Cuenca, Ambato, Manta, Santo Domingo). Sin Loja, Machala, Riobamba, Esmeraldas. Sin "Otra" | `CompanyStep.tsx:19-26` | Bloqueo real onboarding PYME fuera de capitales |

### 3B · Patterns que funcionan

1. `EmptyState` component (`src/components/ui/empty-state.tsx`) — API simple, respeta tokens, 7 vistas
2. `Breadcrumb` en PermitDetail/LocationDetail — trayectoria clara refuerza "Confianza visual"
3. Stepper + `ProgressStepper` dual onboarding — progreso visible, paso completado chequeado
4. Skip-to-content link (`AppLayout.tsx:130-135`) — a11y raro en productos EC
5. Validación RUC live con Banner inline (`CompanyStep.tsx:99-105`) — 13 dígitos, only-number, feedback inmediato
6. `RenewPermitModal` muestra fecha actual + nueva lado-a-lado — UX clara "cambio de estado"

### 3C · Brand voice / copy · Veredicto

**Inconsistente y sin guía.** 4 registros conviven:
- Corporativo serio (Login: "Accede a tu panel de compliance")
- Voseo argentino-uruguayo ("Subí el permiso", "Arrastrá", "Probá")
- Tuteo neutro ("¿Cómo te llamas?", "Comencemos")
- Coloquial alarmista ("Ponte las pilas", "te pueden clausurar el local")

Para PYMES y consultores ecuatorianos voseo suena doblaje argentino; coloquial es informal donde debería ser preciso. Falta style-guide.

**Recomendación:** tuteo neutro ecuatoriano, sin voseo, sin "ponte las pilas". Para alertas: factual-directo — "Este permiso venció hace 12 días. Riesgo: clausura del local. Multa estimada: $200–$500."

Jerga técnica filtrada: "Compliance" (inglés) en logo, "multi-sede en tiempo real". Sin RLS/policies/JWT visibles en UI — ese frente limpio.

### 3D · Oportunidades diferenciación (identidad "preciso, confiable, protector")

1. **Panel de control en vez de metáfora clima** — semáforo compacto, números grandes, trazabilidad qué vence cuándo, micro-sparklines últimos 6 meses. Consultor legal reconoce. Meteorológico = emocional; "preciso" pide datos duros
2. **Cronograma de protección** — Gantt real de vencimientos próximos 12 meses, sedes como filas. `RenewalGridView` → Gantt. Diferenciador vs ERP/CRUD genérico
3. **Auditoría-ready dossier PDF firmado** — botón "Generar dossier para auditor/abogado" por sede. Exporta RUC + patente + bomberos + uso-suelo + historia + docs. Ningún competidor EC lo hace. Oro para consultores legales
4. **Riesgo contextual en cada permit** — renglón "Sin esto: clausura inmediata + multa $X–$Y según Art. Z Ordenanza N°". Hoy `PermitInfoCard` tiene `fine_source` como nota chica. Subirlo a hero refuerza "protector"
5. **Voz "asesor compliance"** — en vez de "Vas bien, Acme": "Tu empresa cumple X de Y permisos obligatorios. Riesgo operativo actual: bajo. Próximo vencimiento: patente Guayaquil el 15 de julio". Tono abogado confiable
6. **Señales de precisión** — hora última sincronización municipio, versión marco legal, "datos validados DD/MM". Hoy sin timestamps → usuario no sabe si data es de hoy o hace 6 meses

---

## 4 · Audit nuevo · Flujos de usuario

### 4A · Mapa de flujos

| # | Flujo | Estado | Pasos | Fricciones | Mejora |
|---|---|---|---|---|---|
| 1 | Landing → app activa | **broken** | 7-9 | Trigger auto-creación profile inestable; signup forms `href="#"`; sin trial/billing; sin post-OAuth welcome | Eliminar email/pwd de `LoginView`; solo Google + CTA "Prueba gratis". Página bienvenida post-OAuth |
| 2 | Onboarding power user (120 permits) | **partial** | 3 steps + 15 sedes manuales | Sedes una por una; sin import CSV; sin paste; sin duplicar sede. Permits auto-generados por giro aparecen sin fechas ni docs | "Importar desde Excel/CSV" en `LocationsStep` + "Duplicar última sede". Post-onboarding: Bulk setup con tabla editable (sede × permiso = fecha) |
| 3 | Día 1 diario | **partial** | 1-4 | Dashboard muestra weather+invoice sin decir qué hacer hoy. Sin top-3 tareas urgentes. `/renovaciones` no es lo que busca gerente a las 9am | Reemplazar dashboard por "Buzón de hoy": permisos vencidos (clic=renovar), por vencer <30d (clic=subir doc), no_registrado (clic=marcar en trámite) |
| 4 | Subir documento | **works** | 3 | Form pide solo `issue_date`, calcula vencimiento por reglas. Sin nº permit ni autoridad desde picker. Archivo inmutable (hay que renovar para reemplazar) | Campo `permit_number` opcional. Botón "Reemplazar documento" sin versionar para correcciones OCR |
| 5 | Renovar permit | **broken** | ? | `RenewPermitModal` sin trigger UI. `renewPermit()` orphaned. Modal actual solo updates `expiry_date`, pierde trazabilidad del doc anterior | Botón "Renovar" en `PermitDetailView` → modal unificado con nuevo doc + `issue_date` → usa `renewPermit` real (versiona). Email cron → `/permisos/:id` directo |
| 6 | Compartir con tercero (inspector) | **works frágil** | 3 | Link sin expiración (`createPublicLink` no acepta `expires_at`); sin revocar desde UI; label autogenerado confuso; sin diferenciar auditor público vs cliente privado | `expires_at` default 30d + toggle "Link permanente (QR fachada)". Botón "Revocar" por link. Modal 2 tabs: "QR fachada" vs "Link temporal inspector" |
| 7 | Invitar colaborador | **missing** | — | No existe. `profiles.company_id` es 1:1. `AssigneePicker` asume multi-user pero no hay cómo sumar gente. Bloqueante persona 1 | Tabla `company_invitations(email, role, invited_by)` + UI Settings → "Miembros". Magic link que auto-asigna `company_id` al aceptar |
| 8 | Marco Legal → "¿qué necesito?" | **partial** | 3-5 | `LegalIndexView` filtra por giro. Detalle legal read-only. Sin botón "Añadir a mis sedes". Gerente descubre que necesita ARCSA y tiene que ir a otra pantalla a crearlo manual | `LegalPermitDetailView` CTA "Agregar este permiso a {sede}" con selector multi-sede. Conectar con `addPermitToLocation()` inexistente |
| 9 | Mapa Red multi-sede | **partial** | 1 | Canvas visual con status por sede, sin acciones. Sin filtrar por permit type, sin clic-para-renovar. Decorativo no operativo | Canvas interactivo: hover=tooltip top 3 alertas; clic=`/sedes/:id`. Filtro lateral por estado permit |
| 10 | `/renovaciones` calendario anual | **works redundante** | 1 | Misma data que `/permisos?status=por_vencer` + fecha. Jerarquía mental confusa | Fusionar: `/renovaciones` como tab dentro de `/permisos` (Lista/Calendario/Timeline) |
| 11 | Settings | **partial** | 4 tabs | Tabs: Perfil/Empresa/Notif/Seguridad. **Falta**: Miembros, Billing, Datos (export/delete). NotificationsTab cosmético mientras `NotificationPreferences` funcional existe sin montar | Reemplazar NotificationsTab. Agregar tabs "Miembros" y "Plan y facturación". "Exportar mis datos" + "Eliminar cuenta" en Seguridad |
| 12 | Consultor multi-empresa | **missing** | — | `profiles.company_id` single FK. Consultor tendría que crear 5 cuentas con 5 Gmails. Bloqueante persona 2 | Migrar a `memberships(user_id, company_id, role)` m:n + selector de empresa en header |
| 13 | Eliminar / exportar | **missing** | — | Solo `deleteDocument`. Sin `deleteLocation`, `deletePermit`, `deleteCompany`, `deleteAccount`. Sin export. Gap legal (LOPDP Ecuador) | Soft-delete por entidad (`deleted_at`) con confirmación fuerte. Endpoint `/export-my-data` ZIP con CSVs + documentos |

### 4B · Flujos missing críticos

1. **Invitar miembros al equipo** — sin esto persona 1 no puede delegar. `AssigneePicker` construido pero `profiles` filtra por `company_id` único → solo ves tu propio nombre
2. **Multi-empresa por usuario** — bloquea persona 2 entera. Schema change: `memberships` table
3. **Import CSV / Excel** — 15 sedes × 8 permits = 120 líneas manual. Se nota a los 3 min de demo
4. **"Añadir permit al catálogo desde Marco Legal"** — Marco Legal es enciclopedia, no operativo. Valor de matriz legal se pierde sin conexión a permit tracking
5. **Billing / Plan / Trial** — sin página, sin componente. Sin modelo de negocio visible. Prospecto pregunta "¿cuánto cuesta?" al minuto 2
6. **Reset password / Solicitar acceso** — links `href="#"` en `LoginView`. Si Google OAuth falla (GWS restrictivo), usuario sin camino
7. **Eliminar entidades** — sede creada por error queda zombie con sus 8 permits
8. **Deep link email alerta** — email va a `${appUrl}/dashboard`, ruta inexistente en `App.tsx`. Cae a `Navigate to="/"` sin aterrizar en permit específico
9. **Bulk edit permits** — sin forma de marcar "estos 10 son del mismo nº y fecha" (caso real: RUC único para todas las sedes)
10. **Audit trail global visible** — `PermitEventsTimeline` por permit pero sin "actividad reciente" global. Gerente no puede decir "ayer Juan subió bomberos"

### 4C · Fricciones comunes (patterns cross-flow)

- **Modal sin confirmación consistente** — `CreateLocationModal` usa `window.confirm`; `PermitDetailView` usa `confirm()` borrar doc; `RenewPermitModal` no confirma
- **Forms pre-llenan defaults agresivos** — `CompanyStep` default `business_type='restaurante'` y `city='Quito'`. Si user no lee → empresa mal clasificada → árbol permisos incorrecto
- **CTAs sin handler** — "Nuevo Permiso", "Solicita acceso", "¿Olvidaste tu contraseña?", "Cambiar foto", "Guardar cambios". Patrón repetido
- **Doble fuente de verdad** — `NotificationsTab` vs `NotificationPreferences`; `RenewalGridView` vs `/permisos?status=por_vencer`
- **Empty states sin educar** — "No hay X" + botón. App de compliance debería: "Aún no registraste tu patente municipal. Normalmente se renueva en enero. [Agregar ahora] [Recordarme en enero]"
- **Sidebar plana 7 items top** — Dashboard, Sedes, Mapa, Permisos, Renovaciones, Config, Marco Legal. Persona 3 (dueño PYME) sobrecarga. Mapa y Renovaciones uso raro
- **Sede/Local/Sucursal intercambiables** — `LocationsStep` dice "Locales / Sedes" y placeholder "Sucursal". Elegir uno
- **Fechas sin contexto relativo** — "Vence: 15/07/2026" en todas las cards. Humanizar: "Vence en 42 días (15/07/2026)"

### 4D · Top 5 mejoras de flujo por impacto

#### 1. Unificar "Renovar" en un solo flujo funcional (impacto alto · costo bajo)
Conectar `renewPermit()` (orphaned, versiona) con botón real en `PermitDetailView` + email CTA del cron que apunte a `/permisos/:id?action=renew`. Hoy: API completa + modal hecho + 0 triggers. 2 líneas de JSX desbloquean el flujo core.

#### 2. "Hoy" dashboard en vez del weather card (impacto alto · costo medio)
Reemplazar dashboard actual (resumen emocional) por **buzón operativo**: top 5 acciones ordenadas por urgencia, botón inline (subir doc / marcar en trámite / renovar). Persona 3 entra 5 min/día — debe saber en 10s qué hacer. Weather/invoice sirve para demo no uso diario.

#### 3. Multi-empresa real vía `memberships` table (impacto alto · costo alto)
Schema change: `memberships(user_id, company_id, role)` m:n + selector empresa en top bar. Desbloquea: (a) consultores (persona 2 entera), (b) invitar colaboradores (gerentes), (c) transferir ownership.

#### 4. "Agregar permit al catálogo" desde Marco Legal (impacto medio · costo bajo)
`LegalPermitDetailView` read-only → accionable: botón "Este permiso aplica a mis sedes" → selector multi-sede → crea permits en `no_registrado`. Cierra loop entre "sé qué necesito" y "lo gestiono". Marco Legal pasa de wiki decorativo a feature de conversión.

#### 5. Onboarding con "Import rápido" (impacto medio · costo medio)
`LocationsStep`: (a) "Pegar desde Excel" con paste-to-table, (b) "Duplicar última sede", (c) upload CSV con preview. Persona 1 con 15 sedes: setup 45 min → 3 min. Diferenciador que convierte demo.

---

## 5 · Top-30 orden recomendado (consolidado mega-audit + audit nuevo)

### Ship-blockers (P0) — 1 semana
1. Rotar JWT `service_role`; purgar git history; pre-commit secret scan *(mega SEC-1)*
2. Fix `handle_new_user` role literal *(mega DB-1)*
3. Normalizar `permits.type` a slugs + CHECK + FK a `permit_requirements.permit_type` *(mega DB-2 + nuevo P-1)*
4. Backfill `permit_events` para los 46 permits legacy *(nuevo P-3)*
5. Backfill alertas perdidas cron 2026-05-04 al 10 + dead-man switch *(nuevo P-12)*
6. Redeploy `send-expiry-alerts` v9 con `.ec` + secrets `ALLOWED_ORIGIN`/`APP_URL` + deep-link a `/permisos/:id` *(mega SEC-3 + nuevo missing)*
7. Wire "Nuevo Permiso" (3 sitios) + crear ruta `/permisos/nuevo` *(mega UX-1)*
8. Wire trigger `RenewPermitModal` + conectar `renewPermit()` API con transacción *(mega UX-5 + nuevo P-5, P-17)*
9. Swap `NotificationsTab` → `NotificationPreferences` en `SettingsView.tsx:22` *(mega UX-2)*
10. Wire onClick en `ProfileTab` y `SecurityTab`; controlled inputs *(mega UX-3 + nuevo UX-A10)*
11. `CompanyTab` importar `BUSINESS_TYPES` canonical 12 giros *(mega UX-4)*
12. Prefijo `--color-*` en `@theme` Tailwind 4 *(mega DS-1)*
13. Fix `permits.type` coherence → dashboard/invoice joins *(nuevo P-1)*
14. Fix `permits.status` para los 4 `vigente` con `expiry_date IS NULL` *(nuevo P-2)*
15. Reemplazar `leads` anon INSERT por edge fn con captcha *(mega SEC-2)*

### Hardening (P1) — 2-3 semanas
16. Crear ruta `/reset-password` + wire "¿Olvidaste tu contraseña?" + "Solicita acceso" *(mega + nuevo P-7)*
17. Rename "PermitOps" → "EnRegla"; logo PM → ER; quitar "Compliance" inglés *(mega UX-6 + nuevo UX-A7)*
18. Migrar 8 hooks hand-rolled a TanStack Query + convención `queryKey` *(mega + nuevo P-4)*
19. Regenerar `database.ts` types + quitar 36 `as any` + pinear generador en CI *(mega DB-4 + nuevo P-14, P-16)*
20. Columna "Responsable" real en `PermitTable` (join `assigned_to_profile_id`) *(nuevo P-9)*
21. Borrar public-link RLS malformadas; rutear anon por `get_public_permits(token)` + REVOKE funcs anon *(mega SEC-4)*
22. Uninstall 11 deps muertas (~47 MB, kills `dompurify` CVE chain) *(mega)*
23. Wire Sentry + ErrorBoundary por ruta + `esbuild.drop: ["console"]` *(mega)*
24. Lazy-load `/p/:token` + code-split bundle 1.25 MB *(mega)*
25. Style-guide copy (tuteo EC neutro sin voseo); rewrite dashboard copy *(nuevo UX-A1, A9)*

### Flujos nuevos (impacto de negocio) — 4-6 semanas
26. Multi-empresa vía `memberships` table + selector header *(nuevo flujo 12)*
27. Invitar miembros al equipo (`company_invitations` + magic link) *(nuevo flujo 7)*
28. Reemplazar dashboard por "Buzón de hoy" operativo *(nuevo flujo 3)*
29. "Agregar permit al catálogo" desde Marco Legal + `addPermitToLocation()` *(nuevo flujo 8)*
30. Import CSV/Excel + "Duplicar última sede" en `LocationsStep` *(nuevo flujo 2)*

---

## 6 · Meta-finding

**El mega-audit del 2026-05-12 sigue abierto un año después de su propuesta.** La rama `feat/dominio-v2` nació para atacar el domain redesign post user-test, no los ship-blockers del audit. Esto explica:

- 29 commits en la rama, ninguno cita ID del audit (SEC-1, DB-1, UX-*)
- Solo 1 fix coincidente (OAuth PKCE)
- Mega-audit quedó sin owner formal

Recomendación de proceso: ship-blockers P0 del mega-audit **antes** de merge a `main`, o explícitamente aceptar que `feat/dominio-v2` no los cierra y abrir rama `fix/mega-audit-p0` paralela. Si no, la deuda se duplica con cada audit.

---

## 7 · Gaps · qué no se audit en esta pasada

- Billing / payments: sin visibilidad
- Rate-limiting global (Supabase PostgREST, auth, storage)
- Backups / PITR / restore drill
- PII / log retention / LOPDP Ecuador compliance
- Admin / support tooling (impersonation, unlock signup)
- Multi-tenant boundary en catálogos (`permit_issuers`, `permit_requirements`)
- Cron heartbeat / dead-man switch (confirmado roto 5 días sin alerta)
- Email deliverability (SPF/DKIM/DMARC, bounce, unsubscribe)
- Browser compat / SW / SEO
- Lighthouse scores
- Penetration test público `/p/:token`
- Export CSV/Excel/PDF de permisos/sedes
- Backend de Landing / captura leads (si vive en otro repo)

---

**Fecha:** 2026-05-13
**Branch:** `feat/dominio-v2` · 29 commits ahead main, sin push ni PR
**Verdad operativa:** producción = `app.enregla.ec`. 4 usuarios reales admin, pre-2026-05-10. DB tiene 46 permits, 2 permit_events, 22 valores distintos de `permits.type`.
