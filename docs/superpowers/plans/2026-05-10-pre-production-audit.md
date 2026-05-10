# Pre-Production Audit Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Tasks use checkbox (`- [ ]`) syntax.

**Goal:** Auditar y remediar 100% de bloqueantes de producción antes de vender a clientes reales. Bloqueante = fuga de datos entre empresas, pérdida de datos, o auth rota.

**Architecture:** 8 fases. Fases 2, 4, 5, 6 despachan agentes en paralelo. Cada agente recibe briefing rico (rol, alcance, formato de entrega, criterios de severidad). Consolidación manual para evitar pérdida de señal. Branch aislada: `audit/pre-production-2026-05-10`.

**Tech Stack:** React 19 + Vite + TypeScript + Supabase (Postgres + RLS + Storage + Edge Functions + pg_cron) + React Query + Zustand + Tailwind + shadcn/radix.

**Alcance confirmado:** App principal, DB Supabase, Backend/edge-functions. Excluye GTM/landing/marketing.

**Severidad estricta:**
- **BLOCKER:** Cualquier riesgo de exposición de datos entre `company_id` distintos, pérdida de datos, RLS bypasseable, auth rota, secretos en cliente.
- **HIGH:** Bugs funcionales en flows core (login, onboarding, crear permiso, subir doc, dashboard).
- **MEDIUM:** UX rota, perf pobre, observabilidad faltante, código muerto grande.
- **LOW:** Estilo, typos, naming.

Usuario explícito: "fixes el 100% de cosas que encuentres mal". No paramos hasta terminar.

---

## Phase 1: Audit Plan (este documento) ✅

## Phase 2: Dispatch Parallel Audit Agents

Despachamos 7 agentes de auditoría **en paralelo**, cada uno con scope no-solapado y briefing rico. Cada agente entrega un reporte estructurado con findings y severidad propuesta.

### Agent 2.1: DB Schema + RLS Auditor
**Scope:** Todas las migraciones en `supabase/migrations/*.sql`, schema vigente en Supabase remoto, políticas RLS por tabla, soporte demo mode vs producción, indexing básico.
**Herramientas:** MCP supabase (list_tables, list_migrations, execute_sql, get_advisors), Read, Grep.
**Entrega:** Lista de findings con: tabla, política, severidad, evidencia (SQL que demuestra el problema), fix propuesto.

### Agent 2.2: DB Performance + Query Auditor
**Scope:** N+1 queries, falta de índices, fetches redundantes desde frontend, tamaño de payloads, uso correcto de `select(*)` vs columnas específicas, `.single()` vs `.maybeSingle()`.
**Herramientas:** Grep en `src/lib/api/`, `src/hooks/use*`, `mcp__supabase__execute_sql` para EXPLAIN.
**Entrega:** Findings por archivo:línea, medición de impacto estimado.

### Agent 2.3: Frontend Architecture Auditor
**Scope:** Estructura `src/features/`, duplicaciones, dead code, tipos faltantes, hooks mal usados (stale closures, missing deps), error boundaries, estados de carga, manejo de errores.
**Herramientas:** Grep, Read en `src/features/`, `src/hooks/`, `src/components/`.
**Entrega:** Findings por feature y por tipo (dead code, missing error handling, stale closures, etc.).

### Agent 2.4: Frontend Security Auditor
**Scope:** XSS (dangerouslySetInnerHTML, innerHTML), secretos hardcoded, URLs/llaves expuestas en cliente, validación de input (Zod), CSRF considerations, localStorage/sessionStorage de datos sensibles, `window.open` con target=_blank sin noopener.
**Herramientas:** Grep para patrones peligrosos, Read.
**Entrega:** Findings con archivo:línea y vector de ataque.

### Agent 2.5: Backend / Edge Functions Auditor
**Scope:** `supabase/functions/send-expiry-alerts/`, cron jobs (`013_enable_pg_cron.sql`), secrets management, rate limiting, error handling, logging, idempotencia, service_role usage.
**Herramientas:** Read, Grep, mcp__supabase__list_edge_functions, mcp__supabase__get_logs.
**Entrega:** Findings por función/cron.

### Agent 2.6: Auth / Session / End-to-End RLS Auditor
**Scope:** Flujo completo login → session → queries. Verifica que toda query respete RLS, que demo mode no sea bypass explotable, que `auth.uid()` esté disponible donde se asume, que onboarding no exponga datos antes de asignar company_id.
**Herramientas:** Read `src/lib/auth.ts`, `src/hooks/useAuth.ts`, `src/components/Auth/`, Grep para usos de `supabase.auth`, ejecuta consultas de verificación con MCP.
**Entrega:** Traza del flujo auth + findings.

