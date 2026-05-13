# Audit 2026-05-13 — Producto · UX · Flujos

Audit de continuación sobre el mega-audit del 2026-05-12, en dos partes:

1. **Verificación de fixes del mega-audit**: qué P0/P1 siguen rotos en `feat/dominio-v2`.
2. **Nuevo audit** enfocado en funcionamiento del producto, experiencia de usuario y calidad de flujos.

## Archivos

- [FINAL-REPORT.md](./FINAL-REPORT.md) — reporte canónico (source of truth para agentes)
- [FINAL-REPORT.html](./FINAL-REPORT.html) — reporte visual para revisión humana
- [verification-mega-audit.md](./verification-mega-audit.md) — verificación punto a punto del audit 2026-05-12
- [findings-product.md](./findings-product.md) — hallazgos nuevos de funcionamiento
- [findings-ux.md](./findings-ux.md) — hallazgos nuevos de UX/copy/design
- [findings-flows.md](./findings-flows.md) — mapa de flujos + mejoras propuestas

## Método

- Branch: `feat/dominio-v2` (29 commits ahead de `main`, sin push ni PR, 4 usuarios reales admin)
- 3 agentes en paralelo para verificación del mega-audit (DB/Sec · Frontend/UX · DS/Build)
- 3 agentes en paralelo para hallazgos nuevos (Producto · UX · Flujos)
- Principio: verify behavior, not shape — todo P0 nuevo está respaldado por `path:line` o query SQL

## Veredicto rápido

El mega-audit del 2026-05-12 **NO está cerrado**: de 40 hallazgos verificados, solo **1 está FIXED** (OAuth callback PKCE + `.ec`). El resto sigue roto o parcial. Además hay **22 hallazgos nuevos** no documentados antes, incluyendo:

- 13/22 permits tienen `type` con casing legacy que rompe todos los joins con `permit_requirements` → dashboard miente
- 4 permits `vigente` con `expiry_date IS NULL` → nunca alertan, inflan % compliance
- 5 días de cron `send-expiry-alerts` fallidos (2026-05-04 al 10) sin backfill → alertas perdidas
- `renewPermit()` API de 100 LOC completa pero **orphaned** — nadie la llama
- Multi-empresa/miembros/billing/import-CSV **missing**
