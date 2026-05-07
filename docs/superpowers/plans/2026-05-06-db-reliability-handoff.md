# DB Reliability Sprint — Handoff

**Fecha de pausa**: 2026-05-06
**Branch**: `feature/db-reliability` (local, NO pusheada todavía)
**Base**: `main` @ `e46585c` (PR #5 mergeado)
**Plan**: `docs/superpowers/plans/2026-05-06-db-reliability.md` (25 tareas)
**Spec**: `docs/superpowers/specs/2026-05-06-db-reliability-design.md`

---

## Estado: 5 de 25 tareas completadas (20%)

### ✅ Completadas en esta sesión (5 commits)

| # | Task | Commit |
|---|---|---|
| T1 | Env cleanup + artifacts delete | `3796027` |
| T5 | GitHub Actions CI workflow | `b29ec3f` |
| T6 | vercel.json security headers + asset cache | `2ec52a4` |
| T7 | Install TanStack Query + devtools | `d29b7b5` |
| T8 | queryClient.ts + withTimeout (TDD, 3 tests pass) | `3928fdb` |

### 🚫 Bloqueadas por MCP de Supabase desconectado

| # | Task | Por qué |
|---|---|---|
| T2 | Migration 015 — índices faltantes | Necesita `mcp__supabase__apply_migration` |
| T3 | Migration 016 — RLS helpers STABLE | Necesita `mcp__supabase__apply_migration` |
| T4 | Regenerar `src/types/database.ts` | Necesita `mcp__supabase__generate_typescript_types` |

**Para desbloquear**: Re-autenticar MCP al inicio de la próxima sesión (el token OAuth expira tras unas horas de inactividad). Proceso: invocar `mcp__supabase__authenticate`, abrir URL en browser, autorizar, pegar URL de callback.

### ⏳ Pendientes (17 tareas)

| Orden recomendado | # | Task |
|---|---|---|
| 1 | T9 | Wire QueryClientProvider en `main.tsx` |
| 2-8 | T10-T16 | Migrar 8 hooks a useQuery/useMutation (paralelizable) |
| 9 | T17 | `src/lib/errors.ts` + classifyError (TDD) |
| 10 | T18 | Componente `DataErrorBanner` |
| 11 | T19 | Componente `ErrorBoundary` global |
| 12 | T20 | Instalar + configurar Sentry |
| 13 | T21 | Wire Sentry + ErrorBoundary en `main.tsx` |
| 14 | T22 | Reemplazar skeleton-on-error en 5 views |
| 15 | T23 | Code-splitting con React.lazy() |
| 16 | T24 | Docs `docs/deployment/environment-variables.md` |
| 17 | T25 | Validación final + smoke test |

---

## Contexto para retomar

**Estado del workspace**:
- Branch `feature/db-reliability` tiene 5 commits encima de `main`
- Archivo sin trackear: `src/features/dashboard/DashboardView.tsx` (M) — es un refactor tuyo cambiando a `LocationCardV2`, **NO es del sprint**. Deja como está hasta que decidas qué hacer con él.

**Dependencias ya instaladas** (esta sesión):
- `@tanstack/react-query@^5.100.9`
- `@tanstack/react-query-devtools@^5.100.9`

**Aún por instalar**:
- `@sentry/react@^8` (en T20)

**Archivos clave creados**:
- `.github/workflows/ci.yml` — CI que corre en PR y push a main
- `src/lib/queryClient.ts` — QueryClient global + `withTimeout` + `TimeoutError`
- `src/lib/__tests__/queryClient.test.ts` — 3 tests pasando

**Archivos clave modificados**:
- `vercel.json` — security headers
- `.env.example` — flags muertos removidos, `VITE_SENTRY_DSN` agregado
- `README.md` — limpieza de referencia a flag borrado
- `package.json` — TanStack Query agregado

---

## Para arrancar mañana

1. **Re-autenticar MCP de Supabase** (T2-T4 bloqueadas sin esto)
2. Abrir este handoff y el plan original: `docs/superpowers/plans/2026-05-06-db-reliability.md`
3. Opciones de orden:
   - **Opción A** (recomendada): Ejecutar T2, T3, T4 primero para desbloquear completamente, luego T9 → T25 en orden.
   - **Opción B**: Seguir con T9 (no necesita MCP) y hacer T2-T4 al final.
4. Invocar `superpowers:subagent-driven-development` para continuar con el flujo de subagents por tarea
5. Marcar task list: los IDs de TaskCreate de esta sesión se perderán — crea de nuevo al arrancar, usando el plan como referencia

## Notas y decisiones de la sesión

- **T1 tuvo scope expansion menor**: el implementer también editó `README.md` para remover una referencia a `VITE_ENABLE_PUBLIC_LINKS` que habría quedado huérfana. Aprobado por spec reviewer como cleanup razonable.
- **Spec/quality review saltado para T5, T6, T7**: son archivos de config (YAML, JSON, `npm install`), sin lógica de negocio que revisar. Solo T1 y T8 pasaron por el ciclo completo.
- **T8 (TDD)**: test falló primero (module-not-found) como esperado, después implementación pasó los 3 tests. TDD discipline confirmada.
- **Convención de tests mixta en el repo**: hay tests colocados a la par (`src/lib/dashboard-metrics.test.ts`) y en carpetas `__tests__/`. T8 introdujo la primera carpeta `__tests__/` en `src/lib/`. No bloqueante, pero alguien debería unificar en el futuro.
- **Plan original mencionaba `015_` y `016_` como nombres de migrations**. El remote de Supabase usa timestamps (ej. `20260422174931_*`). Cuando ejecutes T2 y T3, usa nombres que no colisionen: por ejemplo `add_missing_indexes` y `mark_rls_helpers_stable` (el MCP le pone el timestamp automáticamente). **No uses `015`/`016`** — chocan con otras migrations ya aplicadas que no están en git.

## Próxima sesión: primer mensaje sugerido

> Retomo el sprint de DB reliability. Estado en `docs/superpowers/plans/2026-05-06-db-reliability-handoff.md`. Branch `feature/db-reliability`. Re-autentica MCP de Supabase y sigue con T2 si puedes, sino con T9.