### Agent 2.7: Storage + File Upload Security Auditor
**Scope:** Políticas `storage.objects`, flujo de upload de documentos, validación de MIME, tamaño máximo, nombres de archivo (path traversal), acceso público vs firmado, bucket configs.
**Herramientas:** Read `src/lib/storage.ts`, `src/lib/api/documents.ts`, `src/components/documents/`, migraciones 005/006/007, MCP para inspeccionar buckets.
**Entrega:** Findings con vector y fix.

### Tasks

- [ ] **Step 1: Dispatch 7 audit agents in parallel**

Single message with 7 Agent tool calls, subagent_type=general-purpose, each with full briefing per sections 2.1-2.7 above. All run in foreground (we need results before proceeding).

- [ ] **Step 2: Collect all 7 reports**

Save raw outputs mentally/in context. Do NOT write to disk yet — Phase 3 consolidates.

## Phase 3: Consolidate Findings

- [ ] **Step 1: Merge reports into single triage doc**

Create `docs/superpowers/reviews/2026-05-10-audit-triage.md` with all findings grouped by: area (DB/FE/BE/Auth/Storage), severity (BLOCKER/HIGH/MEDIUM/LOW), and dedupe (same issue raised by multiple agents → one entry with cross-refs).

- [ ] **Step 2: Re-classify severity using strict criteria**

User instruction: BLOCKER = data leak between companies, data loss, auth broken. Override agent severity if wrong.

- [ ] **Step 3: Commit triage doc**

```bash
git add docs/superpowers/reviews/2026-05-10-audit-triage.md
git commit -m "audit: consolidate findings from 7 parallel audit agents"
```

## Phase 4: Fix BLOCKERs

- [ ] **Step 1: For each BLOCKER, determine independence**

Group blockers into batches. Blockers in same file/migration must be serial. Independent blockers run in parallel.

- [ ] **Step 2: Dispatch fix agents in parallel per batch**

Each agent receives: finding description, file:line, evidence, proposed fix, verification command. Agent must include test or verification SQL proving fix works.

- [ ] **Step 3: Review each fix before accepting**

For DB fixes: run the RLS verification query as demo user + as authenticated user. For code fixes: run tests + build.

- [ ] **Step 4: Commit after each batch**

```bash
git commit -m "audit(fix): <blocker description>"
```

## Phase 5: Fix HIGH and MEDIUM

Same pattern as Phase 4, but in larger batches (lower risk per change).

## Phase 6: Re-audit

- [ ] **Step 1: Dispatch 3 verification agents in parallel**

- Agent 6.1: Re-audit DB (RLS + storage) end-to-end with demo + real user queries
- Agent 6.2: Re-audit auth flow end-to-end
- Agent 6.3: Grep for regressions — new instances of patterns we just fixed

- [ ] **Step 2: If agents find new issues, loop back to Phase 4**

User instruction: "no pares hasta que termines". No confirmation required.

## Phase 7: Full Verification Suite

- [ ] **Step 1: TypeScript check**

Run: `npx tsc -b config/tsconfig.json --noEmit`
Expected: 0 errors.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 0 errors (warnings OK).

- [ ] **Step 3: Tests**

Run: `npm test -- --run`
Expected: all green.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Supabase advisors**

Run: `mcp__supabase__get_advisors({ type: "security" })` and `{ type: "performance" })`
Expected: 0 new issues (pre-existing ones documented).

## Phase 8: Final Consolidated Report

- [ ] **Step 1: Write canonical MD report**

`docs/superpowers/reviews/2026-05-10-pre-production-audit.md` with:
- Executive summary (total findings by severity, fix rate)
- Per-finding detail (area, severity, description, evidence, fix commit, verification)
- Residual risks (stuff knowingly deferred with justification)
- Production readiness verdict (GO / NO-GO / GO with caveats)

- [ ] **Step 2: Write HTML companion**

`docs/superpowers/reviews/2026-05-10-pre-production-audit.html` — the doc user actually reads. Self-contained, visual hierarchy, collapsible sections per finding, severity color coding, scorecard dashboard. Rule: no external CSS.

- [ ] **Step 3: Commit and summarize**

```bash
git add docs/superpowers/reviews/2026-05-10-pre-production-audit.{md,html}
git commit -m "audit: final pre-production audit report + verification evidence"
```

Final message to user: summary of scorecard + link to HTML + verdict.
