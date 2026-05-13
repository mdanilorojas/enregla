# Verificación mega-audit 2026-05-12 · Raw findings

**Branch:** `feat/dominio-v2` · **Fecha:** 2026-05-13

3 agentes en paralelo verificaron 40 hallazgos P0/P1 del [FINAL-REPORT.html](../2026-05-12-mega-audit/FINAL-REPORT.html).

## Resumen

| Dominio | Verificados | FIXED | PARTIAL | BROKEN |
|---|---|---|---|---|
| DB / Security / Auth | 13 | 1 | 1 | 11 |
| Frontend / UX | 12 | 0 | 3 | 9 |
| DS / Build / Deps / Observability | 15 | 0 | 2 | 13 |
| **Total** | **40** | **1** | **6** | **33** |

## Agente 1 · DB / Security / Auth

Reporte completo: ver tabla sección 1A del `FINAL-REPORT.md`.

**Nuevos riesgos descubiertos:**
1. `permits_select` RLS `TO public` sin referenciar `public_links` — peor que SEC-4
2. `get_public_permits` + `increment_public_link_view` SECURITY DEFINER anon-executable
3. Auth Leaked Password Protection (HIBP) disabled
4. `profiles` CHECK role no verificado — si existe `admin|operator|viewer`, DB-1 detona signup nuevo con OAuth funcionando

## Agente 2 · Frontend / UX

Reporte completo: ver tabla sección 1B del `FINAL-REPORT.md`.

**Flujos críticos rotos (golden-path):**
1. Signup → onboarding: marca "PermitOps" en ProfileStep y sidebar
2. Sede → permit → crear: imposible. "Nuevo Permiso" en PermitListView (×2) `<Button>` sin onClick
3. Permit → renovar: RenewPermitModal montado sin trigger
4. Settings → empresa: 4/12 giros, si user onboardó con `farmacia` el select no tiene la opción
5. Settings → perfil/seguridad: "Guardar cambios", "Cambiar foto", "Cerrar sesiones" decorativos
6. Settings → notificaciones: toggles no persisten; `NotificationPreferences` huérfano
7. Forgot password: `resetPasswordForEmail` → `/reset-password` inexistente → `Navigate to="/"` → loop
8. Documento público compartido (QR): usa PostgREST directo saltando RPC `get_public_permits`

## Agente 3 · Design System / Build / Deps / Observability

Reporte completo: ver tabla sección 1C del `FINAL-REPORT.md`.

**Inesperado descubierto:**
- `src/data/legal-references.ts` no listado en audit anterior; vive junto a los dos muertos
- `DesignSystemShowcase` + `DesignSystemView` duplicados en prod, ambos ruteados
- `lucide-react@^1.14.0`, `typescript@~6.0.2`, `vite@^8` versiones sospechosas
- `config/vite.config.ts` layout no-convencional — puede romper Vercel/Sentry plugins
- `DashboardSedeCard.tsx:14`, `DashboardWidget.tsx:44`, `SedeNode.tsx:19` anclan `--ds-orange-500` como "warning" (DS-3 regression en componentes core)

## Veredicto

**1 FIXED de 40.** Mega-audit no está cerrado. Rama `feat/dominio-v2` se enfocó en domain redesign, no en ship-blockers.
